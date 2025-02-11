const express = require("express");
const pool = require("../config/db"); // Adjust the path to your DB config

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password, role } = req.body;

  try {
    // Map role to the appropriate table
    const roleToTable = {
      admin: "admin",
      passenger: "passenger",
    };

    const table = roleToTable[role];
    if (!table) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    // Query the database for the user
    const query = `SELECT * FROM ${table} WHERE username = $1`;
    const result = await pool.query(query, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const user = result.rows[0];

    // Compare passwords directly (plain-text comparison)
    if (password !== user.password) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

  req.session.user = {
      id: user.pid || user.admin_id,
      name: user.passenger_fname || username,
      role: role,
    };
    // Respond with a success message
    res.json({
      message: "Login successful.",
      role,
    });
    
  } catch (err) {
    console.error("Error during login process:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
