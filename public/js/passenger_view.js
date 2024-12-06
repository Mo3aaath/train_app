document.addEventListener("DOMContentLoaded", () => {
  // Mock train data with seats, waiting list, and reservations
  const trains = [
    {
      number: "12345",
      name: "Express Train",
      from: "City A",
      to: "City B",
      departure: "10:00 AM",
      arrival: "2:00 PM",
      date: "2024-12-10",
      seats: Array(50).fill(0), // 0 means available, 1 means booked
      waitingList: [], // Store passenger details in the waiting list
      reservations: [], // Temporary reservations with deadlines
    },
    {
      number: "67890",
      name: "Fast Train",
      from: "City A",
      to: "City C",
      departure: "12:00 PM",
      arrival: "4:00 PM",
      date: "2024-12-10",
      seats: Array(50).fill(0),
      waitingList: [],
      reservations: [],
    },
  ];

  // Variables to store selected train and seats
  let selectedTrain = null;
  let selectedSeats = [];

  // Search for trains
  document
    .getElementById("searchForm")
    .addEventListener("submit", function (e) {
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

      const matchingTrains = trains.filter(
        (train) =>
          train.from.toLowerCase() === fromStation &&
          train.to.toLowerCase() === toStation &&
          train.date === travelDate
      );

      const searchResults = document.getElementById("searchResults");
      if (matchingTrains.length > 0) {
        let resultsHTML = "<h3>Available Trains:</h3><ul>";
        matchingTrains.forEach((train, index) => {
          resultsHTML += `<li>
                  <strong>${train.name} (${train.number})</strong><br>
                  Departure: ${train.departure}, Arrival: ${train.arrival}<br>
                  <button onclick="selectTrain(${index})">Book</button>
              </li>`;
        });
        resultsHTML += "</ul>";
        searchResults.innerHTML = resultsHTML;
      } else {
        searchResults.innerHTML =
          "<p>No trains found matching your criteria.</p>";
      }
    });

  // Function to select a train and show seat layout
  window.selectTrain = function (trainIndex) {
    selectedTrain = trains[trainIndex];
    selectedSeats = [];

    // Display train details
    const trainDetails = document.getElementById("trainDetails");
    trainDetails.innerHTML = `<strong>${selectedTrain.name} (${selectedTrain.number})</strong><br>
                                Departure: ${selectedTrain.departure}, Arrival: ${selectedTrain.arrival}`;

    // Generate seat layout
    const seatLayout = document.getElementById("seatLayout");
    seatLayout.innerHTML = "";
    selectedTrain.seats.forEach((seat, index) => {
      const seatDiv = document.createElement("div");
      seatDiv.classList.add("seat");
      seatDiv.textContent = index + 1;
      seatDiv.style.backgroundColor =
        seat === 0 ? "green" : seat === 2 ? "yellow" : "red";
      seatDiv.onclick = () => toggleSeat(index);
      seatDiv.style.cursor = seat === 0 ? "pointer" : "not-allowed";
      seatDiv.dataset.index = index;
      if (seat !== 0) seatDiv.onclick = null;
      seatLayout.appendChild(seatDiv);
    });

    // Show seat booking section
    document.getElementById("seatBooking").style.display = "block";
  };

  // Function to toggle seat selection
  function toggleSeat(index) {
    if (selectedTrain.seats[index] !== 0) return; // Already booked or temporarily reserved

    const seatDiv = document.querySelector(`[data-index="${index}"]`);
    if (selectedSeats.includes(index)) {
      selectedSeats = selectedSeats.filter((seat) => seat !== index);
      seatDiv.style.backgroundColor = "green";
    } else {
      selectedSeats.push(index);
      seatDiv.style.backgroundColor = "yellow";
    }
  }

  // Confirm booking
  document
    .getElementById("confirmBooking")
    .addEventListener("click", function () {
      if (selectedSeats.length === 0) {
        alert("Please select at least one seat.");
        return;
      }

      const passenger = { name: "John Doe", seatCount: selectedSeats.length }; // Mock passenger data

      if (selectedSeats.length > 0) {
        addTemporaryReservation(selectedTrain, passenger, selectedSeats);
        alert(
          `Seats temporarily reserved: ${selectedSeats
            .map((seat) => seat + 1)
            .join(", ")}. Please complete payment within 15 minutes.`
        );
        sessionStorage.setItem(
          "bookingDetails",
          JSON.stringify({
            trainName: selectedTrain.name,
            trainNumber: selectedTrain.number,
            seats: selectedSeats,
          })
        );
        window.location.href = "payment.html"; // Redirect to payment page
      } else {
        addToWaitingList(selectedTrain, passenger);
      }
    });

  // Add to waiting list
  function addToWaitingList(train, passenger) {
    train.waitingList.push(passenger);
    alert(`No seats available. You have been added to the waiting list.`);
  }

  // Add temporary reservation
  function addTemporaryReservation(train, passenger, seats) {
    const deadline = Date.now() + 15 * 60 * 1000; // 15-minute payment deadline
    train.reservations.push({ passenger, seats, deadline });
    seats.forEach((seatIndex) => (train.seats[seatIndex] = 2)); // Mark as temporarily reserved
  }

  // Automatic cancellation of reservations
  function checkAndCancelReservations(train) {
    const now = Date.now();
    train.reservations = train.reservations.filter((reservation) => {
      if (now > reservation.deadline) {
        // Cancel reservation and free seats
        reservation.seats.forEach((seatIndex) => (train.seats[seatIndex] = 0));
        alert(
          `Reservation for ${reservation.passenger.name} has been cancelled due to non-payment.`
        );
        allocateSeatsFromWaitingList(train);
        return false; // Remove expired reservation
      }
      return true; // Keep valid reservation
    });
  }

  // Periodically check reservations
  setInterval(() => {
    trains.forEach((train) => checkAndCancelReservations(train));
  }, 60 * 1000); // Check every minute

  // Allocate seats from waiting list
  function allocateSeatsFromWaitingList(train) {
    while (train.waitingList.length > 0 && train.seats.includes(0)) {
      const passenger = train.waitingList.shift();
      const availableSeats = train.seats
        .map((seat, index) => (seat === 0 ? index : null))
        .filter((index) => index !== null);
      const allocatedSeats = availableSeats.slice(0, passenger.seatCount);

      if (allocatedSeats.length < passenger.seatCount) {
        train.waitingList.unshift(passenger); // Put the passenger back if not enough seats
        break;
      }

      allocatedSeats.forEach((seatIndex) => (train.seats[seatIndex] = 1));
      alert(
        `Seats allocated to ${passenger.name}: ${allocatedSeats
          .map((seat) => seat + 1)
          .join(", ")}`
      );
    }
  }

  // Logout functionality
  document
    .getElementById("logoutButton")
    .addEventListener("click", function () {
      localStorage.clear();
      alert("You have successfully logged out.");
      window.location.href = "login.html";
    });
});
