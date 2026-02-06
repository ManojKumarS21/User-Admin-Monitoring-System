require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./config/db");

const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const analyticsRoutes = require("./routes/analytics");

app.use(cors());
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/analytics", analyticsRoutes);

/* ---------------- ACTIVE USERS ---------------- */

let activeUsers = {};
// userId : { socket, name, role }

/* ---------------- WEBSOCKET ---------------- */

wss.on("connection", (ws) => {

  console.log("WS Client Connected");

  ws.on("message", (msg) => {

    const data = JSON.parse(msg.toString());

    /* USER ONLINE */
    if (data.type === "USER_ONLINE") {

      ws.userId = data.userId;

      activeUsers[data.userId] = {
        socket: ws,
        name: data.name,
        role: data.role
      };

      broadcastUsers();
    }

    /* ADMIN -> USER */
    if (data.type === "ADMIN_TO_USER") {
      const targetId = data.toUserId || data.targetId; // Support both for safety
      const user = activeUsers[targetId];

      if (user) {
        user.socket.send(JSON.stringify({
          type: "PRIVATE_MESSAGE",
          from: "Admin",
          message: data.message
        }));
      }
    }

    /* USER -> ADMIN */
    if (data.type === "USER_TO_ADMIN") {
      const sender = activeUsers[ws.userId];
      const fromName = sender ? sender.name : "User";

      Object.values(activeUsers)
        .filter(u => u.role === "admin")
        .forEach(admin => {
          admin.socket.send(JSON.stringify({
            type: "PRIVATE_MESSAGE",
            from: fromName,
            message: data.message,
            fromId: ws.userId
          }));
        });
    }

  });

  ws.on("close", () => {

    if (ws.userId) {
      delete activeUsers[ws.userId];
    }

    broadcastUsers();
  });

});

/* ---------------- BROADCAST ---------------- */

function broadcastUsers() {

  const users = Object.keys(activeUsers).map(id => ({
    userId: id,
    name: activeUsers[id].name,
    role: activeUsers[id].role
  }));

  const payload = JSON.stringify({
    type: "ACTIVE_USERS",
    users
  });

  Object.values(activeUsers)
    .forEach(u => u.socket.send(payload));
}

/* ---------------- API ---------------- */

app.get("/", (req, res) => {
  res.send("Server running");
});

app.post("/register", async (req, res) => {

  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [name, email, hash],
    err => {
      if (err) return res.send("Email already exists");
      res.send("Registered");
    }
  );
});

app.post("/login", (req, res) => {

  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, result) => {

      if (result.length === 0) return res.send("User not found");

      const valid = await bcrypt.compare(password, result[0].password);
      if (!valid) return res.send("Wrong password");

      if (!result[0].is_approved)
        return res.send("Waiting for admin approval");

      const token = jwt.sign(
        { id: result[0].id, role: result[0].role },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "1d" }
      );

      res.json({
        token,
        role: result[0].role,
        userId: result[0].id,
        name: result[0].name
      });

    }
  );
});

/* ADMIN */

app.get("/admin/pending", (req, res) => {
  db.query(
    "SELECT id,name FROM users WHERE is_approved=false",
    (e, r) => res.json(r)
  );
});

app.put("/admin/approve/:id", (req, res) => {
  db.query(
    "UPDATE users SET is_approved=true WHERE id=?",
    [req.params.id],
    () => res.send("Approved")
  );
});

app.delete("/admin/reject/:id", (req, res) => {
  db.query(
    "DELETE FROM users WHERE id=?",
    [req.params.id],
    () => res.send("Rejected")
  );
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on http://127.0.0.1:${PORT}`);
});
