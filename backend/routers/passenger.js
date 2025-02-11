// Add this to app.js or a new router file, e.g., routers/passenger.js
const express = require("express");
const pool = require("../config/db"); // Adjust path as needed

const router = express.Router();

// Fetch trains based on search criteria
router.get("/trains", async (req, res) => {
  const { from, to, date } = req.query;

  try {
    const query = `
      SELECT * FROM trains
      WHERE lower(from_station) = $1 AND lower(to_station) = $2 AND travel_date = $3
    `;
    const result = await pool.query(query, [
      from.toLowerCase(),
      to.toLowerCase(),
      date,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching trains:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch train details by ID (for seat layout)
router.get("/train/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
        SELECT t.*, json_agg(s ORDER BY s.seat_number) AS seats
        FROM trains t
        JOIN seats s ON t.id = s.train_id
        WHERE t.id = $1
        GROUP BY t.id
      `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Train not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching train details:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/session", (req, res) => {
  if (req.session && req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

module.exports = router;

router.post("/reserve", async (req, res) => {
  const { trainId, passengerId, seats, deadline = null } = req.body;

  try {
    // Update seat statuses
    const reserveSeatsQuery = `
        UPDATE seats
        SET status = 'reserved', passenger_id = $1
        WHERE train_id = $2 AND seat_number = ANY($3)
      `;
    await pool.query(reserveSeatsQuery, [passengerId, trainId, seats]);

    // Insert reservation record
    const addReservationQuery = `
      INSERT INTO reservations (passenger_id, train_id, seat_numbers, deadline)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(addReservationQuery, [
      passengerId,
      trainId,
      seats,
      deadline,
    ]);

    res.json({ message: "Reservation added successfully." });
  } catch (err) {
    console.error("Error reserving seats:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/check-expired", async (req, res) => {
  try {
    const now = Date.now();
    const query = `
        DELETE FROM reservations
        WHERE NOT paid AND deadline IS NOT NULL AND deadline < $1
        RETURNING train_id, seat_numbers
      `;
    const result = await pool.query(query, [now]);

    // Free up seats for canceled reservations
    if (result.rows.length > 0) {
      const updateSeatsQuery = `
          UPDATE seats
          SET status = 'available', passenger_id = NULL
          WHERE train_id = $1 AND seat_number = ANY($2)
        `;

      for (const row of result.rows) {
        await pool.query(updateSeatsQuery, [row.train_id, row.seat_numbers]);
      }
    }

    res.json({ message: "Expired reservations processed successfully." });
  } catch (err) {
    console.error("Error checking expired reservations:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/reservations", async (req, res) => {
  const { passengerId } = req.query;

  try {
    const query = `
        SELECT t.name AS train_name, t.number AS train_number, r.seat_numbers, t.departure, t.arrival
        FROM reservations r
        JOIN trains t ON r.train_id = t.id
        WHERE r.passenger_id = $1
      `;
    const result = await pool.query(query, [passengerId]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching reservations:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
router.delete("/reservations", async (req, res) => {
  const { trainId, passengerId } = req.body;

  try {
    // Delete reservation
    const deleteReservationQuery = `
        DELETE FROM reservations
        WHERE train_id = $1 AND passenger_id = $2
      `;
    await pool.query(deleteReservationQuery, [trainId, passengerId]);

    // Reset seat statuses
    const resetSeatsQuery = `
        UPDATE seats
        SET status = 'available', passenger_id = NULL
        WHERE train_id = $1 AND passenger_id = $2
      `;
    await pool.query(resetSeatsQuery, [trainId, passengerId]);

    res.json({ message: "Reservation deleted and seats reset successfully." });
  } catch (err) {
    console.error("Error deleting reservation:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/active-trains", async (req, res) => {
  const { date } = req.query;

  try {
    const query = `
        SELECT * FROM trains
        WHERE travel_date = $1
      `;
    const result = await pool.query(query, [date]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching active trains:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/waitlist", async (req, res) => {
  const { trainId, passengerId, passengerName, seatCount } = req.body;

  try {
    const query = `
        INSERT INTO waitlist (train_id, passenger_id, passenger_name, seat_count)
        VALUES ($1, $2, $3, $4)
      `;
    await pool.query(query, [trainId, passengerId, passengerName, seatCount]);

    res.json({ message: "You have been added to the waitlist." });
  } catch (err) {
    console.error("Error adding to waitlist:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ message: "Failed to log out." });
      }
      res.clearCookie("connect.sid"); // Clear the session cookie
      res.status(200).json({ message: "Logged out successfully." });
    });
  } else {
    res.status(400).json({ message: "No active session to log out from." });
  }
});

module.exports = router;
