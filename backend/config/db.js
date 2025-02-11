const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config(); // Load environment variables

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT, // Default is 5432
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

pool
  .connect()
  .then(() => console.log("Connected to Neon PostgreSQL database"))
  .catch((err) => console.error("Database connection error", err.stack));

module.exports = pool;
