document.addEventListener("DOMContentLoaded", () => {
  let selectedTrain = null;
  let selectedSeats = [];

  // Search Trains
  document
    .getElementById("searchTrainForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const fromStation = document.getElementById("fromStation").value.trim();
      const toStation = document.getElementById("toStation").value.trim();
      const travelDate = document.getElementById("travelDate").value;

      try {
        const response = await fetch(
          "http://localhost:3000/admin/search-trains",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fromStation, toStation, travelDate }),
          }
        );

        const trains = await response.json();
        if (response.ok) {
          renderTrainSearchResults(trains);
        } else {
          alert("No trains found matching your criteria.");
        }
      } catch (err) {
        console.error("Error searching for trains:", err);
        alert("Failed to search trains. Please try again.");
      }
    });

  function renderTrainSearchResults(trains) {
    const trainSearchResults = document.getElementById("trainSearchResults");
    trainSearchResults.innerHTML = trains.length
      ? trains
          .map(
            (train) => `
              <div>
                <strong>${train.name} (ID: ${train.id})</strong><br>
                Departure: ${train.departure}, Arrival: ${train.arrival}<br>
                From: ${train.from_station}, To: ${train.to_station}<br>
                <button onclick="selectTrain('${train.id}')">Book</button>
              </div>
            `
          )
          .join("")
      : "<p>No trains available.</p>";
  }

  // Select Train
  window.selectTrain = async function (trainId) {
    try {
      const response = await fetch(
        `http://localhost:3000/admin/train/${trainId}`
      );
      const trainData = await response.json();

      if (response.ok) {
        selectedTrain = trainData;
        selectedSeats = [];

        const trainDetails = document.getElementById("trainDetails");
        trainDetails.innerHTML = `
          <strong>${selectedTrain.name} (${selectedTrain.number})</strong><br>
          Departure: ${selectedTrain.departure}, Arrival: ${selectedTrain.arrival}`;

        const seatLayout = document.getElementById("seatLayout");
        seatLayout.innerHTML = selectedTrain.seats
          .map(
            (seat, index) => `
            <div class="seat" 
                 style="background-color: ${
                   seat.status === "available" ? "green" : "red"
                 }" 
                 data-index="${index}" 
                 onclick="toggleSeat(${index})">
              ${seat.seat_number}
            </div>`
          )
          .join("");

        document.getElementById("seatBooking").style.display = "block";
      } else {
        alert("Failed to fetch train details.");
      }
    } catch (err) {
      console.error("Error fetching train details:", err);
      alert("Failed to fetch train details. Please try again.");
    }
  };
  function toggleSeat(seatNumber) {
    const seatDiv = document.querySelector(`.seat:nth-child(${seatNumber})`);

    if (seatDiv.classList.contains("reserved")) {
      // Deselect reserved seat
      seatDiv.classList.remove("reserved");
      seatDiv.style.backgroundColor = "green";
      selectedSeats = selectedSeats.filter((num) => num !== seatNumber);
    } else if (seatDiv.style.backgroundColor === "green") {
      // Select available seat
      seatDiv.style.backgroundColor = "yellow";
      selectedSeats.push(seatNumber);
    } else if (seatDiv.style.backgroundColor === "yellow") {
      // Deselect selected seat
      seatDiv.style.backgroundColor = "green";
      selectedSeats = selectedSeats.filter((num) => num !== seatNumber);
    }
  }

  // Toggle Seat Selection
  window.selectTrain = async function (trainId) {
    try {
      const response = await fetch(
        `http://localhost:3000/admin/train/${trainId}`
      );
      const trainData = await response.json();

      if (response.ok) {
        selectedTrain = trainData;
        selectedSeats = [];

        // Display train details
        const trainDetails = document.getElementById("trainDetails");
        trainDetails.innerHTML = `
          <strong>${selectedTrain.name} (${selectedTrain.number})</strong><br>
          Departure: ${selectedTrain.departure}, Arrival: ${selectedTrain.arrival}
        `;

        // Generate seat layout
        const seatLayout = document.getElementById("seatLayout");
        seatLayout.innerHTML = ""; // Clear previous layout

        selectedTrain.seats
          .sort((a, b) => a.seat_number - b.seat_number) // Sort by seat_number
          .forEach((seat, index) => {
            const seatDiv = document.createElement("div");
            seatDiv.classList.add("seat");
            seatDiv.textContent = seat.seat_number;

            // Set background color based on availability
            seatDiv.style.backgroundColor =
              seat.status === "available" ? "green" : "red";

            // Set `data-index` to the actual index for the toggle function
            seatDiv.setAttribute("data-index", index);

            // Make only available seats interactive
            if (seat.status === "available") {
              seatDiv.style.cursor = "pointer";
              seatDiv.onclick = () => toggleSeat(index);
            } else {
              seatDiv.style.cursor = "not-allowed";
              seatDiv.onclick = null;
            }

            seatLayout.appendChild(seatDiv);
          });

        document.getElementById("seatBooking").style.display = "block";
      } else {
        alert("Failed to fetch train details.");
      }
    } catch (err) {
      console.error("Error fetching train details:", err);
      alert("Failed to fetch train details. Please try again.");
    }
  };

  // Confirm Booking
  document
    .getElementById("confirmBooking")
    .addEventListener("click", async () => {
      const passengerId = prompt("Enter the Passenger ID:");
      if (!passengerId) {
        alert("Passenger ID is required.");
        return;
      }

      if (selectedSeats.length === 0) {
        alert("Please select at least one seat.");
        return;
      }

      const seatNumbers = selectedSeats.map(
        (index) => selectedTrain.seats[index].seat_number
      );

      try {
        const response = await fetch(
          "http://localhost:3000/admin/add-reservation",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              trainId: selectedTrain.id, // Include the selected train ID
              passengerId,
              seats: seatNumbers,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          alert(data.message);

          // Clear selections and hide the booking section
          selectedSeats = [];
          document.getElementById("seatBooking").style.display = "none";
          document.getElementById("trainSearchResults").innerHTML = "";
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Error adding reservation:", err);
        alert("Failed to add reservation. Please try again.");
      }
    });

  document
    .getElementById("fetchReservationBtn")
    .addEventListener("click", async () => {
      const passengerId = document
        .getElementById("editPassengerId")
        .value.trim();
      const trainNumber = document
        .getElementById("editTrainNumber")
        .value.trim();

      if (!passengerId || !trainNumber) {
        alert("Please provide both Passenger ID and Train Number.");
        return;
      }

      // Call the fetchReservationDetails function
      await fetchReservationDetails(passengerId, trainNumber);
    });

  let editSelectedSeats = [];
  function toggleEditSeat(seatNumber) {
    const seatDiv = document.querySelector(`[data-index="${seatNumber}"]`);
    if (!seatDiv) return;

    if (editSelectedSeats.includes(seatNumber)) {
      editSelectedSeats = editSelectedSeats.filter(
        (seat) => seat !== seatNumber
      );
      seatDiv.style.backgroundColor = "green";
    } else {
      editSelectedSeats.push(seatNumber);
      seatDiv.style.backgroundColor = "yellow";
    }
  }
  document
    .getElementById("confirmEditReservation")
    .addEventListener("click", async () => {
      if (!selectedSeatForEdit) {
        alert("Please select a new seat.");
        return;
      }

      const passengerId = document.getElementById("passengerIdInput").value;
      const trainNumber = document.getElementById("trainNumberInput").value;

      try {
        const response = await fetch(
          "http://localhost:3000/admin/edit-reservation",
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              passengerId,
              trainNumber,
              newSeat: selectedSeatForEdit,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          document.getElementById("editReservationSection").style.display =
            "none";
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Error editing reservation:", err);
        alert("Failed to edit reservation. Please try again.");
      }
    });

  document
    .getElementById("confirmEditReservation")
    .addEventListener("click", async () => {
      const passengerId = document
        .getElementById("editPassengerId")
        .value.trim();
      const trainNumber = document
        .getElementById("editTrainNumber")
        .value.trim();

      if (!passengerId || !trainNumber) {
        alert("Passenger ID and Train Number are required.");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3000/admin/edit-reservation",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              passengerId,
              trainNumber,
              seatChanges: editSelectedSeats,
            }),
          }
        );

        const result = await response.json();
        if (response.ok) {
          alert(result.message);
          document.getElementById("editReservationDetails").style.display =
            "none";
        } else {
          alert(result.message);
        }
      } catch (err) {
        console.error("Error editing reservation:", err);
        alert("Failed to edit reservation. Please try again.");
      }
    });
  async function fetchReservationDetails(passengerId, trainNumber) {
    try {
      const response = await fetch(
        `http://localhost:3000/admin/get-reservation?passengerId=${passengerId}&trainNumber=${trainNumber}`
      );
      if (!response.ok) {
        throw new Error("Reservation not found");
      }

      const reservationDetails = await response.json();
      displayReservationDetails(reservationDetails);
    } catch (err) {
      console.error("Failed to fetch reservation details:", err);
      alert(err.message);
    }
  }

  function displayReservationDetails(reservationDetails) {
    const { train, reservedSeats } = reservationDetails;

    // Display reservation details
    const reservationDetailsDiv = document.getElementById("reservationDetails");
    reservationDetailsDiv.innerHTML = `
      <p><strong>Train Name:</strong> ${train.name}</p>
      <p><strong>Train Number:</strong> ${train.number}</p>
      <p><strong>Current Seat:</strong> ${reservedSeats[0]}</p>
    `;

    // Display seat layout
    const seatLayout = document.getElementById("seatLayout");
    seatLayout.innerHTML = "";
    train.seats.forEach((seat) => {
      const seatDiv = document.createElement("div");
      seatDiv.classList.add("seat");
      seatDiv.textContent = seat.seat_number;

      if (reservedSeats.includes(seat.seat_number)) {
        seatDiv.style.backgroundColor = "yellow"; // Highlight reserved seat
        seatDiv.classList.add("reserved");
      } else if (seat.status === "available") {
        seatDiv.style.backgroundColor = "green"; // Available seat
      } else {
        seatDiv.style.backgroundColor = "red"; // Booked seat
      }

      seatDiv.onclick = () => toggleSeatForEdit(seat.seat_number);
      seatLayout.appendChild(seatDiv);
    });

    document.getElementById("editReservationDetails").style.display = "block";
  }

  function toggleSeatForEdit(seatNumber) {
    const seatDivs = document.querySelectorAll(".seat");

    seatDivs.forEach((div) => {
      if (div.classList.contains("reserved")) {
        div.style.backgroundColor = "yellow";
      } else if (div.style.backgroundColor === "green") {
        div.style.backgroundColor = "green";
      }
    });

    const selectedSeatDiv = [...seatDivs].find(
      (div) => parseInt(div.textContent) === seatNumber
    );

    if (selectedSeatDiv) {
      selectedSeatDiv.style.backgroundColor = "blue";
      selectedSeatForEdit = seatNumber;
    }
  }

  // Confirm reservation edits
  document
    .getElementById("confirmEditReservation")
    .addEventListener("click", async () => {
      if (!selectedSeatForEdit) {
        alert("Please select a new seat.");
        return;
      }

      const passengerId = document
        .getElementById("editPassengerId")
        .value.trim();
      const trainNumber = document
        .getElementById("editTrainNumber")
        .value.trim();

      try {
        const response = await fetch(
          "http://localhost:3000/admin/edit-reservation",
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              passengerId,
              trainNumber,
              newSeat: selectedSeatForEdit,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          document.getElementById("editReservationDetails").style.display =
            "none";
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Error editing reservation:", err);
        alert("Failed to edit reservation. Please try again.");
      }
    });

  document
    .getElementById("confirmEditReservation")
    .addEventListener("click", async () => {
      if (!selectedSeatForEdit) {
        alert("Please select a new seat.");
        return;
      }

      const passengerId = document
        .getElementById("editPassengerId")
        .value.trim();
      const trainNumber = document
        .getElementById("editTrainNumber")
        .value.trim();

      try {
        const response = await fetch(
          "http://localhost:3000/admin/edit-reservation",
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              passengerId,
              trainNumber,
              newSeat: selectedSeatForEdit,
            }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          document.getElementById("editReservationSection").style.display =
            "none";
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Error editing reservation:", err);
        alert("Failed to edit reservation. Please try again.");
      }
    });

  function displayReservationDetails(details) {
    document.getElementById("reservationDetails").innerHTML = `
      <p><strong>Passenger ID:</strong> ${details.passenger}</p>
      <p><strong>Train ID:</strong> ${details.train_id}</p>
      <p><strong>Seat Number:</strong> ${details.seat_num}</p>
      <p><strong>Created At:</strong> ${details.created_at}</p>
      <p><strong>Paid:</strong> ${details.paid}</p>
      <p><strong>Deadline:</strong> ${details.deadline}</p>
    `;
  }

  document
    .getElementById("deleteReservationForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const trainId = document.getElementById("deleteTrainId").value.trim();
      const passengerId = document
        .getElementById("deletePassengerId")
        .value.trim();

      if (!trainId || !passengerId) {
        alert("Please provide both Train ID and Passenger ID.");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3000/admin/delete-reservation",
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trainId, passengerId }),
          }
        );

        const data = await response.json();
        if (response.ok) {
          alert(data.message);
          document.getElementById("deleteReservationForm").reset();
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Error deleting reservation:", err);
        alert("Failed to delete reservation. Please try again.");
      }
    });

  document
    .getElementById("logoutButton")
    .addEventListener("click", async () => {
      try {
        const response = await fetch("http://localhost:3000/admin/logout", {
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

  // Handle Assign Staff Form Submission
  document
    .getElementById("assignStaffForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const trainId = document.getElementById("trainId").value.trim();
      const staffRole = document.getElementById("staffRole").value.trim();
      const staffName = document.getElementById("staffName").value.trim();

      if (!trainId || !staffRole || !staffName) {
        alert("All fields are required.");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:3000/admin/assign-staff",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ trainId, staffRole, staffName }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          alert(data.message);
          document.getElementById("assignStaffForm").reset(); // Reset the form
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Error assigning staff:", err);
        alert("Failed to assign staff. Please try again.");
      }
    });

  // Handle Promote Waitlisted Passenger Form Submission
  document
    .getElementById("promoteWaitlistForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const trainId = document
        .getElementById("promoteTrainNumber")
        .value.trim();

      if (!trainId) {
        alert("Train ID is required.");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/admin/promote-waitlist/${trainId}`,
          { method: "POST" }
        );

        const data = await response.json();

        if (response.ok) {
          alert(data.message);
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error("Error promoting waitlisted passenger:", err);
        alert("Failed to promote passenger. Please try again.");
      }
    });

  // Generate Active Trains Report
  // Generate Active Trains Report
  document
    .getElementById("generateReport")
    .addEventListener("click", async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/admin/reports/active-trains"
        );
        const activeTrains = await response.json();

        const reportResults = document.getElementById("reportResults");
        if (activeTrains.length > 0) {
          let reportHTML = "<h3>Active Trains for Today:</h3><ul>";
          activeTrains.forEach((train) => {
            reportHTML += `<li>
                        <strong>${train.name} (Train ID: ${train.id})</strong><br>
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
        console.error("Error generating active trains report:", err);
        alert("Failed to generate report. Please try again.");
      }
    });

  // Generate Stations Report
  document
    .getElementById("listStationsReport")
    .addEventListener("click", async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/admin/reports/stations"
        );
        const stations = await response.json();

        const reportResults = document.getElementById("reportResults");
        if (stations.length > 0) {
          let reportHTML = "<h3>Stations for Each Train:</h3><ul>";
          stations.forEach((train) => {
            reportHTML += `<li>
                        <strong>${train.name} (Train ID: ${train.id})</strong><br>
                        Route: ${train.from_station} → ${train.to_station}
                      </li>`;
          });
          reportHTML += "</ul>";
          reportResults.innerHTML = reportHTML;
        } else {
          reportResults.innerHTML = "<p>No stations available to list.</p>";
        }
      } catch (err) {
        console.error("Error generating stations report:", err);
        alert("Failed to generate report. Please try again.");
      }
    });

  // View Waitlisted Loyalty Passengers
  document
    .getElementById("waitlistedLoyaltyForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const trainNumber = document.getElementById("trainNumber").value.trim();

      try {
        const response = await fetch(
          `http://localhost:3000/admin/reports/waitlist/${trainNumber}`
        );
        const loyaltyPassengers = await response.json();

        const reportResults = document.getElementById("reportResults");
        if (loyaltyPassengers.length > 0) {
          let reportHTML = `<h3>Waitlisted Loyalty Passengers for Train ${trainNumber}</h3><ul>`;
          loyaltyPassengers.forEach((passenger) => {
            reportHTML += `<li>
                        ${passenger.name} (Passenger ID: ${passenger.passenger_id}) - ${passenger.class} Class
                      </li>`;
          });
          reportHTML += "</ul>";
          reportResults.innerHTML = reportHTML;
        } else {
          reportResults.innerHTML = `<p>No loyalty passengers on the waitlist for Train ${trainNumber}.</p>`;
        }
      } catch (err) {
        console.error("Error fetching waitlisted passengers:", err);
        alert("Failed to fetch waitlisted passengers. Please try again.");
      }
    });
});
