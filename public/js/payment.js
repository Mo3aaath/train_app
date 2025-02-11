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
    <p><strong>Train:</strong> ${bookingDetails.trainName} (${
    bookingDetails.trainNumber
  })</p>
    <p><strong>Seats:</strong> ${bookingDetails.seats
      .map((seat) => `#${seat}`)
      .join(", ")}</p>
    <p><strong>Total Amount:</strong> $${
      bookingDetails.seats.length * 10
    } (Assuming $10 per seat)</p>
  `;

  // Handle "Pay Now"
  document
    .getElementById("payNow")
    .addEventListener("click", async function (e) {
      e.preventDefault();
      await finalizePayment(bookingDetails, true); // Finalize payment immediately
      alert("Payment successful! Your tickets will be emailed to you shortly.");
      sessionStorage.removeItem("bookingDetails");
      window.location.href = "../passenger_view.html"; // Redirect to dashboard
    });

  // Handle "Pay Later"
  document
    .getElementById("payLater")
    .addEventListener("click", async function () {
      const deadline = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(); // Adds 3 hours

      await finalizePayment(bookingDetails, false, deadline); // Reserve seats temporarily
      alert(
        "You have chosen to pay later. Please complete the payment within 3 hours."
      );
      sessionStorage.removeItem("bookingDetails");
      window.location.href = "../passenger_view.html"; // Redirect to dashboard
    });
});

// Finalize payment or reservation
async function finalizePayment(details, paid, deadline = null) {
  try {
    const response = await fetch("http://localhost:3000/passenger/reserve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trainNumber: details.trainNumber,
        passengerId: details.passengerId,
        seats: details.seats,
        paid,
        deadline,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.message || "An error occurred during payment.");
      return;
    }
  } catch (err) {
    console.error("Error finalizing payment:", err);
    alert("Failed to process payment. Please try again.");
  }
}

// Automatic cancellation of unpaid reservations
setInterval(async () => {
  try {
    const response = await fetch(
      "http://localhost:3000/passenger/check-expired",
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      console.error(
        "Error during automatic cancellation:",
        await response.text()
      );
    }
  } catch (err) {
    console.error("Error checking expired reservations:", err);
  }
}, 60 * 1000); // Check every minute
