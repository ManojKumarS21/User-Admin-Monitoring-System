# User-Admin Monitoring System

A real-time monitoring system with a Next.js frontend, Node.js/Express backend, and MySQL database.

## Features
- **User Registration**: Users can sign up and wait for admin approval.
- **Admin Dashboard**: Admins can approve/reject users and see active users.
- **Real-Time Communication**: Integrated WebSockets for instant updates between users and admins.
- **Secure Auth**: JWT-based authentication and Bcrypt password hashing.

## Project Structure
- `/frontend`: Next.js application (App Router).
- `/backend`: Node.js Express server with WebSocket support.

## Tech Stack
- **Frontend**: Next.js, Tailwind CSS, Axios.
- **Backend**: Node.js, Express, `ws` (WebSockets).
- **Database**: MySQL.

## Getting Started

### Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file with:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=dashboard_app
   JWT_SECRET=your_secret
   PORT=5000
   ```
4. `npm start`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_WS_URL=ws://localhost:5000
   ```
4. `npm run dev`

## Deployment
This project is configured for deployment on:
- **Frontend**: Vercel
- **Backend**: Render / Railway
- **Database**: Aiven / PlanetScale (MySQL)

For detailed deployment steps, see the `project_workflow.md`.
