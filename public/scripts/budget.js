document.addEventListener("DOMContentLoaded", async function () {

let budgetForm=document.querySelector("#budgetForm");
let btnb=document.querySelector("#btnb");


    try {
        // ✅ Fetch budget and transaction data
        const response = await fetch("/api/budget-chart");
        if (!response.ok) throw new Error("Failed to fetch budget chart data");

        const { transactions, budgets } = await response.json();

        // ✅ Convert budget array to a lookup object { category: amount }
        const budgetMap = budgets.reduce((acc, item) => {
            acc[item.category.toLowerCase()] = item.amount;
            return acc;
        }, {});

        // ✅ Extract unique categories from transactions (case insensitive)
        const categories = [...new Set(transactions.map(txn => txn.category.toLowerCase()))];

        // ✅ Map Expenses & Budget Data Correctly
        const expensesData = categories.map(cat =>
            transactions
                .filter(txn => txn.category.toLowerCase() === cat)
                .reduce((sum, txn) => sum + txn.amount, 0)
        );

        const budgetData = categories.map(cat => budgetMap[cat] || 0);

        console.log("Categories:", categories);
        console.log("Expenses Data:", expensesData);
        console.log("Budget Data:", budgetData);

        // ✅ Bar Chart (Budget vs Expenses)
        if (document.getElementById('budgetChart')) {
            new Chart(document.getElementById('budgetChart').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: categories,
                    datasets: [
                        { label: 'Expenses', data: expensesData, backgroundColor: '#e74c3c' },
                        { label: 'Budget', data: budgetData, backgroundColor: '#2ecc71' }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { autoSkip: false }, barPercentage: 0.6, categoryPercentage: 0.8 },
                        y: { beginAtZero: true }
                    }
                }
            });
        }

    } catch (error) {
        console.error("❌ Error fetching budget chart data:", error);
        if (document.getElementById("chartContainer")) {
            document.getElementById("chartContainer").innerHTML = `<p style="color:red;">Error loading data. Please try again later.</p>`;
        }
    }




    btnb.addEventListener("click", async (event) => {
        event.preventDefault(); // <-- important to prevent form reload
    
        const category = document.querySelector("#category").value.trim();
        const amount = document.querySelector("#budgetAmount").value;
        const userId = document.querySelector("#userId").value.trim();
    
        try {
            const response = await fetch("/api/set-budget", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category, amount, userId })
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert("Budget added successfully!");
                budgetForm.reset();
            } else {
                alert("Error: " + result.message);
            }
        } catch (error) {
            console.error("Error sending data:", error);
            alert("Something went wrong. Please try again.");
        }
    });
    
});
