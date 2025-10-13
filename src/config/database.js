import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "statmind_user",
  password: process.env.DB_PASSWORD || "your_secure_password",
  database: process.env.DB_NAME || "statmind_db",
});

pool.connect()
  .then(() => console.log("✅ PostgreSQL connection established"))
  .catch(err => console.error("❌ PostgreSQL connection error:", err.message));

export default pool;
