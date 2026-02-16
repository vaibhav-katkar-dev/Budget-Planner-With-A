document.getElementById("loginForm").addEventListener("submit", async function (event) {
    event.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    try {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        alert(data);
        console.log(data);

        if (response.ok) {
            window.location.href = data.redirectURL;
        } else {
            document.getElementById("errorMsg").textContent = data.error || "Login failed";
        }
    } catch (error) {
        console.error("Login error:", error);
        document.getElementById("errorMsg").textContent = "An error occurred. Please try again.";
    }
});
