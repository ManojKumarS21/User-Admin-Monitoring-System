require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { db } = require("./config/db");

const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const analyticsRoutes = require("./routes/analytics");

app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000", "http://192.168.0.201:3000", "https://user-admin-monitoring-system.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
      if (err) {
        console.error("❌ [Login DB Error]", err);
        return res.status(500).send("Database error");
      }

      if (!result || result.length === 0) return res.send("User not found");

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

/* ---------------- JWT MIDDLEWARE ---------------- */

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
}

/* ---------------- USER PROFILE API ---------------- */


//------LEETCODE------//


// GET /api/user/profile — fetch current user's profile
app.get("/api/user/profile", verifyToken, (req, res) => {
  db.query(
    "SELECT id, name, email, role, leetcode_username, hackerrank_username, hackerearth_username, github_username FROM users WHERE id = ?",
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!result || result.length === 0) return res.status(404).json({ error: "User not found" });
      res.json(result[0]);
    }
  );
});

// PUT /api/user/leetcode — update current user's LeetCode username
app.put("/api/user/leetcode", verifyToken, (req, res) => {
  const { leetcode_username } = req.body;
  if (leetcode_username !== null && typeof leetcode_username !== "string") {
    return res.status(400).json({ error: "Invalid leetcode_username" });
  }
  const username = leetcode_username ? leetcode_username.trim() : null;
  db.query(
    "UPDATE users SET leetcode_username = ? WHERE id = ?",
    [username, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true, leetcode_username: username });
    }
  );
});

//------HACKERRANK------//

// PUT /api/user/hackerrank — update current user's HackerRank username
app.put("/api/user/hackerrank", verifyToken, (req, res) => {
  const { hackerrank_username } = req.body;
  if (hackerrank_username !== null && typeof hackerrank_username !== "string") {
    return res.status(400).json({ error: "Invalid hackerrank_username" });
  }
  const username = hackerrank_username ? hackerrank_username.trim() : null;
  db.query(
    "UPDATE users SET hackerrank_username = ? WHERE id = ?",
    [username, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true, hackerrank_username: username });
    }
  );
});

// GET /api/leetcode-stats/:username — proxy to LeetCode GraphQL
app.get("/api/leetcode-stats/:username", async (req, res) => {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: "Username required" });

  const query = `
    query getUserProfile($username: String!) {
      allQuestionsCount { difficulty count }
      matchedUser(username: $username) {
        username
        profile { ranking userAvatar realName }
        submitStats: submitStatsGlobal {
          acSubmissionNum { difficulty count submissions }
        }
      }
    }
  `;

  try {
    const { data } = await axios.post(
      "https://leetcode.com/graphql",
      { query, variables: { username } },
      {
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://leetcode.com",
          "User-Agent": "Mozilla/5.0"
        },
        timeout: 10000
      }
    );

    const user = data?.data?.matchedUser;
    if (!user) return res.status(404).json({ error: "LeetCode user not found" });

    const allQ = data?.data?.allQuestionsCount || [];
    const totalAll = allQ.find(q => q.difficulty === "All")?.count || 3000;

    const acStats = user.submitStats?.acSubmissionNum || [];
    const solvedAll = acStats.find(s => s.difficulty === "All")?.count || 0;
    const solvedEasy = acStats.find(s => s.difficulty === "Easy")?.count || 0;
    const solvedMedium = acStats.find(s => s.difficulty === "Medium")?.count || 0;
    const solvedHard = acStats.find(s => s.difficulty === "Hard")?.count || 0;

    const progress = totalAll > 0 ? ((solvedAll / totalAll) * 100).toFixed(2) : "0.00";
    const score = (solvedEasy * 1 + solvedMedium * 2 + solvedHard * 3).toFixed(0);

    res.json({
      username: user.username,
      avatar: user.profile?.userAvatar || null,
      ranking: user.profile?.ranking || 0,
      totalProblems: totalAll,
      solved: { all: solvedAll, easy: solvedEasy, medium: solvedMedium, hard: solvedHard },
      progress: parseFloat(progress),
      score: parseInt(score),
    });
  } catch (err) {
    console.error("[LeetCode Stats Error]", err.message);
    res.status(502).json({ error: "Failed to fetch LeetCode stats" });
  }
});

//------HACKEREARTH------//

// PUT /api/user/hackerearth — update current user's HackerEarth username
app.put("/api/user/hackerearth", verifyToken, (req, res) => {
  const { hackerearth_username } = req.body;
  if (hackerearth_username !== null && typeof hackerearth_username !== "string") {
    return res.status(400).json({ error: "Invalid hackerearth_username" });
  }
  const username = hackerearth_username ? hackerearth_username.trim() : null;
  db.query(
    "UPDATE users SET hackerearth_username = ? WHERE id = ?",
    [username, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true, hackerearth_username: username });
    }
  );
});

// GET /api/hackerearth-stats/:username — proxy to HackerEarth
app.get("/api/hackerearth-stats/:username", async (req, res) => {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const response = await axios.get(`https://www.hackerearth.com/@${username}/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      timeout: 10000
    });

    const html = response.data;

    // HackerEarth uses Next.js server actions / streaming. 
    // Data is pushed in self.__next_f.push([1,"..."]) calls.
    const pushRegex = /self\.__next_f\.push\(\[1,"(.*?)"\]\)/g;
    let pushMatch;
    let fullDataString = "";
    while ((pushMatch = pushRegex.exec(html)) !== null) {
      let content = pushMatch[1];
      content = content.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      fullDataString += content;
    }

    const startToken = '"profileData":';
    const startIndex = fullDataString.indexOf(startToken);
    if (startIndex === -1) {
      console.warn(`[HackerEarth] Could not find profileData in combined strings for ${username}`);
      return res.status(404).json({ error: "HackerEarth stats not found." });
    }

    const braceStart = fullDataString.indexOf('{', startIndex + startToken.length);
    if (braceStart === -1) return res.status(404).json({ error: "Invalid profile data format." });

    let balance = 0, braceEnd = -1;
    for (let i = braceStart; i < fullDataString.length; i++) {
      if (fullDataString[i] === '{') balance++;
      else if (fullDataString[i] === '}') {
        if (--balance === 0) { braceEnd = i; break; }
      }
    }

    if (braceEnd === -1) return res.status(404).json({ error: "Failed to parse profile data braces." });

    let profileData;
    try {
      profileData = JSON.parse(fullDataString.substring(braceStart, braceEnd + 1));
    } catch (e) {
      console.error("[HackerEarth] JSON Parse Error:", e.message);
      return res.status(502).json({ error: "Failed to parse HackerEarth data" });
    }

    const badges = (profileData.global_badges?.badges || []).map(b => ({
      name: b.badge?.name,
      stars: b.badge?.level || 0,
      icon: b.badge?.image_url,
      points: b.badge?.points || 0
    }));

    res.json({
      username: username,
      fullName: profileData.full_name || username,
      avatar: profileData.avatar || null,
      score: profileData.global_badge_progress?.current_score || 0,
      location: profileData.location || "Unknown",
      badges: badges.slice(0, 5)
    });

  } catch (err) {
    console.error("[HackerEarth Stats Error]", err.message);
    res.status(502).json({ error: "Failed to fetch HackerEarth stats" });
  }
});

//------GITHUB------//

// PUT /api/user/github — update current user's GitHub username
app.put("/api/user/github", verifyToken, (req, res) => {
  const { github_username } = req.body;
  if (github_username !== null && typeof github_username !== "string") {
    return res.status(400).json({ error: "Invalid github_username" });
  }
  const username = github_username ? github_username.trim() : null;
  db.query(
    "UPDATE users SET github_username = ? WHERE id = ?",
    [username, req.user.id],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ success: true, github_username: username });
    }
  );
});

// GET /api/github-stats/:username — proxy to GitHub
app.get("/api/github-stats/:username", async (req, res) => {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const response = await axios.get(`https://api.github.com/users/${username}`, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 10000
    });

    const data = response.data;
    res.json({
      username: data.login,
      fullName: data.name || data.login,
      avatar: data.avatar_url,
      bio: data.bio || "",
      repos: data.public_repos,
      followers: data.followers,
      following: data.following,
      location: data.location || "Unknown",
      blog: data.blog || "",
      company: data.company || ""
    });
  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ error: "GitHub user not found" });
    }
    console.error("[GitHub Stats Error]", err.message);
    res.status(502).json({ error: "Failed to fetch GitHub stats" });
  }
});

//------HACKERRANK------//

// GET /api/hackerrank-stats/:username — proxy to HackerRank
app.get("/api/hackerrank-stats/:username", async (req, res) => {
  const { username } = req.params;
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const [profileRes, badgesRes] = await Promise.all([
      axios.get(`https://www.hackerrank.com/rest/contests/master/hackers/${username}/profile`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 10000
      }),
      axios.get(`https://www.hackerrank.com/rest/hackers/${username}/badges`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 10000
      })
    ]);

    const profile = profileRes.data?.model;
    const badgesData = badgesRes.data?.models || [];

    if (!profile) return res.status(404).json({ error: "HackerRank user not found" });

    const badges = badgesData.map(b => ({
      name: b.badge_name,
      stars: b.stars,
      icon: b.badge_icon
    }));

    res.json({
      username: profile.username,
      avatar: profile.avatar || null,
      solvedCount: profile.submission_count || 0,
      followers: profile.followers_count || 0,
      badges: badges
    });
  } catch (err) {
    console.error("[HackerRank Stats Error]", err.message);
    res.status(502).json({ error: "Failed to fetch HackerRank stats" });
  }
});

/* ADMIN */

app.get("/admin/users", (req, res) => {
  db.query(
    "SELECT id, name, email, role, is_approved, created_at FROM users ORDER BY name ASC",
    (e, r) => {
      if (e) return res.status(500).json({ error: e.message });
      res.json(r);
    }
  );
});

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
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
