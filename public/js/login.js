document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent the default form submission behavior

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === "" || password === "") {
        alert("Please fill in both fields.");
    } else {
        // Mock login validation
        if (username === "admin" && password === "1234") {
            alert("Login successful!");
            // Redirect or perform post-login actions here
            window.location.href = "dashboard.html";
        } else {
            alert("Invalid username or password.");
        }
    }
});
