# 🚧 Crane Monitor System

A real-time crane monitoring dashboard that tracks crane telemetry data such as load, motor temperature, and vibration levels. The system provides live visualization, instant alerts, role-based authentication, and historical sensor analysis.

---

## 📌 Features

* Real-time sensor monitoring
* Live telemetry charts using WebSockets
* Instant overheating alerts
* Role-based authentication (Admin / Operator)
* Historical sensor data tracking
* Responsive dashboard UI
* PostgreSQL database hosted on Supabase

---

# 🌐 Live Demo

The application is deployed and accessible online:

**Live Dashboard:**
[Crane Monitor Dashboard](https://cranemanagement.netlify.app/?utm_source=chatgpt.com)

You can log in and explore:

* Real-time crane telemetry monitoring
* Live temperature, load, and vibration charts
* Alert management system
* Historical sensor data
* Role-based dashboard access

No local setup is required to view the hosted version.

--- 

# 🏗️ System Architecture

The application follows a modern client-server architecture:

```text
┌─────────────────┐
│ React Frontend  │
│  Dashboard UI   │
└────────┬────────┘
         │ Socket.IO
         ▼
┌─────────────────┐
│ Node.js Backend │
│ Express Server  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PostgreSQL DB   │
│   (Supabase)    │
└─────────────────┘
```

---

# ⚙️ Running the Project

## 1. Extract the Files

Unzip the project folder and open a terminal inside the main `Crane-Monitor` directory.

---

## 2. Start the Backend API

Install backend dependencies and start the server:

```bash
cd backend
npm install
node index.js
```

Keep this terminal running.

The backend automatically connects to the configured Supabase PostgreSQL database using the included `.env` file.

---

## 3. Start the Frontend Dashboard

Open a second terminal inside the project root and run:

```bash
cd frontend
npm install
npm start
```

The application will open automatically at:

```text
http://localhost:3000
```

---

# 🛠️ Technology Stack

## Frontend

* React.js
* Tailwind CSS
* Lucide React
* Recharts
* Socket.IO Client

## Backend

* Node.js
* Express.js
* Socket.IO
* JSON Web Tokens (JWT)
* Nodemailer (Future Enhancement)

## Database

* PostgreSQL
* Supabase

## Infrastructure

* Render (Backend Hosting)
* Netlify (Frontend Hosting)

---

# 🗄️ Database Design

The database is intentionally kept simple and maintainable using PostgreSQL.

## Tables

### users

Stores:

* User credentials
* Roles (Admin / Operator)

### readings

Stores:

* Load values
* Motor temperatures
* Vibration metrics
* Timestamped telemetry data

### alerts

Stores:

* Alert messages
* Severity
* Trigger timestamps

---

# 🎯 Design Decisions

## 1. Architecture Choice

### Decision

Separated React frontend and Node.js backend connected through Socket.IO.

### Why?

Traditional HTTP polling would require the frontend to repeatedly request updates every few seconds.

Problems:

* Increased bandwidth consumption
* Higher server load
* Delayed updates

Socket.IO maintains a persistent WebSocket connection and pushes new data instantly when available.

Benefits:

* Real-time updates
* Lower network overhead
* Better scalability
* Improved user experience

---

## 2. Database Design

### Decision

Use PostgreSQL hosted on Supabase with three relational tables:

* users
* readings
* alerts

### Why?

While dedicated time-series databases can provide higher telemetry performance, PostgreSQL offers:

* Strong relational support
* User authentication storage
* Role management
* Simpler deployment

This eliminates the need to manage multiple database systems.

---

## 3. Alerting Strategy

### Decision

Application-layer synchronous alert processing.

When a sensor reading arrives:

1. Save reading
2. Validate thresholds
3. Generate alert if required
4. Broadcast update to frontend

All within the same request lifecycle.

### Why?

This guarantees immediate operator visibility.

Example:

```javascript
if (motor_temp > 80) {
  createAlert();
  broadcastAlert();
}
```

The dashboard can notify operators the moment an unsafe condition occurs.

---

## 4. Key Trade-Offs

### Trade-Off

Synchronous alert checking adds a very small amount of processing time when saving data.

### Why Accept It?

For a moderate-scale deployment, this approach provides:

* Simpler codebase
* Easier local setup
* Faster development
* Fewer infrastructure dependencies

At enterprise scale (thousands of cranes), a message queue such as Kafka or RabbitMQ could be introduced to decouple alert processing.

---

# 📧 Production Email Alerting

A future production enhancement includes automated maintenance notifications.

## Proposed Implementation

* Install Nodemailer
* Configure Gmail App Password
* Trigger email notifications when temperature thresholds are exceeded

Example:

```javascript
if (motor_temp > 80) {
  sendMaintenanceEmail();
}
```

---

## Email Debouncing

To prevent excessive notifications:

* Store timestamp of last email sent
* Only allow one notification every 15 minutes

Pseudo Logic:

```javascript
if (Date.now() - lastEmailSent > 15 * 60 * 1000) {
  sendEmail();
}
```

Benefits:

* Prevents alert spam
* Reduces maintenance fatigue
* Keeps notifications meaningful

---

# 🚀 Future Improvements

## Frontend Improvements

### Data Export

Allow administrators to export telemetry data as:

* CSV
* Excel

for offline analysis and reporting.

### Progressive Web App (PWA)

Convert the dashboard into a PWA so operators can:

* Install it directly on mobile devices
* Access dashboards quickly
* Receive future push notifications

---

## Backend Improvements

### Hardware API Keys

Replace username/password authentication for cranes with secure IoT API Keys.

Benefits:

* Improved security
* Easier device provisioning
* Better scalability

### Data Archiving

Implement automated archival jobs to:

* Move sensor data older than 30 days into cold storage
* Reduce database size
* Maintain query performance

---

# 🔒 Security Features

* JWT Authentication
* Password Hashing
* Protected API Routes
* Role-Based Access Control
* Secure Database Connectivity

---

# 📊 Monitoring Metrics

The system currently monitors:

* Crane Load
* Motor Temperature
* Vibration Levels
* Alert Events
* Historical Trends

---

# 📄 License

This project was developed as an academic and demonstration project for real-time industrial equipment monitoring.

---


Developed using:

* React.js
* Node.js
* PostgreSQL (Supabase)
* Socket.IO

to demonstrate a scalable real-time monitoring architecture for industrial crane operations.
