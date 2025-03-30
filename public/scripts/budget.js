document.addEventListener("DOMContentLoaded", () => {
    const budgetForm = document.getElementById("budgetForm");
    const budgetMessage = document.getElementById("budgetMessage");

    budgetForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const category = document.getElementById("category").value;
        const budgetAmount = document.getElementById("budgetAmount").value;

        if (!category || budgetAmount === "" || isNaN(budgetAmount) || budgetAmount < 0) {
            alert("Please enter a valid budget amount.");
            return;
        }

        try {
            const response = await fetch("/api/set-budget", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ category, amount: parseFloat(budgetAmount) })
            });

            const data = await response.json();

            if (response.ok) {
                budgetMessage.style.display = "block";
                budgetMessage.textContent = data.message;
                budgetMessage.style.color = "green";

                setTimeout(() => {
                    budgetMessage.style.display = "none";
                }, 2000);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error("Error updating budget:", error);
            alert("An error occurred while updating the budget.");
        }
    });
});
