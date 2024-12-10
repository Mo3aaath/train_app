document.addEventListener("DOMContentLoaded", () => {
  const loggedInPassenger = {
    id: "P001",
    name: "John Doe",
  };

  const trains = [
    {
      number: "12345",
      name: "Express Train",
      from: "City A",
      to: "City B",
      departure: "10:00 AM",
      arrival: "2:00 PM",
      date: "2024-12-10",
      seats: Array.from({ length: 50 }, (_, index) => ({
        seatNumber: index + 1,
        status: "available", // available, booked, reserved
        passengerId: null,
      })),
      waitingList: [],
      reservations: [],
    },
    {
      number: "67890",
      name: "Fast Train",
      from: "City A",
      to: "City C",
      departure: "12:00 PM",
      arrival: "4:00 PM",
      date: "2024-12-10",
      seats: Array.from({ length: 50 }, (_, index) => ({
        seatNumber: index + 1,
        status: "available",
        passengerId: null,
      })),
      waitingList: [],
      reservations: [],
    },
  ];

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

    const trainDetails = document.getElementById("trainDetails");
    trainDetails.innerHTML = `<strong>${selectedTrain.name} (${selectedTrain.number})</strong><br>
                                Departure: ${selectedTrain.departure}, Arrival: ${selectedTrain.arrival}`;

    const seatLayout = document.getElementById("seatLayout");
    seatLayout.innerHTML = "";
    selectedTrain.seats.forEach((seat) => {
      const seatDiv = document.createElement("div");
      seatDiv.classList.add("seat");
      seatDiv.textContent = seat.seatNumber;
      seatDiv.style.backgroundColor =
        seat.status === "available"
          ? "green"
          : seat.status === "reserved"
          ? "yellow"
          : "red";
      seatDiv.onclick = () => toggleSeat(seat.seatNumber - 1);
      seatDiv.style.cursor =
        seat.status === "available" ? "pointer" : "not-allowed";
      seatDiv.dataset.index = seat.seatNumber - 1;
      if (seat.status !== "available") seatDiv.onclick = null;
      seatLayout.appendChild(seatDiv);
    });

    document.getElementById("seatBooking").style.display = "block";
  };

  // Toggle seat selection
  function toggleSeat(index) {
    const seat = selectedTrain.seats[index];
    if (seat.status !== "available") return;

    const seatDiv = document.querySelector(`[data-index="${index}"]`);
    if (selectedSeats.includes(index)) {
      selectedSeats = selectedSeats.filter((seatIndex) => seatIndex !== index);
      seat.status = "available";
      seat.passengerId = null;
      seatDiv.style.backgroundColor = "green";
    } else {
      selectedSeats.push(index);
      seat.status = "reserved";
      seat.passengerId = loggedInPassenger.id;
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

      selectedSeats.forEach((seatIndex) => {
        const seat = selectedTrain.seats[seatIndex];
        seat.status = "booked";
        seat.passengerId = loggedInPassenger.id;
      });

      selectedTrain.reservations.push({
        passengerId: loggedInPassenger.id,
        passengerName: loggedInPassenger.name,
        seats: selectedSeats.map((seatIndex) => seatIndex + 1),
      });

      alert(
        `Reservation confirmed for ${
          loggedInPassenger.name
        }. Seats: ${selectedSeats.map((seatIndex) => seatIndex + 1).join(", ")}`
      );

      document.getElementById("seatBooking").style.display = "none";
      document.getElementById("searchResults").innerHTML = "";
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
  const today = new Date().toISOString().split("T")[0]; // Get today's date in yyyy-mm-dd format

  document.getElementById("generateReport").addEventListener("click", () => {
    const activeTrains = trains.filter((train) => train.date === today);
    const reportResults = document.getElementById("reportResults");

    if (activeTrains.length > 0) {
      let reportHTML = "<h3>Active Trains for Today:</h3><ul>";
      activeTrains.forEach((train) => {
        reportHTML += `<li>
                    <strong>${train.name} (${train.number})</strong><br>
                    From: ${train.from}, To: ${train.to}<br>
                    Departure: ${train.departure}, Arrival: ${train.arrival}
                </li>`;
      });
      reportHTML += "</ul>";
      reportResults.innerHTML = reportHTML;
    } else {
      reportResults.innerHTML = "<p>No active trains for today.</p>";
    }
  });
  // Fetch reservations for logged-in passenger
  document.getElementById("fetchReservations").addEventListener("click", () => {
    const reportResults = document.getElementById("reportResults");

    let reservationDetails = [];
    trains.forEach((train) => {
      train.reservations.forEach((reservation) => {
        if (reservation.passengerId === loggedInPassenger.id) {
          reservationDetails.push({
            trainName: train.name,
            trainNumber: train.number,
            seats: reservation.seats,
            departure: train.departure,
            arrival: train.arrival,
          });
        }
      });
    });

    if (reservationDetails.length > 0) {
      let reportHTML = `<h3>My Reservations (${loggedInPassenger.name})</h3><ul>`;
      reservationDetails.forEach((detail) => {
        reportHTML += `<li>
                      Train: <strong>${detail.trainName} (${
          detail.trainNumber
        })</strong><br>
                      Seats: ${detail.seats
                        .map((seat) => `#${seat}`)
                        .join(", ")}<br>
                      Departure: ${detail.departure}, Arrival: ${detail.arrival}
                  </li>`;
      });
      reportHTML += "</ul>";
      reportResults.innerHTML = reportHTML;
    } else {
      reportResults.innerHTML = `<p>No reservations found for ${loggedInPassenger.name}.</p>`;
    }
  });

  document.getElementById("confirmBooking").addEventListener("click", function () {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat.");
      return;
    }
  
    // Temporarily reserve the seats
    selectedSeats.forEach((seatIndex) => {
      const seat = selectedTrain.seats[seatIndex];
      seat.status = "reserved";
      seat.passengerId = loggedInPassenger.id;
    });
  
    // Store reservation details in sessionStorage
    sessionStorage.setItem(
      "reservationDetails",
      JSON.stringify({
        trainNumber: selectedTrain.number,
        trainName: selectedTrain.name,
        passengerId: loggedInPassenger.id,
        passengerName: loggedInPassenger.name,
        seats: selectedSeats.map((seatIndex) => seatIndex + 1),
      })
    );
  
    // Redirect to the Payment Page
    window.location.href = "payment.html";
  });
  
});
