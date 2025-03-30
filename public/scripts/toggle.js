

document.addEventListener("DOMContentLoaded", function () {
    const themeToggle = document.getElementById("theme-toggle");
    const body = document.body;
    const container = document.querySelector(".container"); 
    const innerDivs = document.querySelectorAll(".container div"); // Select all inner divs

    // Load theme preference from localStorage
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
        container.classList.add("dark-mode");
        innerDivs.forEach(div => div.classList.add("dark-mode"));
    }

    themeToggle.addEventListener("click", function () {
        body.classList.toggle("dark-mode");
        container.classList.toggle("dark-mode");
        innerDivs.forEach(div => div.classList.toggle("dark-mode"));

        // Save theme to localStorage
        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("theme", "dark");
        } else {
            localStorage.setItem("theme", "light");
        }
    });
});
