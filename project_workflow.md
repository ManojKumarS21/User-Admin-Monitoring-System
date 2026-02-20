# Project Workflow: Admin-User Dashboard Portal

This project is a full-stack **Real-Time Admin-User Portal** designed for managed user access and instant communication. Below is the detailed workflow and architectural breakdown to use for your interview.

---

## 1. Project Overview
A secure platform where users register and wait for manual admin approval before they can access the dashboard. Once approved, users and admins can communicate in real-time via WebSockets.

## 2. Technical Stack
- **Frontend**: Next.js 14/15 (App Router), Tailwind CSS, Lucide React (Icons).
- **Backend**: Node.js, Express.js.
- **Database**: MySQL (User persistence, approval states).
- **Real-Time**: WebSockets (`ws` library).
- **Security**: JWT (Session management), Bcrypt (Password hashing).

---

## 3. Core Workflow

### A. User Registration Flow
1. **Frontend**: User submits Registration Form (`/register`).
2. **Backend**: 
    - Password is hashed using **Bcrypt** for security.
    - User is inserted into MySQL with `is_approved = false` by default.
3. **Outcome**: The user is registered but cannot login yet.

### B. Admin Approval Flow
1. **Admin Login**: Admin logs in to the Admin Dashboard (`/admin`).
2. **Fetch Pending**: Backend retrieves all users where `is_approved = false`.
3. **Approve Action**: Admin clicks "Approve". Backend updates the database record to `is_approved = true`.

### C. Authentication Flow (Login)
1. **Login Request**: User submits credentials.
2. **Validation**: 
    - Backend checks if user exists.
    - Compares hashed password.
    - **Crucial Step**: Checks `is_approved` status. If `false`, login is rejected.
3. **Session**: On success, backend signs a **JWT (JSON Web Token)** containing the user ID and role.

### D. Real-Time Communication Flow
1. **Socket Connection**: Upon entering the dashboard, the client initiates a WebSocket connection to the server.
2. **Identity Handshake**: Client sends a `USER_ONLINE` event with their ID and role.
3. **Presence**: The server maintains a list of `activeUsers` in memory.
4. **Messaging**:
    - **User -> Admin**: Message sent via socket, server broadcasts to all connected admins.
    - **Admin -> User**: Admin sends a private message to a specific User ID.

### E. Power BI Data Visualization Flow
1. **Upload**: Admin uploads a data file (CSV/JSON/Excel).
2. **Processing**: Backend flattens data, sanitizes keys, and **truncates to 70 columns** to stay within Power BI Push API limits.
3. **Sync**: Backend creates a "Push Dataset" via Microsoft Azure APIs and uploads the data.
4. **Rebind**: The master report is rebound to the new dataset dynamically.
5. **Visualization**: Admin sees the updated report instantly within the dashboard.

---

## 4. Key Technical Features (Interview Highlights)

### 🚀 Real-Time Presence
The server tracks active sockets mapped to User IDs. When a user connects or disconnects, the server broadcasts an updated `ACTIVE_USERS` list to all connected clients, allowing the UI to show who is online instantly.

### 🔒 Multi-Layered Security
- **Bcrypt**: Ensures that even if the database is compromised, passwords are not exposed.
- **JWT**: Stateless authentication that is secure and scalable.
- **Admin Middleware**: Server-side checks to ensure only admins can hit approval endpoints.

### 🛠️ Session Isolation (Tab Issue Fix)
We used `sessionStorage` (or unique tab IDs) to prevent data collision. This allows an Admin and a User to be logged in on the same browser in different tabs without their messages or sessions interfering with each other.

### 📊 Power BI Integration: Pros & Cons

| Feature | Pros (Advantages) | Cons (Limitations) |
| :--- | :--- | :--- |
| **Data Updates** | **Instant Visualization**: Near real-time data availability via Push API. | **Stateless**: Each upload is a fresh session; no automatic data merging. |
| **System Load** | **Reduced DB Stress**: Data is stored in Power BI, not our MySQL server. | **Memory Usage**: Backend must flatten large JSON/Excel files in memory. |
| **Scale** | **Dynamic Rebinding**: Supports switching datasets on-the-fly. | **Column Limit**: Hard 75-column limit (System enforced at 70). |
| **UX** | **Seamless Embedding**: Report appears directly in the Admin portal. | **Truncation**: Excessive columns are automatically trimmed for safety. |

---

## 5. Potential Interview Questions & Answers

**Q: Why use WebSockets instead of Polling?**  
*A: WebSockets provide full-duplex communication with lower latency and overhead, which is essential for a "live" chat and active user dashboard.*

**Q: How do you handle password security?**  
*A: We never store plain-text passwords. We use Bcrypt with a salt factor of 10 to hash passwords before database insertion.*

**Q: What happens if the WebSocket connection is lost?**  
*A: The frontend is built to handle reconnect logic, and the backend cleans up its `activeUsers` object when the `close` event is triggered.*
