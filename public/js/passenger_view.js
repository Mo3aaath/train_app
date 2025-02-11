document.addEventListener("DOMContentLoaded", () => {
  const loggedInPassenger = {
    id: "P001",
    name: "John Doe",
  };

  // const trains = [
  //   {
  //     number: "12345",
  //     name: "Express Train",
  //     from: "City A",
  //     to: "City B",
  //     departure: "10:00 AM",
  //     arrival: "2:00 PM",
  //     date: "2024-12-10",
  //     seats: Array.from({ length: 50 }, (_, index) => ({
  //       seatNumber: index + 1,
  //       status: "available", // available, booked, reserved
  //       passengerId: null,
  //     })),
  //     waitingList: [],
  //     reservations: [],
  //   },
  //   {
  //     number: "67890",
  //     name: "Fast Train",
  //     from: "City A",
  //     to: "City C",
  //     departure: "12:00 PM",
  //     arrival: "4:00 PM",
  //     date: "2024-12-10",
  //     seats: Array.from({ length: 50 }, (_, index) => ({
  //       seatNumber: index + 1,
  //       status: "available",
  //       passengerId: null,
  //     })),
  //     waitingList: [],
  //     reservations: [],
  //   },
  // ];

  let selectedTrain = null;
  let selectedSeats = [];

  // Search for trains
  document
    .getElementById("searchForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const fromStation = document
        .getElementById("fromStation")
        .value.trim()
        .toLowerCase();
      const toStation = document
        .getElementById("toStation")
        .value.trim()
        .toLowerCase();
      const travelDate = document.getElementById("travelDate").value;

      try {
        const response = await fetch(
          `http://localhost:3000/passenger/trains?from=${fromStation}&to=${toStation}&date=${travelDate}`
        );
        const trains = await response.json();

        const searchResults = document.getElementById("searchResults");
        if (trains.length > 0) {
          let resultsHTML = "<h3>Available Trains:</h3><ul>";
          trains.forEach((train) => {
            resultsHTML += `<li>
                    <strong>${train.name} (${train.number})</strong><br>
                    Departure: ${train.departure}, Arrival: ${train.arrival}<br>
                    <button onclick="selectTrain(${train.id})">Book</button>
                </li>`;
          });
          resultsHTML += "</ul>";
          searchResults.innerHTML = resultsHTML;
        } else {
          searchResults.innerHTML =
            "<p>No trains found matching your criteria.</p>";
        }
      } catch (err) {
        console.error("Error fetching trains:", err);
        alert("Failed to fetch trains. Please try again.");
      }
    });

  // Function to select a train and show seat layout
  window.selectTrain = async function (trainId) {
    try {
      const response = await fetch(
        `http://localhost:3000/passenger/train/${trainId}`
      );
      const trainData = await response.json();

      selectedTrain = trainData;
      selectedSeats = [];

      const trainDetails = document.getElementById("trainDetails");
      trainDetails.innerHTML = `<strong>${selectedTrain.name} (${selectedTrain.trainId})</strong><br>
                                Departure: ${selectedTrain.departure}, Arrival: ${selectedTrain.arrival}`;

      const seatLayout = document.getElementById("seatLayout");
      seatLayout.innerHTML = "";

      selectedTrain.seats.forEach((seat, index) => {
        const seatDiv = document.createElement("div");
        seatDiv.classList.add("seat");
        seatDiv.textContent = seat.seat_number;

        // Treat both "reserved" and "booked" seats as red
        seatDiv.style.backgroundColor =
          seat.status === "available" ? "green" : "red";
        seatDiv.style.cursor =
          seat.status === "available" ? "pointer" : "not-allowed";

        if (seat.status === "available") {
          seatDiv.onclick = () => toggleSeat(index);
        }

        seatDiv.dataset.index = index;
        seatLayout.appendChild(seatDiv);
      });

      document.getElementById("seatBooking").style.display = "block";
    } catch (err) {
      console.error("Error fetching train details:", err);
      alert("Failed to fetch train details. Please try again.");
    }
  };

  // Toggle seat selection
  function toggleSeat(index) {
    const seat = selectedTrain.seats[index];
    if (seat.status !== "available") return;

    const seatDiv = document.querySelector(`[data-index="${index}"]`);
    if (!seatDiv) {
      console.error(`Seat div not found for index ${index}`);
      return;
    }

    if (selectedSeats.includes(index)) {
      selectedSeats = selectedSeats.filter((seatIndex) => seatIndex !== index);
      seat.status = "available";
      seatDiv.style.backgroundColor = "green";
    } else {
      selectedSeats.push(index);
      seat.status = "reserved";
      seatDiv.style.backgroundColor = "yellow";
    }
  }

  // Confirm booking
  document
    .getElementById("confirmBooking")
    .addEventListener("click", async function () {
      console.log("Confirm Booking button clicked.");

      if (selectedSeats.length === 0) {
        alert("Please select at least one seat.");
        return;
      }

      try {
        const deadline = new Date(
          Date.now() + 3 * 60 * 60 * 1000
        ).toISOString();
        console.log("Deadline:", deadline);

        const reservationDetails = {
          trainId: selectedTrain.id,
          seats: selectedSeats.map(
            (index) => selectedTrain.seats[index].seat_number
          ),
          passengerId: loggedInPassenger.id,
          deadline,
        };
        console.log("Reservation Details:", reservationDetails);

        const response = await fetch(
          "http://localhost:3000/passenger/reserve",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reservationDetails),
          }
        );

        console.log("Response Status:", response.status);

        if (response.ok) {
          alert("Reservation confirmed. Redirecting to payment...");
          sessionStorage.setItem(
            "bookingDetails",
            JSON.stringify(reservationDetails)
          );
          window.location.href = "payment.html";
        } else {
          const data = await response.json();
          console.log("Response Data:", data);
          alert(data.message);
        }
      } catch (err) {
        console.error("Error during booking:", err);
        alert("Failed to confirm booking. Please try again.");
      }
    });

  // waitlist btn
  document
    .getElementById("waitlistButton")
    .addEventListener("click", async function () {
      try {
        const response = await fetch(
          "http://localhost:3000/passenger/waitlist",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trainId: selectedTrain.id,
              passengerId: loggedInPassenger.id,
              passengerName: loggedInPassenger.name,
              seatCount: 1, // Assume passenger wants 1 seat
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          alert("You have been added to the waitlist.");
          document.getElementById("seatBooking").style.display = "none";
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Error joining waitlist:", err);
        alert("Failed to join waitlist. Please try again.");
      }
    });

  // Add to waiting list
  function addToWaitingList(train, passenger) {
    train.waitingList.push({
      passengerId: passenger.id,
      name: passenger.name,
      seatCount: selectedSeats.length,
    });
    alert(
      `No seats available. ${passenger.name} has been added to the waiting list.`
    );
  }

  // Allocate seats from waiting list
  function allocateSeatsFromWaitingList(train) {
    while (
      train.waitingList.length > 0 &&
      train.seats.some((seat) => seat.status === "available")
    ) {
      const passenger = train.waitingList.shift();
      const availableSeats = train.seats.filter(
        (seat) => seat.status === "available"
      );
      const allocatedSeats = availableSeats.slice(0, passenger.seatCount);

      if (allocatedSeats.length < passenger.seatCount) {
        train.waitingList.unshift(passenger);
        break;
      }

      allocatedSeats.forEach((seat) => {
        seat.status = "booked";
        seat.passengerId = passenger.passengerId;
      });

      train.reservations.push({
        passengerId: passenger.passengerId,
        passengerName: passenger.name,
        seats: allocatedSeats.map((seat) => seat.seatNumber),
      });

      alert(
        `Seats allocated to ${passenger.name}: ${allocatedSeats
          .map((seat) => `#${seat.seatNumber}`)
          .join(", ")}`
      );
    }
  }
  // Generate report for active trains
  document
    .getElementById("generateReport")
    .addEventListener("click", async () => {
      const today = new Date().toISOString().split("T")[0]; // Get today's date in yyyy-mm-dd format

      try {
        const response = await fetch(
          `http://localhost:3000/passenger/active-trains?date=${today}`
        );
        const activeTrains = await response.json();

        const reportResults = document.getElementById("reportResults");

        if (activeTrains.length > 0) {
          let reportHTML = "<h3>Active Trains for Today:</h3><ul>";
          activeTrains.forEach((train) => {
            reportHTML += `<li>
                    <strong>${train.name} (${train.number})</strong><br>
                    From: ${train.from_station}, To: ${train.to_station}<br>
                    Departure: ${train.departure}, Arrival: ${train.arrival}
                </li>`;
          });
          reportHTML += "</ul>";
          reportResults.innerHTML = reportHTML;
        } else {
          reportResults.innerHTML = "<p>No active trains for today.</p>";
        }
      } catch (err) {
        console.error("Error fetching active trains:", err);
        alert("Failed to fetch active trains. Please try again.");
      }
    });

  // Fetch reservations for logged-in passenger
  document
    .getElementById("fetchReservations")
    .addEventListener("click", async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/passenger/reservations?passengerId=${loggedInPassenger.id}`
        );
        const reservations = await response.json();

        const reportResults = document.getElementById("reportResults");

        if (reservations.length > 0) {
          let reportHTML = `<h3>My Reservations (${loggedInPassenger.name})</h3><ul>`;
          reservations.forEach((detail) => {
            reportHTML += `<li>
                          Train: <strong>${detail.train_name} (${
              detail.train_number
            })</strong><br>
                          Seats: ${detail.seat_numbers.join(", ")}<br>
                          Departure: ${detail.departure}, Arrival: ${
              detail.arrival
            }
                      </li>`;
          });
          reportHTML += "</ul>";
          reportResults.innerHTML = reportHTML;
        } else {
          reportResults.innerHTML = `<p>No reservations found for ${loggedInPassenger.name}.</p>`;
        }
      } catch (err) {
        console.error("Error fetching reservations:", err);
        alert("Failed to fetch reservations. Please try again.");
      }
    });

  document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {
      try {
        const response = await fetch("http://localhost:3000/passenger/logout", {
          method: "POST",
          credentials: "include", // Ensures cookies are sent
        });

        if (response.ok) {
          alert("You have been logged out.");
          window.location.href = "login.html";
        } else {
          alert("Failed to log out. Please try again.");
        }
      } catch (err) {
        console.error("Error during logout:", err);
        alert("An error occurred. Please try again.");
      }
    });
});
