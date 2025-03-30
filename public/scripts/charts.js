document.addEventListener("DOMContentLoaded", async function () {
    try {
        // ✅ Fetch data from backend
        const response = await fetch("/api/data");
        const { transactions, budget } = await response.json();

        // ✅ Calculate Income, Expenses & Savings
        const totalIncome = transactions
            .filter(txn => txn.type === "income")
            .reduce((sum, txn) => sum + txn.amount, 0);

        const totalExpenses = transactions
            .filter(txn => txn.type === "expense")
            .reduce((sum, txn) => sum + txn.amount, 0);

        const savings = totalIncome - totalExpenses;
        const savingsPercentage = totalIncome ? ((savings / totalIncome) * 100).toFixed(2) : 0;
        const expensesPercentage = totalIncome ? ((totalExpenses / totalIncome) * 100).toFixed(2) : 0;

        // ✅ Format Currency
        function formatCurrency(value) {
            return `₹${value.toLocaleString()}`;
        }

        // ✅ Update UI
        document.getElementById("totalIncome").textContent = formatCurrency(totalIncome);
        document.getElementById("totalExpenses").textContent = formatCurrency(totalExpenses);
        document.getElementById("balance").textContent = formatCurrency(savings);

        const chartOptions = { responsive: true, maintainAspectRatio: false };

        // ✅ Convert budget array to an object { category: amount }
        const budgetMap = budget.reduce((acc, item) => {
            acc[item.category.toLowerCase()] = item.amount;
            return acc;
        }, {});

        // ✅ Extract relevant categories from transactions
        const categories = [...new Set(transactions.map(txn => txn.category))];

        // ✅ Map Expenses & Budget Data Correctly
        const expensesData = categories.map(cat =>
            transactions
                .filter(txn => txn.type === "expense" && txn.category.toLowerCase() === cat.toLowerCase())
                .reduce((sum, txn) => sum + txn.amount, 0)
        );

        const budgetData = categories.map(cat => budgetMap[cat.toLowerCase()] || 0);

        console.log("Categories:", categories);
        console.log("Expenses Data:", expensesData);
        console.log("Budget Data:", budgetData);

        // ✅ Bar Chart (Budget vs Expenses)
        new Chart(document.getElementById('expensesChart').getContext('2d'), {
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
                    x: {
                        ticks: { autoSkip: false },
                        barPercentage: 0.6,  // Adjusts individual bar width (0.5 to 1.0)
                        categoryPercentage: 0.8  // Adjusts overall category width (0.5 to 1.0)
                    },
                    y: { beginAtZero: true }
                }
            }
        });
        

        // ✅ Savings vs Expenses (Horizontal Bar Chart)
        new Chart(document.getElementById('savingsChart').getContext('2d'), {
            type: 'bar',
            data: {
                labels: ["Balance", "Expenses"],
                datasets: [{
                    label: 'Percentage of Income',
                    data: [savingsPercentage, expensesPercentage],
                    backgroundColor: ['#27ae60', '#e74c3c'],
                    barThickness: 20,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 10, bottom: 10 } },
                scales: {
                    x: { beginAtZero: true, max: 100 },
                    y: { barPercentage: 0.6, categoryPercentage: 0.5 }
                },
                plugins: { legend: { display: false } }
            }
        });

        // ✅ Donut Chart (Income vs Expenses vs Savings)
        new Chart(document.getElementById('donutChart').getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ["Total Balance", "Expenses", "Remaining Balance"],
                datasets: [{
                    data: [totalIncome, totalExpenses, savings],
                    backgroundColor: ['#3498db', '#e74c3c', '#2ecc71'],
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        document.getElementById("chartContainer").innerHTML = `<p style="color:red;">Error loading data. Please try again later.</p>`;
    }
});
