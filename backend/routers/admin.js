const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Fetch trains based on search criteria for admin
router.post("/search-trains", async (req, res) => {
  const { fromStation, toStation, travelDate } = req.body;

  // Log the received body for debugging
  console.log("Request Body:", req.body);

  if (!fromStation || !toStation || !travelDate) {
    return res.status(400).json({
      message:
        "Missing required fields: fromStation, toStation, or travelDate.",
    });
  }

  try {
    const query = `
        SELECT * FROM trains
        WHERE lower(from_station) = $1 AND lower(to_station) = $2 AND travel_date = $3
      `;
    const result = await pool.query(query, [
      fromStation.toLowerCase(),
      toStation.toLowerCase(),
      travelDate,
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No trains found matching your criteria." });
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching trains for admin:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/train/:trainId", async (req, res) => {
  const { trainId } = req.params;

  try {
    const query = `
        SELECT t.*, json_agg(
          json_build_object(
            'seat_number', s.seat_number,
            'status', s.status
          )
        ) AS seats
        FROM trains t
        JOIN seats s ON t.id = s.train_id
        WHERE t.id = $1
        GROUP BY t.id
      `;

    const result = await pool.query(query, [trainId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Train not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching train details:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/train/:trainId/waitlist", async (req, res) => {
  const { trainId } = req.params;
  const { passengerName, loyalty, class: passengerClass } = req.body;

  if (!passengerName || !loyalty || !passengerClass) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const query = `
        INSERT INTO waitlist (train_id, passenger_name, loyalty, class)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
    const result = await pool.query(query, [
      trainId,
      passengerName,
      loyalty,
      passengerClass,
    ]);

    res.json({
      message: "Passenger added to waitlist",
      waitlistEntry: result.rows[0],
    });
  } catch (err) {
    console.error("Error adding to waitlist:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Add Reservation
router.post("/add-reservation", async (req, res) => {
  const { trainId, passengerId, seats } = req.body;

  if (!trainId || !passengerId || !seats || seats.length === 0) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    // Update seat statuses
    const updateSeatsQuery = `
      UPDATE seats
      SET status = 'booked', passenger_id = $1
      WHERE train_id = $2 AND seat_number = ANY($3)
    `;
    await pool.query(updateSeatsQuery, [passengerId, trainId, seats]);

    // Add reservation
    const addReservationQuery = `
      INSERT INTO reservations (passenger_id, train_id, seat_numbers, created_at, paid)
      VALUES ($1, $2, $3, NOW(), false)
    `;
    await pool.query(addReservationQuery, [passengerId, trainId, seats]);

    res.json({ message: "Reservation added successfully." });
  } catch (err) {
    console.error("Error adding reservation:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Edit Reservation
router.put("/edit-reservation", async (req, res) => {
  const { passengerId, trainNumber, newSeat } = req.body;

  try {
    // Update reservation in the database
    const updateQuery = `
      UPDATE reservations
      SET seat_numbers = ARRAY[$3]
      WHERE passenger_id = $1 AND train_id = $2
    `;
    await pool.query(updateQuery, [passengerId, trainNumber, newSeat]);

    // Update seat statuses
    const resetSeatQuery = `
      UPDATE seats
      SET status = 'available'
      WHERE train_id = $1 AND passenger_id = $2
    `;
    await pool.query(resetSeatQuery, [trainNumber, passengerId]);

    const setNewSeatQuery = `
      UPDATE seats
      SET status = 'booked', passenger_id = $1
      WHERE train_id = $2 AND seat_number = $3
    `;
    await pool.query(setNewSeatQuery, [passengerId, trainNumber, newSeat]);

    res.json({ message: "Reservation updated successfully." });
  } catch (err) {
    console.error("Error updating reservation:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Cancel Reservation
router.delete("/cancel-reservation", async (req, res) => {
  const { reservationId } = req.body;

  try {
    // Free up seats associated with the reservation
    const freeSeatsQuery = `
      UPDATE seats
      SET status = 'available', passenger_id = NULL
      WHERE train_id = (
        SELECT train_id FROM reservations WHERE id = $1
      ) AND seat_number = ANY((
        SELECT seat_numbers FROM reservations WHERE id = $1
      )::int[])
    `;
    await pool.query(freeSeatsQuery, [reservationId]);

    // Delete the reservation
    const deleteReservationQuery = `
      DELETE FROM reservations WHERE id = $1
    `;
    await pool.query(deleteReservationQuery, [reservationId]);

    res.json({ message: "Reservation canceled successfully." });
  } catch (err) {
    console.error("Error canceling reservation:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Assign Staff
router.post("/assign-staff", async (req, res) => {
  const { trainId, staffRole, staffName, date } = req.body;

  try {
    const query = `
      INSERT INTO staff_assignments (train_id, role, name, date)
      VALUES ($1, $2, $3, $4)
    `;
    await pool.query(query, [trainId, staffRole, staffName, date]);

    res.json({ message: "Staff assigned successfully." });
  } catch (err) {
    console.error("Error assigning staff:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});
// Promote Waitlisted Passenger
router.post("/promote-waitlist/:trainId", async (req, res) => {
  const { trainId } = req.params;

  try {
    // Fetch the waitlisted passenger for the train
    const waitlistQuery = `
      SELECT * FROM waitlist
      WHERE train_id = $1
      ORDER BY created_at ASC
      LIMIT 1
    `;
    const waitlistResult = await pool.query(waitlistQuery, [trainId]);

    if (waitlistResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No passengers on the waitlist for this train." });
    }

    const passenger = waitlistResult.rows[0];

    // Find an available seat
    const seatQuery = `
      SELECT seat_number FROM seats
      WHERE train_id = $1 AND status = 'available'
      LIMIT 1
    `;
    const seatResult = await pool.query(seatQuery, [trainId]);

    if (seatResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No available seats to promote the passenger." });
    }

    const seatNumber = seatResult.rows[0].seat_number;

    // Assign the seat to the passenger
    const updateSeatQuery = `
      UPDATE seats
      SET status = 'booked', passenger_id = $1
      WHERE train_id = $2 AND seat_number = $3
    `;
    await pool.query(updateSeatQuery, [
      passenger.passenger_id,
      trainId,
      seatNumber,
    ]);

    // Remove the passenger from the waitlist
    const removeWaitlistQuery = `
      DELETE FROM waitlist
      WHERE id = $1
    `;
    await pool.query(removeWaitlistQuery, [passenger.id]);

    res.json({
      message: `Passenger ${passenger.name} has been promoted to seat ${seatNumber}.`,
    });
  } catch (err) {
    console.error("Error promoting waitlisted passenger:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Promote Waitlist
router.post("/promote-waitlist", async (req, res) => {
  const { trainId } = req.body;

  try {
    const getWaitlistQuery = `
      SELECT * FROM waitlist
      WHERE train_id = $1
      ORDER BY created_at ASC
      LIMIT 1
    `;
    const waitlistResult = await pool.query(getWaitlistQuery, [trainId]);

    if (waitlistResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "No waitlisted passengers found." });
    }

    const passenger = waitlistResult.rows[0];

    const availableSeatQuery = `
      SELECT seat_number FROM seats
      WHERE train_id = $1 AND status = 'available'
      LIMIT 1
    `;
    const seatResult = await pool.query(availableSeatQuery, [trainId]);

    if (seatResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "No available seats to promote." });
    }

    const seatNumber = seatResult.rows[0].seat_number;

    const updateSeatQuery = `
      UPDATE seats
      SET status = 'booked', passenger_id = $1
      WHERE train_id = $2 AND seat_number = $3
    `;
    await pool.query(updateSeatQuery, [
      passenger.passenger_id,
      trainId,
      seatNumber,
    ]);

    const addReservationQuery = `
      INSERT INTO reservations (passenger_id, train_id, seat_numbers)
      VALUES ($1, $2, $3)
    `;
    await pool.query(addReservationQuery, [
      passenger.passenger_id,
      trainId,
      [seatNumber],
    ]);

    const removeFromWaitlistQuery = `
      DELETE FROM waitlist
      WHERE id = $1
    `;
    await pool.query(removeFromWaitlistQuery, [passenger.id]);

    res.json({
      message: `Passenger ${passenger.name} promoted to seat ${seatNumber}.`,
    });
  } catch (err) {
    console.error("Error promoting waitlist:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.get("/get-reservation", async (req, res) => {
  const { passengerId, trainNumber } = req.query;

  try {
    const query = `
      SELECT * FROM reservations
      WHERE passenger_id = $1 AND train_id = $2
    `;
    const result = await pool.query(query, [passengerId, trainNumber]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error fetching reservation:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/edit-reservation", async (req, res) => {
  const { passengerId, trainNumber, seatChanges } = req.body;

  try {
    // Free up previously reserved seats
    const resetSeatsQuery = `
      UPDATE seats
      SET status = 'available', passenger_id = NULL
      WHERE train_id = (SELECT id FROM trains WHERE number = $1) 
        AND passenger_id = $2
    `;
    await pool.query(resetSeatsQuery, [trainNumber, passengerId]);

    // Book the new seats
    const reserveSeatsQuery = `
      UPDATE seats
      SET status = 'booked', passenger_id = $1
      WHERE train_id = (SELECT id FROM trains WHERE number = $2) 
        AND seat_number = ANY($3)
    `;
    await pool.query(reserveSeatsQuery, [
      passengerId,
      trainNumber,
      seatChanges,
    ]);

    // Update the reservation record
    const updateReservationQuery = `
      UPDATE reservations
      SET seat_numbers = $1
      WHERE passenger_id = $2 AND train_id = (SELECT id FROM trains WHERE number = $3)
    `;
    await pool.query(updateReservationQuery, [
      seatChanges,
      passengerId,
      trainNumber,
    ]);

    res.json({ message: "Reservation updated successfully." });
  } catch (err) {
    console.error("Error editing reservation:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Route to delete a reservation
router.delete("/delete-reservation", async (req, res) => {
  const { trainId, passengerId } = req.body;

  try {
    // Fetch the reservation
    const fetchQuery = `
      SELECT seat_numbers FROM reservations
      WHERE train_id = $1 AND passenger_id = $2
    `;
    const fetchResult = await pool.query(fetchQuery, [trainId, passengerId]);

    if (fetchResult.rowCount === 0) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const seatNumbers = fetchResult.rows[0].seat_numbers;

    // Delete the reservation
    const deleteQuery = `
      DELETE FROM reservations
      WHERE train_id = $1 AND passenger_id = $2
    `;
    await pool.query(deleteQuery, [trainId, passengerId]);

    // Update seat statuses
    const updateSeatsQuery = `
      UPDATE seats
      SET status = 'available', passenger_id = NULL
      WHERE train_id = $1 AND seat_number = ANY($2)
    `;
    await pool.query(updateSeatsQuery, [trainId, seatNumbers]);

    res.json({ message: "Reservation deleted successfully." });
  } catch (err) {
    console.error("Error deleting reservation:", err);
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

// Assign Staff to Train
router.post("/assign-staff", async (req, res) => {
  const { trainId, staffRole, staffName } = req.body;

  if (!trainId || !staffRole || !staffName) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const query = `
      INSERT INTO staff_assignments (train_id, role, name)
      VALUES ($1, $2, $3)
    `;
    await pool.query(query, [trainId, staffRole, staffName]);

    res.json({
      message: `Staff member ${staffName} assigned as ${staffRole} to train ${trainId}.`,
    });
  } catch (err) {
    console.error("Error assigning staff:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get Active Trains Report
router.get("/reports/active-trains", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const query = `
      SELECT id, name, number, from_station, to_station, departure, arrival
      FROM trains
      WHERE travel_date = $1
    `;
    const result = await pool.query(query, [today]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching active trains:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get Stations Report
router.get("/reports/stations", async (req, res) => {
  try {
    const query = `
     SELECT s.name, s.station_order, s.arrival_time, s.departure_time, t.name AS train_name
FROM stations s
JOIN trains t ON s.train_id = t.id
ORDER BY t.id, s.station_order;

    `;
    const result = await pool.query(query);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching stations report:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Get Waitlisted Loyalty Passengers for a Train
// Get Stations Report (Route is From and To Stations)

// Get Waitlisted Loyalty Passengers for a Train
router.get("/reports/waitlist/:trainNumber", async (req, res) => {
  const { trainNumber } = req.params;
  
  try {
    const query = `
      SELECT wl.passenger_id, p.name, p.class
      FROM waitlist wl
      JOIN passengers p ON wl.passenger_id = p.id
      JOIN trains t ON wl.train_id = t.id
      WHERE t.number = $1
    `;
    const result = await pool.query(query, [trainNumber]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching waitlisted loyalty passengers:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = router;
