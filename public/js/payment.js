document.addEventListener('DOMContentLoaded', () => {
    // Retrieve booking details from sessionStorage
    const bookingDetails = JSON.parse(sessionStorage.getItem('bookingDetails'));
    const bookingDetailsElement = document.getElementById('bookingDetails');

    if (!bookingDetails) {
        bookingDetailsElement.textContent = "No booking details found. Please return to the dashboard.";
        return;
    }

    // Display booking details
    bookingDetailsElement.innerHTML = `
        <p><strong>Train:</strong> ${bookingDetails.trainName} (${bookingDetails.trainNumber})</p>
        <p><strong>Seats:</strong> ${bookingDetails.seats.map(seat => seat + 1).join(', ')}</p>
        <p><strong>Total Amount:</strong> $${bookingDetails.seats.length * 10} (Assuming $10 per seat)</p>
    `;

    // Handle payment form submission
    document.getElementById('paymentForm').addEventListener('submit', function (e) {
        e.preventDefault();
        alert("Payment successful! Your tickets will be emailed to you shortly.");
        sessionStorage.removeItem('bookingDetails'); // Clear booking details
        window.location.href = "passenger_view.html"; // Redirect to dashboard
    });
});
