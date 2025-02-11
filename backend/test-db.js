const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

(async () => {
  try {
    console.log("Connecting to the database...");
    const client = await pool.connect();
    console.log("Connected to the database successfully!");
    const result = await client.query("SELECT NOW()");
    console.log("Current timestamp:", result.rows);
    client.release();
  } catch (err) {
    console.error("Database connection error:", err);
  } finally {
    pool.end();
  }
})();
