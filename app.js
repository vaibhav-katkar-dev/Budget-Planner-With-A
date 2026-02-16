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
// const budgetSchema = require("./models/Budget");
// const transactionSchema = require("./models/Transaction");
const multer = require('multer');



require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("public"));

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
    type: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    userId: { type: String, required: true }, // Ensure userId is included
});



// Ensure there's no 'email' field in the schema!
// const Transaction = mongoose.model("Transaction", transactionSchema);


const budgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    category: { type: String, required: true },
    amount: { type: Number, required: true }
});


const storeChatSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    botResponse: { type: String, required: true },
    userMessage: { type: String, required: true } // Changed from Number to String
});


const StoreChat = mongoose.model("StoreChat", storeChatSchema); // Renamed to avoid confusion




// Ensure each user can have unique categories but avoid global uniqueness
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });






const Transaction = mongoose.model("Transaction", transactionSchema);
const Budget = mongoose.model("Budget", budgetSchema);


// const profileRoutes = require("./routes/profile");
// app.use("/profile", profileRoutes);



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


// app.get("/api/session", (req, res) => {
//     if (req.session && req.session.user) {
//         res.json({ userSession: req.session.user.id });
//     } else {
//         res.json({ userSession: "guest" });
//     }
// }); 


const isAuthenticated = (req, res, next) => {
    // console.log(req.session,req.session.user);
    if (req.session && req.session.user) {
    
        return next();
    }
    res.redirect("/login"); // Redirect to login if not authenticated

    app.get("/api/session", (req, res) => {
        if (req.session && req.session.user) {
            res.json({ userSession: req.session.user.id });
        } else {
            res.json({ userSession: "guest" });
        }
    }); 
};



const API_KEY = "AIzaSyAyEmH1mZmanVJQNI8oes_Vj3DbxG9hDpE"; // Replace with your actual API key
async function getAIResponse(userMessage, userSession) {
    if (!API_KEY) {
        console.error("❌ Missing Gemini API Key");
        return "Server Error: Missing API Key.";
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    console.log("User Session:", userSession);

    try {
        if (!userSession || !mongoose.Types.ObjectId.isValid(userSession)) {
            return "Session Error: Invalid user ID.";
        }

        let transactions = [], budget = [], all_chats = [], previousChats = [],User = [];
        try {
            transactions = await Transaction.find({ userId: userSession });
            budget = await Budget.find({ userId: userSession });
            // name = await .find({ userId: userSession });
            previousChats = await StoreChat.find({ userId: userSession });
        } catch (dbError) {
            console.error("❌ Database Error:", dbError.message);
            return "Server Error: Unable to fetch financial data.";
        }

        let income = 0, expenses = 0;
        transactions.forEach(txn => {
            if (txn.type === "income") income += txn.amount;
            else expenses += txn.amount;
        });

        const savings = income - expenses;
        const budgetSummary = budget.map(b => `${b.category}: ₹${b.amount}`).join(", ");

        const transactionRegex = /(income|expense|spent|earned|received|get|added|deducted)\s*(\d+)\s*(?:on|for|in)?\s*([a-zA-Z ]+)/i;
        const budgetRegex = /(set|allocate|assign|put aside|save)\s*(\d+)\s*(?:for|towards)?\s*([a-zA-Z ]+)/i;

        const transactionMatch = userMessage.match(transactionRegex);
        if (transactionMatch) {
            const [, type, amount, category] = transactionMatch;
            const txnType = ["earned", "received", "get", "added"].includes(type.toLowerCase()) ? "income" : "expense";
            const cleanedCategory = category.trim().toLowerCase();

            const newTransaction = new Transaction({
                userId: userSession,
                type: txnType,
                amount: Number(amount),
                category: cleanedCategory,
                date: new Date().toISOString()
            });

            await newTransaction.save();

            // 🆕 Auto-create budget entry if category not present
            const existingBudget = await Budget.findOne({ userId: userSession, category: cleanedCategory });
            if (!existingBudget) {
                const defaultBudget = new Budget({
                    userId: userSession,
                    category: cleanedCategory,
                    amount: 0 // You can change to a default like 1000 if needed
                });
                await defaultBudget.save();
            }

            return `✅ Transaction recorded: ₹${amount} as ${txnType} for ${cleanedCategory}`;
        }

        const budgetMatch = userMessage.match(budgetRegex);
        if (budgetMatch) {
            const [, , amount, category] = budgetMatch;
            try {
                const res = await fetch("http://localhost:5000/api/set-budget", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: userSession,
                        category: category.trim().toLowerCase(),
                        amount: Number(amount)
                    })
                });
        
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || "Failed to set budget");
                return `✅ Budget updated: ₹${amount} for ${category.trim()}`;
            } catch (err) {
                console.error("❌ Failed to call /api/set-budget:", err.message);
                return `Error: Could not update budget. Please try again later.`;
            }
        }
        

        const chatHistory = previousChats.length > 0 
            ? `📜 **Relevant Past Conversations** (Use only if helpful for context):\n${previousChats.map(chat => `- ${chat.message}`).join("\n")}`
            : "";

        const aiPrompt = `
💼 **Smart Budget Assistant**

📈 **User Financial Snapshot**:
- User Name ${name}
- Income: ₹${income}
- Expenses: ₹${expenses}
- Savings: ₹${savings}
- Summary: ${budgetSummary}

${chatHistory}

💬 **User Query**: "${userMessage}"

📌 **Instructions**:
- Prioritize real-time financial data; use past chats only if it adds value.
- Give concise, practical, and actionable advice like a financial expert.
- Avoid repeating or exposing unnecessary data.
- Automatically suggest budget updates or insights **only if relevant**.

🎯 Keep responses smart, direct, and finance-focused.

🧠 **AI Response**:
`;

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: aiPrompt }] }] })
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

// 🟢 Chat API Route
app.post("/api/chat", async (req, res) => {
    try {
        const { userMessage, userSession } = req.body;
        if (!userMessage) return res.status(400).json({ error: "Message is required" });

        const botResponse = await getAIResponse(userMessage, userSession);
        console.log("Data:", botResponse, userMessage, userSession);

        try {
            const chatEntry = new StoreChat({
                userId: userSession,
                botResponse,
                userMessage
            });
            await chatEntry.save();
            // console.log("Chat saved successfully.");
        } catch (error) {
            console.error("Error saving chat:", error);
        }

        res.json({ response: botResponse });
    } catch (error) {
        console.error("❌ Server Error:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});



app.use("/", authRoutes); // Use the auth routes








// File Upload Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) =>
      cb(null, req.session.userId + '-' + Date.now() + '-' + file.originalname)
  });
  const upload = multer({ storage });
  
  // Dummy login route for testing
  app.get('/login', (req, res) => {
    // Auto-login just for demo
    req.session.userId = '12345';
    req.session.username = 'Vaibhav';
    req.session.email = 'vaibhav@example.com';
    res.redirect('/profile');
  });
  
  // 💼 PROFILE ROUTE - ALL IN ONE
  app.get('/profile', isAuthenticated, (req, res) => {
    // res.send(`
    //   <h1>Welcome, ${req.session.username}</h1>
    //   <p>Email: ${req.session.email}</p>
    //   <form action="/profile/update" method="POST" enctype="multipart/form-data">
    //     <input type="file" name="avatar" />
    //     <button type="submit">Upload Avatar</button>
    //   </form>
    // `);

    res.render("profile",)
  });
  
  app.post('/profile/update', isAuthenticated, upload.single('avatar'), (req, res) => {
    res.send('Profile updated. File uploaded: ' + req.file.filename);
  });

  




// ✅ Logout User
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});



app.get("/",(req,res)=>{
    res.redirect("/dashboard")
})

// ✅ Serve the index page
app.get("/dashboard", isAuthenticated, async (req, res) => {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    try {
        const userId = req.session.user.id; // ✅ Extract userId properly
        // console.log("Dashboard accessed by user:", userId);

        // ✅ Fetch user-specific transactions & budgets
        const transactions = await Transaction.find({ userId });
        const budgets = await Budget.find({ userId });

        // console.log("Transactions:", transactions);
        // console.log("Budgets:", budgets);

        // ✅ Calculate summary stats
        const income = transactions
            .filter(txn => txn.type === "income")
            .reduce((sum, txn) => sum + txn.amount, 0);

        const expenses = transactions
            .filter(txn => txn.type === "expense")
            .reduce((sum, txn) => sum + txn.amount, 0);

        const savings = income - expenses;

        // ✅ Ensure expense transactions exist
        const expenseTransactions = transactions.filter(txn => txn.type === "expense");

        const categories = [...new Set(expenseTransactions.map(txn => txn.category))]; // Unique categories
        const expenseData = categories.map(category => {
            return expenseTransactions
                .filter(txn => txn.category === category)
                .reduce((sum, txn) => sum + txn.amount, 0);
        });

        // ✅ Real monthly expenses (not random)
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthlyExpenses = new Array(12).fill(0);

        transactions.forEach(txn => {
            if (txn.type === "expense" && txn.date) {
                const monthIndex = new Date(txn.date).getMonth();
                monthlyExpenses[monthIndex] += txn.amount;
            }
        });

        // console.log("Budget Summary:", { income, expenses, savings, categories, expenseData, months, monthlyExpenses, userId });

        // ✅ Render EJS template properly
        res.render("index", {
            income,
            expenses,
            savings,
            categories,
            expenseData,
            months,
            monthlyExpenses,
            userId, // ✅ Pass userId to frontend if needed
        });

    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).send("Server error.");
    }
});



// ✅ API Route to Fetch Transactions and Budget Data
app.get("/api/data", async (req, res) => {
    try {
        if (!req.session || !req.session.user || !req.session.user.id) {
            return res.status(401).json({ message: "Unauthorized: User not logged in" });
        }

        const transactions = await Transaction.find({ userId: req.session.user.id });
        const budgets = await Budget.find({ userId: req.session.user.id });

        res.json({ transactions, budgets }); // ✅ Fixed typo
    } catch (error) {
        console.error("Error fetching transactions and budget:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
});

// ✅ API Route to Fetch Budget Chart Data (Aggregated)
app.get("/api/budget-chart", async (req, res) => {
    try {

        const userId = req.session?.user?.id;
        // console.log(userId);
        if (!userId) return res.status(401).json({ message: "Unauthorized: User not logged in" });

        // ✅ Aggregate user transactions by category
        const aggregatedTransactions = await Transaction.aggregate([
            { $match: { userId } }, // 🔹 Filter early for performance
            { $group: { _id: "$category", totalAmount: { $sum: "$amount" } } },
            { $project: { category: "$_id", amount: "$totalAmount", _id: 0 } },
            { $match: { category: { $ne: "saving" } } } // 🔹 Optional filter
        ]);

        // ✅ Fetch user-specific budgets
        const budgets = await Budget.find({ userId });

        res.json({ transactions: aggregatedTransactions, budgets });
    } catch (error) {
        console.error("❌ Error fetching budget chart data:", error);
        res.status(500).json({ message: "Server error, please try again later" });
    }
});

app.get("/reports", isAuthenticated, (req, res) => {
    let { id } = req.params;
    // console.log("Transaction Page Accessed by User ID:", id);
    res.render("report", { user: req.session.user, id });
});



  // ✅ Transactions Page
app.get("/transaction", isAuthenticated, (req, res) => {
    let { id } = req.params;
    // console.log("Transaction Page Accessed by User ID:", id);
    res.render("transaction", { user: req.session.user, id });
});

// ✅ POST Route to Add Transactions
app.post("/api/add-transaction", isAuthenticated, async (req, res) => {
    try {
        const { type, category, amount, date } = req.body;
        const userId = req.session.user ? req.session.user.id : null;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized: User ID missing." });
        }

        if (!type || !category || !amount || !date) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const transaction = new Transaction({
            type,
            category,
            amount: parseFloat(amount),
            date,
            userId, // ✅ Assign userId correctly
        });

        await transaction.save();

        // console.log("Transaction Added:", transaction);
        res.json({ message: "Transaction added successfully!", transaction });

    } catch (error) {
        console.error("Error adding transaction:", error);
        res.status(500).json({ message: "Error adding transaction" });
    }
});



// ✅ POST Route to Update Budget
app.post("/api/set-budget", async (req, res) => {
    try {
        const { category, amount, userId } = req.body;
        console.log( category, amount, userId );
        if (!category || amount === undefined || isNaN(amount) || amount < 0 || !userId) {
            return res.status(400).json({ message: "Invalid category, budget amount, or user ID." });
        }
       

        const formattedCategory = category.toLowerCase().trim();
        const parsedAmount = parseFloat(amount);

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID format." });
        }

        // ✅ Update or insert budget per user
        const result = await Budget.updateOne(
            { userId, category: formattedCategory }, 
            { $set: { amount: parsedAmount } }, 
            { upsert: true } 
        );
        

        return res.json({
            message: result.upsertedCount ? "Budget created successfully!" : "Budget updated successfully!",
            budget: { userId, category: formattedCategory, amount: parsedAmount }
        });

    } catch (error) {
        console.error("❌ Error updating budget:", error);
        return res.status(500).json({ message: "Error updating budget", error: error.message });
    }
});



app.get("/budjet", isAuthenticated, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.session.user.id });

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
        const budgets = await Budget.find({ userId: req.session.user.id });

        const budget = {};
        budgets.forEach(b => {
            budget[b.category] = b.amount;
        });

        // ✅ Pass user ID to the frontend
        res.render("budget", {  
            totalIncome,
            totalExpenses,
            remainingBudget,
            transactions,
            budget,
            userId: req.session.user.id // ✅ Send user ID
        });

    } catch (error) {
        console.error("Error fetching budget data:", error);
        res.status(500).json({ message: "Error fetching data", error: error.message });
    }
});





app.get("/profile",(req,res)=>{
    res.render("profile");
});


// ✅ Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
