const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser"); 
const authRoutes = require("./routes/auth");
// const authRoutes = require("./routes/auth");
const User = require("./models/User");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
    session({
        secret: "your_secret_key", 
        resave: false, 
        saveUninitialized: true,
    })
);

// ✅ Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ Connected to MongoDB"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// ✅ View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Routes
app.use(authRoutes);


  
// ✅ Define Mongoose Schemas
const transactionSchema = new mongoose.Schema({
    type: String,
    category: String,
    amount: Number,
    date: String
});

const budgetSchema = new mongoose.Schema({
    category: { type: String, required: true, unique: true },
    amount: { type: Number, required: true }
});

const Transaction = mongoose.model("Transaction", transactionSchema);
const Budget = mongoose.model("Budget", budgetSchema);

const verifyUser = (req, res, next) => {
    console.log("🛠 Checking user authentication:", req.session.user);
    if (!req.session.user) return res.status(401).json({ authenticated: false });
    next();
};



app.use(
    session({
        secret: "your_secret_key", // Change this to a secure secret key
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGO_URI, // Change to your DB connection
            collectionName: "sessions",
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24, // 1 day session expiration
            httpOnly: true,
            secure: false, // Set to `true` if using HTTPS
        },
    })
);




const isAuthenticated = (req, res, next) => {
    // console.log(req.session,req.session.user);
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect("/login"); // Redirect to login if not authenticated
};



const API_KEY = "AIzaSyAyEmH1mZmanVJQNI8oes_Vj3DbxG9hDpE"; // Replace with your actual API key

// 🔥 Gemini AI API Integration 🔥// 🔥 Gemini AI API Integration 🔥
async function getAIResponse(userMessage, userId) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    try {
        // Fetch user's financial data
        const transactions = await Transaction.find({ userId });
        const budget = await Budget.find({ userId });
        const user = await User.findOne({ userId });
        console.log("user dat ai",{userId},user)


        console.log(userMessage, userId);

        let income = 0, expenses = 0;
        transactions.forEach(txn => {
            if (txn.type === "income") income += txn.amount;
            else expenses += txn.amount;
        });

        const savings = income - expenses;
        const budgetSummary = budget.map(b => `${b.category}: ₹${b.amount}`).join(", ");

        // Construct AI prompt with personalized financial context
        const aiPrompt = `₹${income} in | ₹${expenses} out | Saved: ₹${savings} | Budget: ${budgetSummary} \nQ: ${userMessage} \nA: Keep it short, clear, and casual like a friend chatting.`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: aiPrompt }] }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || "API request failed");
        }

        return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure, could you clarify? 🤔";
    } catch (error) {
        console.error("❌ Error fetching AI response:", error.message);
        return "Oops! Something went wrong. Please try again.";
    }
}




app.use("/", authRoutes); // Use the auth routes

// ✅ Logout User
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});




// 🟢 Chat API Route
app.post("/api/chat", async (req, res) => {
    try {
        const { userMessage, } = req.body;
        // console.log(userMessage);

        if (!userMessage) return res.status(400).json({ error: "Message is required" });

        const botResponse = await getAIResponse(userMessage);
        res.json({ response: botResponse });
        // console.log(botResponse );

    } catch (error) {
        console.error("❌ Server Error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


app.get("/",(req,res)=>{
    res.redirect("/")
})

// ✅ Serve the index page
app.get("/dashboard",  isAuthenticated, async (req, res) => {

   
    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {
        const transactions = await Transaction.find();
        const budget = await Budget.find();

        const income = transactions.filter(txn => txn.type === "income").reduce((sum, txn) => sum + txn.amount, 0);
        const expenses = transactions.filter(txn => txn.type === "expense").reduce((sum, txn) => sum + txn.amount, 0);
        const savings = income - expenses;

        const expenseTransactions = transactions.filter(txn => txn.type === "expense");
        const categories = expenseTransactions.map(txn => txn.category);
        const expenseData = expenseTransactions.map(txn => txn.amount);

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyExpenses = Array.from({ length: 12 }, () => Math.floor(Math.random() * 20000) + 1000);

        console.log( {user: req.session.user});
        res.render("index", { income, expenses, savings, categories, expenseData, months, monthlyExpenses , user: req.session.user});
 

    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).send("Server error.");
    }
});

// ✅ API Route to Fetch Transactions and Budget Data
app.get("/api/data", async (req, res) => {
    try {
        const transactions = await Transaction.find();
        const budget = await Budget.find();
        res.json({ transactions, budget });
    } catch (error) {
        res.status(500).json({ message: "Error fetching data" });
    }
});


    app.get("/api/budget-chart", async (req, res) => {
        try {
            // Aggregation to sum amounts for duplicate categories
            const aggregatedTransactions = await Transaction.aggregate([
                {
                    $group: {
                        _id: "$category",
                        totalAmount: { $sum: "$amount" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        category: "$_id",
                        amount: "$totalAmount"
                    }
                },
                {
                    $match: {
                        category: { $ne: "saving" } // Exclude "saving" category if needed
                    }
                }
            ]);
        
            // Fetch unmodified budget data
            const budget = await Budget.find();
        
            // Sending data after aggregation
            res.json({ transactions: aggregatedTransactions, budget });
        } catch (error) {
            res.status(500).json({ message: "Error fetching data", error });
        }
        
    });
    


// ✅ POST Route to Add Transactions
app.post("/api/add-transaction", async (req, res) => {
    const { type, category, amount, date } = req.body;
    if (!type || !category || !amount || !date) {
        return res.status(400).json({ message: "All fields are required." });
    }
    try {
        const transaction = new Transaction({ type, category, amount: parseFloat(amount), date });
        await transaction.save();
        res.json({ message: "Transaction added successfully!", transaction });
    } catch (error) {
        res.status(500).json({ message: "Error adding transaction" });
    }
});




// ✅ POST Route to Update Budget
app.post("/api/set-budget", async (req, res) => {
    const { category, amount } = req.body;
    // console.log( category, amount );
    if (!category || amount === undefined || isNaN(amount) || amount < 0) {
        return res.status(400).json({ message: "Invalid category or budget amount." });
    }
    try {
        const budgetItem = await Budget.findOneAndUpdate(
            { category },
            { amount: parseFloat(amount) },
            { new: true, upsert: true }
        );
        res.json({ message: "Budget updated successfully!", budgetItem });
    } catch (error) {
        res.status(500).json({ message: "Error updating budget" });
    }
});



// ✅ Transactions Page
app.get("/transaction",isAuthenticated, (req, res) => {
    res.render("transaction");
});

// ✅ Budget Page
app.get("/budjet",isAuthenticated, async (req, res) => {


    
    
    try {
        const transactions = await Transaction.find(); // Fetch transactions from MongoDB

        // Calculate total income & expenses
        let totalIncome = 0;
        let totalExpenses = 0;

        transactions.forEach(txn => {
            if (txn.type === "income") {
                totalIncome += txn.amount;
            } else if (txn.type === "expense") {
                totalExpenses += txn.amount;
            }
        });

        const remainingBudget = totalIncome - totalExpenses;

        // Fetch budgets from your database (modify based on your schema)
        const budgetData = await Budget.find(); // Assuming a Budget model exists

        // Convert array to an object (if needed)
        const budget = {};
        budgetData.forEach(b => {
            budget[b.category] = b.amount;
        });

        // Render the budget page with data
        res.render("budget", {
            totalIncome,
            totalExpenses,
            remainingBudget,
            transactions,
            budget // ✅ Ensure budget is passed here
        });

        // console.log(totalIncome,
        //     totalExpenses,
        //     remainingBudget,
        //     transactions,
        //     budget);

    } catch (error) {
        console.error("Error fetching budget data:", error);
        res.status(500).send("Internal Server Error");
    }
});


// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
