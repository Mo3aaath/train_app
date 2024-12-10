document.addEventListener("DOMContentLoaded", () => {
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
      stations: ["City A", "City X", "City Y", "City B"],
      waitingList: [
        {
          passengerId: "W001",
          name: "John Doe",
          loyalty: true,
          class: "Economy",
        },
        {
          passengerId: "W002",
          name: "Jane Smith",
          loyalty: false,
          class: "First Class",
        },
      ],
      reservations: [
        {
          reservationId: "R001",
          passengerId: "P001",
          passengerName: "Alice Brown",
          seats: [1, 2],
        },
      ],
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
      stations: ["City A", "City Z", "City C"],
      waitingList: [
        {
          passengerId: "W003",
          name: "Alice Brown",
          loyalty: true,
          class: "Business",
        },
      ],
      reservations: [],
    },
  ];

  let selectedTrain = null;
  let selectedSeats = [];

  // Search for trains
  document
    .getElementById("addReservationForm")
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
                  <button onclick="selectTrain(${index})">Select Seats</button>
              </li>`;
        });
        resultsHTML += "</ul>";
        searchResults.innerHTML = resultsHTML;
      } else {
        searchResults.innerHTML =
          "<p>No trains found matching your criteria.</p>";
      }
    });

  // Select a train and show seat layout
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
      seatDiv.style.backgroundColor = seat === 0 ? "green" : "red";
      seatDiv.onclick = () => toggleSeat(index);
      seatDiv.style.cursor = seat === 0 ? "pointer" : "not-allowed";
      seatDiv.dataset.index = index;
      if (seat !== 0) seatDiv.onclick = null;
      seatLayout.appendChild(seatDiv);
    });

    // Show seat booking section
    document.getElementById("seatBooking").style.display = "block";
  };

  // Toggle seat selection
  function toggleSeat(index) {
    if (selectedTrain.seats[index] !== 0) return; // Skip already booked seats

    const seatDiv = document.querySelector(`[data-index="${index}"]`);
    if (selectedSeats.includes(index)) {
      selectedSeats = selectedSeats.filter((seat) => seat !== index);
      seatDiv.style.backgroundColor = "green";
    } else {
      selectedSeats.push(index);
      seatDiv.style.backgroundColor = "yellow";
    }
  }

  // Confirm reservation
  document
    .getElementById("confirmBooking")
    .addEventListener("click", function () {
      const passengerName = prompt("Enter the passenger's name:");

      if (!passengerName) {
        alert("Passenger name is required.");
        return;
      }

      if (selectedSeats.length === 0) {
        const passenger = { passengerName };
        addToWaitingList(selectedTrain, passenger);
        alert(`${passengerName} has been added to the waiting list.`);
        return;
      }

      selectedSeats.forEach((seatIndex) => {
        selectedTrain.seats[seatIndex] = 1; // Mark seat as booked
      });

      selectedTrain.reservations.push({
        passengerName,
        seats: [...selectedSeats],
      });

      alert(
        `Reservation added for ${passengerName}. Seats: ${selectedSeats
          .map((seat) => seat + 1)
          .join(", ")}`
      );

      // Reset selections and hide seat booking section
      selectedSeats = [];
      document.getElementById("seatBooking").style.display = "none";
      document.getElementById("addReservationForm").reset();
      document.getElementById("searchResults").innerHTML = ""; // Clear search results
    });

  // Add passenger to waiting list
  function addToWaitingList(train, passenger) {
    train.waitingList.push(passenger);
    alert(`${passenger.passengerName} has been added to the waiting list.`);
    promoteFromWaitingList(train); // Attempt to promote passengers if seats become available
  }

  // Promote passengers from waiting list
  function promoteFromWaitingList(train) {
    while (train.waitingList.length > 0 && train.seats.includes(0)) {
      const passenger = train.waitingList.shift();
      const availableSeatIndex = train.seats.indexOf(0);

      if (availableSeatIndex !== -1) {
        train.seats[availableSeatIndex] = 1; // Assign seat
        train.reservations.push({
          passengerName: passenger.passengerName,
          seats: [availableSeatIndex],
        });
        alert(
          `Promoted ${passenger.passengerName} from the waiting list to seat ${
            availableSeatIndex + 1
          }.`
        );
      }
    }
  }

  const today = new Date().toISOString().split("T")[0]; // Get today's date in yyyy-mm-dd format

  // Generate Active Trains Report
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

  // Generate Stations Report for Each Train
  document
    .getElementById("listStationsReport")
    .addEventListener("click", () => {
      const reportResults = document.getElementById("reportResults");

      if (trains.length > 0) {
        let reportHTML = "<h3>Stations for Each Train:</h3><ul>";
        trains.forEach((train) => {
          reportHTML += `<li>
                    <strong>${train.name} (${train.number})</strong><br>
                    Stations: ${train.stations.join(" → ")}
                </li>`;
        });
        reportHTML += "</ul>";
        reportResults.innerHTML = reportHTML;
      } else {
        reportResults.innerHTML =
          "<p>No trains available to list stations.</p>";
      }
    });

  // Fetch Waitlisted Loyalty Passengers for a Train
  document
    .getElementById("waitlistedLoyaltyForm")
    .addEventListener("submit", (e) => {
      e.preventDefault();

      const trainNumber = document.getElementById("trainNumber").value.trim();
      const reportResults = document.getElementById("reportResults");

      const train = trains.find((t) => t.number === trainNumber);
      if (!train) {
        reportResults.innerHTML = `<p>No train found with number ${trainNumber}.</p>`;
        return;
      }

      const loyaltyPassengers = train.waitingList.filter(
        (passenger) => passenger.loyalty
      );

      if (loyaltyPassengers.length > 0) {
        let reportHTML = `<h3>Waitlisted Loyalty Passengers for Train: ${train.name} (${train.number})</h3><ul>`;
        const groupedByClass = loyaltyPassengers.reduce((groups, passenger) => {
          if (!groups[passenger.class]) groups[passenger.class] = [];
          groups[passenger.class].push(passenger);
          return groups;
        }, {});

        for (const [trainClass, passengers] of Object.entries(groupedByClass)) {
          reportHTML += `<li>
                  <strong>${trainClass} Class</strong>
                  <ul>
                      ${passengers
                        .map(
                          (p) =>
                            `<li>${p.name} (Passenger ID: ${p.passengerId})</li>`
                        )
                        .join("")}
                  </ul>
              </li>`;
        }

        reportHTML += "</ul>";
        reportResults.innerHTML = reportHTML;
      } else {
        reportResults.innerHTML = `<p>No loyalty passengers on the waiting list for Train ${trainNumber}.</p>`;
      }
    });
});
