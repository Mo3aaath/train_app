document.addEventListener('DOMContentLoaded', () => {
    // Mock train data with seats
    const trains = [
        {
            number: "12345",
            name: "Express Train",
            from: "City A",
            to: "City B",
            departure: "10:00 AM",
            arrival: "2:00 PM",
            date: "2024-12-10",
            seats: Array(50).fill(0) // 0 means available, 1 means booked
        },
        {
            number: "67890",
            name: "Fast Train",
            from: "City A",
            to: "City C",
            departure: "12:00 PM",
            arrival: "4:00 PM",
            date: "2024-12-10",
            seats: Array(50).fill(0)
        }
    ];

    // Variables to store selected train and seats
    let selectedTrain = null;
    let selectedSeats = [];

    // Search for trains
    document.getElementById('searchForm').addEventListener('submit', function (e) {
        e.preventDefault();

        const fromStation = document.getElementById('fromStation').value.trim().toLowerCase();
        const toStation = document.getElementById('toStation').value.trim().toLowerCase();
        const travelDate = document.getElementById('travelDate').value;

        const matchingTrains = trains.filter(train =>
            train.from.toLowerCase() === fromStation &&
            train.to.toLowerCase() === toStation &&
            train.date === travelDate
        );

        const searchResults = document.getElementById('searchResults');
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
            searchResults.innerHTML = "<p>No trains found matching your criteria.</p>";
        }
    });

    // Function to select a train and show seat layout
    window.selectTrain = function (trainIndex) {
        selectedTrain = trains[trainIndex];
        selectedSeats = [];

        // Display train details
        const trainDetails = document.getElementById('trainDetails');
        trainDetails.innerHTML = `<strong>${selectedTrain.name} (${selectedTrain.number})</strong><br>
                                  Departure: ${selectedTrain.departure}, Arrival: ${selectedTrain.arrival}`;

        // Generate seat layout
        const seatLayout = document.getElementById('seatLayout');
        seatLayout.innerHTML = "";
        selectedTrain.seats.forEach((seat, index) => {
            const seatDiv = document.createElement('div');
            seatDiv.classList.add('seat');
            seatDiv.textContent = index + 1;
            seatDiv.style.backgroundColor = seat === 0 ? 'green' : 'red';
            seatDiv.onclick = () => toggleSeat(index);
            seatDiv.style.cursor = seat === 0 ? 'pointer' : 'not-allowed';
            seatDiv.dataset.index = index;
            if (seat === 1) seatDiv.onclick = null;
            seatLayout.appendChild(seatDiv);
        });

        // Show seat booking section
        document.getElementById('seatBooking').style.display = 'block';
    };

    // Function to toggle seat selection
    function toggleSeat(index) {
        if (selectedTrain.seats[index] === 1) return; // Already booked

        const seatDiv = document.querySelector(`[data-index="${index}"]`);
        if (selectedSeats.includes(index)) {
            selectedSeats = selectedSeats.filter(seat => seat !== index);
            seatDiv.style.backgroundColor = 'green';
        } else {
            selectedSeats.push(index);
            seatDiv.style.backgroundColor = 'yellow';
        }
    }

    // Confirm booking
    document.getElementById('confirmBooking').addEventListener('click', function () {
        if (selectedSeats.length === 0) {
            alert('Please select at least one seat.');
            return;
        }

        // Update train seat data
        selectedSeats.forEach(seatIndex => {
            selectedTrain.seats[seatIndex] = 1; // Mark seat as booked
        });

        alert(`Booking successful! Seats: ${selectedSeats.map(seat => seat + 1).join(', ')}`);
        document.getElementById('seatBooking').style.display = 'none'; // Hide seat layout
    });

    // Logout functionality
    document.getElementById('logoutButton').addEventListener('click', function () {
        localStorage.clear();
        alert("You have successfully logged out.");
        window.location.href = "login.html";
    });
});
