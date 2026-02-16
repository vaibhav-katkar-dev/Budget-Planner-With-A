document.addEventListener("DOMContentLoaded", async function () {
    try {
        // ✅ Fetch data from backend
        const response = await fetch("/api/data");
        if (!response.ok) throw new Error("Failed to fetch data");

        const { transactions, budgets = [] } = await response.json(); // Ensure `budgets` is an array

        // ✅ Ensure `type` exists in transactions (Backend Fix Needed)
        const categorizedTransactions = transactions.filter(txn => txn.type); 

        // ✅ Calculate Income, Expenses & Savings
        const totalIncome = categorizedTransactions
            .filter(txn => txn.type.toLowerCase() === "income")
            .reduce((sum, txn) => sum + txn.amount, 0);

        const totalExpenses = categorizedTransactions
            .filter(txn => txn.type.toLowerCase() === "expense")
            .reduce((sum, txn) => sum + txn.amount, 0);

        const savings = totalIncome - totalExpenses;
        const savingsPercentage = totalIncome ? ((savings / totalIncome) * 100).toFixed(2) : 0;
        const expensesPercentage = totalIncome ? ((totalExpenses / totalIncome) * 100).toFixed(2) : 0;

        // ✅ Format Currency Function
        function formatCurrency(value) {
            return `₹${value.toLocaleString()}`;
        }

        // ✅ Update UI Elements Safely
        const updateElement = (id, value) => {
            if (document.getElementById(id)) {
                document.getElementById(id).textContent = formatCurrency(value);
            }
        };

        updateElement("totalIncome", totalIncome);
        updateElement("totalExpenses", totalExpenses);
        updateElement("balance", savings);

        // ✅ Convert budget array to a lookup object { category: amount }
        // const budgetMap = budgets.reduce((acc, item) => {
        //     acc[item.category.toLowerCase()] = item.amount;
        //     return acc;
        // }, {});

        // // ✅ Extract unique categories from transactions (case insensitive)
        // const categories = [...new Set(categorizedTransactions.map(txn => txn.category.toLowerCase()))];

        // // ✅ Map Expenses & Budget Data Correctly
        // const expensesData = categories.map(cat =>
        //     categorizedTransactions
        //         .filter(txn => txn.type.toLowerCase() === "expense" && txn.category.toLowerCase() === cat)
        //         .reduce((sum, txn) => sum + txn.amount, 0)
        // );

        // const budgetData = categories.map(cat => budgetMap[cat] || 0);

        // console.log("Categories:", categories);
        // console.log("Expenses Data:", expensesData);
        // console.log("Budget Data:", budgetData);


        // ✅ Convert budget array to a lookup object { category: amount }
const budgetMap = budgets.reduce((acc, item) => {
    acc[item.category.toLowerCase()] = item.amount;
    return acc;
}, {});

// ✅ Extract unique categories from transactions (case insensitive), excluding "salary"
const categories = [...new Set(
    categorizedTransactions
        .map(txn => txn.category.toLowerCase())
        .filter(cat => cat !== "salary")
)];

// ✅ Map Expenses & Budget Data Correctly
const expensesData = categories.map(cat =>
    categorizedTransactions
        .filter(txn => txn.type.toLowerCase() === "expense" && txn.category.toLowerCase() === cat)
        .reduce((sum, txn) => sum + txn.amount, 0)
);

const budgetData = categories.map(cat => budgetMap[cat] || 0);

console.log("Categories:", categories);
console.log("Expenses Data:", expensesData);
console.log("Budget Data:", budgetData);


        // ✅ Bar Chart (Budget vs Expenses)
        if (document.getElementById('expensesChart')) {
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
                        x: { ticks: { autoSkip: false }, barPercentage: 0.6, categoryPercentage: 0.8 },
                        y: { beginAtZero: true }
                    }
                }
            });
        }

        // ✅ Savings vs Expenses (Horizontal Bar Chart)
        if (document.getElementById('savingsChart')) {
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
        }

        // ✅ Donut Chart (Income vs Expenses vs Savings)
        if (document.getElementById('donutChart')) {
            new Chart(document.getElementById('donutChart').getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ["Total Income", "Expenses", "Remaining Balance"],
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
        }

    } catch (error) {
        console.error("Error fetching transactions:", error);
        if (document.getElementById("chartContainer")) {
            document.getElementById("chartContainer").innerHTML = `<p style="color:red;">Error loading data. Please try again later.</p>`;
        }
    }
});
