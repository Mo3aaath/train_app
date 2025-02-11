async function loginUser(role) {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
  
    if (!username || !password) {
      alert("Please fill in all fields.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        alert(data.message);
  
        // Redirect based on role
        if (role === "admin") {
          window.location.href = "admin_view.html";
        } else {
          window.location.href = "passenger_view.html";
        }
      } else {
        alert(data.message); // Show error message
      }
    } catch (err) {
      console.error("Error during login:", err);
      alert("An error occurred. Please try again later.");
    }
  }
  
  // Attach event listeners to login buttons
  document.getElementById("passengerLogin").addEventListener("click", () => {
    loginUser("passenger");
  });
  
  document.getElementById("adminLogin").addEventListener("click", () => {
    loginUser("admin");
  });
  