// public/js/script.js

// Fetch past expenses for AI-based prediction
async function fetchExpenseHistory() {
    const response = await fetch("/api/expense-history"); // Backend should return past expenses
    const expenseHistory = await response.json();
    return expenseHistory;
}

// Predict next month’s expenses using linear regression
function predictNextMonthExpense(expenses) {
    let n = expenses.length;
    if (n < 2) return expenses[n - 1] || 0; 

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        sumX += i + 1;
        sumY += expenses[i];
        sumXY += (i + 1) * expenses[i];
        sumXX += (i + 1) ** 2;
    }

    let slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX ** 2);
    let intercept = (sumY - slope * sumX) / n;
    return Math.max(slope * (n + 1) + intercept, 0);
}

// Display AI-based predictions
async function displayPrediction() {
    const expenseHistory = await fetchExpenseHistory();
    const predictedExpense = predictNextMonthExpense(expenseHistory);
    
    document.getElementById("predictedExpense").textContent = `₹${predictedExpense.toFixed(2)}`;
    
    const totalIncome = parseFloat(document.getElementById("totalIncome").textContent.replace("₹", ""));
    if (predictedExpense > totalIncome) {
        alert("⚠️ Warning: Your predicted expenses exceed your income. Consider adjusting your budget.");
    }
}

document.addEventListener("DOMContentLoaded", displayPrediction);
