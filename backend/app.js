const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const { Pool } = require("pg");

dotenv.config(); // Load environment variables

const app = express();

// Middleware to parse incoming JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Optional: for form data

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "..", "public")));

// Database configuration
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
const pool = new Pool({
  host: PGHOST,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
  port: 5432,
  ssl: {
    require: true,
  },
});

// Root route - Serve login.html by default
app.get("/", (req, res) => {
  const loginPath = path.join(__dirname, "..", "public", "login.html");
  res.sendFile(loginPath); // Serve login.html for the root route
});

const session = require('express-session');
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

app.get("/session", (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ message: "No active session" });
  }
});
const authRoutes = require("./routers/auth.js");
app.use("/auth", authRoutes); // Set up the /auth route

const passengerRoutes = require("./routers/passenger.js");
app.use("/passenger", passengerRoutes); // Mount the passenger routes

const adminRoutes = require("./routers/admin.js");
app.use("/admin", adminRoutes); // Mount the admin routes

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
