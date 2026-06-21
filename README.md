# 🏗️ Crane Monitor IoT Dashboard

## 🚀 Run Instructions
**(Runs in under 5 minutes)**

### Live URLs
- **Frontend (Netlify):** [INSERT YOUR NETLIFY URL HERE]
- **Backend API (Render):** `https://crane-monitor-api.onrender.com`

### Local Setup
1. **Clone the repository:**
   ```bash
   git clone https://github.com/sarthakdarade07/Crane-Monitor.git
   cd Crane-Monitor
   ```

2. **Start the Backend API:**
   Open a terminal and run:
   ```bash
   cd backend
   npm install
   node index.js
   ```
   *(The backend is configured via a local `.env` file to securely connect directly to the live Supabase PostgreSQL database).*

3. **Start the Frontend Dashboard:**
   Open a new, separate terminal window and run:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The dashboard will automatically open in your browser at `http://localhost:3000`. 

---

## 🏗️ Design Decisions & Architecture

### Architecture Choices
We chose a **decoupled Client-Server architecture** utilizing React for the frontend and Node.js/Express for the backend. This allows the backend to independently scale to handle high-frequency IoT telemetry ingestion, while the React SPA provides a highly responsive, real-time UI.
- **Real-time Updates:** We utilized **Socket.IO (WebSockets)** over standard HTTP polling. This was a critical choice to minimize bandwidth consumption—instead of the client constantly pinging the API for new data, the server efficiently pushes new sensor readings down the wire the exact millisecond they are ingested.

### Database Design
We used **PostgreSQL (hosted on Supabase)**. Relational databases are highly effective for telemetry data when properly indexed. 
- **Tables:** We normalized the data into three primary tables: `users` (for authentication and role-based access control), `readings` (for raw crane telemetry), and `alerts` (for threshold violations).
- **Key Trade-off:** While a specialized Time-Series Database (like InfluxDB) might be theoretically faster for pure telemetry at a massive scale, PostgreSQL was chosen for its versatility. It allows us to seamlessly query complex relational user authentication data alongside our time-series sensor data without needing to maintain two entirely separate database systems.

### Alerting Approach
Alerting is currently handled dynamically at the **application layer**. When a `POST /api/readings` request comes in from the hardware, the Express server synchronously evaluates the payload (e.g., checking if `motor_temp_c > 80`). If a threshold is violated, it writes an alert to the database and immediately broadcasts it to the frontend via WebSockets.
- **Key Trade-off:** Processing alerts synchronously during data ingestion adds slight latency to the hardware's `POST` request. In an enterprise-scale scenario with thousands of cranes, this might slow down ingestion, but for our current scale, it drastically simplifies the architecture by avoiding the complexity of external message brokers (like Kafka or RabbitMQ).

---

## 📧 Production Email Alerting
If we were to implement production-grade email alerting, we would transition to an **asynchronous event-driven model**:
1. When a threshold violation is detected by the Node.js ingestion layer, it would push an event onto a lightweight message queue (e.g., Redis Pub/Sub or AWS SQS).
2. A separate, dedicated "Notification Worker" microservice would independently consume these events.
3. The worker would utilize a transactional email API provider like **SendGrid** or **AWS SES** to dispatch the emails to maintenance staff.
4. **Debouncing:** Crucially, the worker would implement a caching layer (using Redis) to "debounce" alerts. If a motor is overheating, it might send 50 bad readings per minute. The cache would ensure we only email the maintenance team once every 15-30 minutes per crane, preventing severe alert fatigue.

---

## 🔮 Future Improvements
With more time, we would add the following optimizations:
1. **IoT Edge Filtering:** Instead of sending every single sensor reading, we would push logic to the hardware edge. The crane sensors should only transmit data if a value changes significantly or a threshold is breached, saving massive amounts of cloud ingress bandwidth.
2. **Data Retention & Archival Strategy:** Implement PostgreSQL partition tables by date, and run a weekly cron job to compress and offload telemetry data older than 30 days to cold storage (e.g., Amazon S3). This keeps database query times lightning-fast and storage costs low.
3. **Hardware Authentication:** Replace the current JWT username/password requirement on the `/api/readings` ingestion endpoint with a robust API Key or Mutual TLS (mTLS) certificate system designed specifically for secure, headless IoT devices.

---

## 🛠️ Tools & Resources Used
- **Frontend:** React.js, Tailwind CSS aesthetics (custom CSS equivalents), Lucide Icons (for UI iconography), Recharts (for dynamic telemetry visualization charts).
- **Backend:** Node.js, Express.js, Socket.IO, `pg` (node-postgres), JSON Web Tokens (JWT) for secure authentication.
- **Infrastructure:** Render (Backend API hosting), Netlify (Frontend React hosting), Supabase (PostgreSQL Database).

### Modified/Rejected Approach & Reasoning
Initially, we relied on a standard HTTP Polling approach on the frontend (using `setInterval` to repeatedly fetch the `/api/readings/latest` endpoint every 3 seconds to update the charts). 
* **Rejection:** We explicitly rejected and replaced this approach with WebSockets (Socket.IO). We realized that having the dashboard aggressively poll the backend would consume massive amounts of unnecessary network bandwidth and place immense, continuous load on the PostgreSQL database. By modifying this to use WebSockets, the database is only queried once on initial page load, and all subsequent updates are efficiently pushed to the UI in real-time. This completely solved the bandwidth consumption and database load issues.
