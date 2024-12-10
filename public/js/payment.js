document.addEventListener("DOMContentLoaded", () => {
    // Retrieve booking details from sessionStorage
    const bookingDetails = JSON.parse(sessionStorage.getItem("bookingDetails"));
    const bookingDetailsElement = document.getElementById("bookingDetails");
  
    if (!bookingDetails) {
      bookingDetailsElement.textContent =
        "No booking details found. Please return to the dashboard.";
      return;
    }
  
    // Display booking details
    bookingDetailsElement.innerHTML = `
          <p><strong>Train:</strong> ${bookingDetails.trainName} (${bookingDetails.trainNumber})</p>
          <p><strong>Seats:</strong> ${bookingDetails.seats
            .map((seat) => `#${seat}`)
            .join(", ")}</p>
          <p><strong>Total Amount:</strong> $${
            bookingDetails.seats.length * 10
          } (Assuming $10 per seat)</p>
      `;
  
    // Handle "Pay Now"
    document.getElementById("payNow").addEventListener("click", function (e) {
      e.preventDefault();
      finalizePayment(bookingDetails, true); // Finalize payment immediately
      alert("Payment successful! Your tickets will be emailed to you shortly.");
      sessionStorage.removeItem("bookingDetails");
      window.location.href = "../passenger_view.html"; // Redirect to dashboard
    });
  
    // Handle "Pay Later"
    document.getElementById("payLater").addEventListener("click", function () {
      const deadline = Date.now() + 5 * 60 * 60 * 1000; // Set deadline for 5 hours
      finalizePayment(bookingDetails, false, deadline); // Reserve seats temporarily
      alert(
        "You have chosen to pay later. Please complete the payment within 5 hours."
      );
      sessionStorage.removeItem("bookingDetails");
      window.location.href = "passenger_view.html"; // Redirect to dashboard
    });
  });
  
  // Finalize payment or reservation
  function finalizePayment(details, paid, deadline = null) {
    const trains = JSON.parse(localStorage.getItem("trains")) || []; // Retrieve train data
    const train = trains.find((t) => t.number === details.trainNumber);
  
    if (train) {
      details.seats.forEach((seatNumber) => {
        const seat = train.seats.find((s) => s.seatNumber === seatNumber);
        if (seat) {
          seat.status = paid ? "booked" : "reserved";
          seat.passengerId = details.passengerId;
        }
      });
  
      train.reservations.push({
        passengerId: details.passengerId,
        passengerName: details.passengerName,
        seats: details.seats,
        paid,
        deadline,
      });
  
      // Save updated train data to localStorage
      localStorage.setItem("trains", JSON.stringify(trains));
    }
  }
  
  // Automatic cancellation of unpaid reservations
  setInterval(() => {
    const trains = JSON.parse(localStorage.getItem("trains")) || [];
    const now = Date.now();
  
    trains.forEach((train) => {
      train.reservations = train.reservations.filter((reservation) => {
        if (!reservation.paid && reservation.deadline && now > reservation.deadline) {
          // Free reserved seats
          reservation.seats.forEach((seatNumber) => {
            const seat = train.seats.find((s) => s.seatNumber === seatNumber);
            if (seat) {
              seat.status = "available";
              seat.passengerId = null;
            }
          });
  
          alert(
            `Reservation for ${reservation.passengerName} has been cancelled due to non-payment.`
          );
          return false; // Remove expired reservation
        }
        return true; // Keep valid reservation
      });
    });
  
    // Save updated train data to localStorage
    localStorage.setItem("trains", JSON.stringify(trains));
  }, 60 * 1000); // Check every minute
  