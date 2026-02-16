const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Serve Login Page (for EJS frontend)
router.get("/login", (req, res) => {
    res.render("login", { msg: "", error: "" });
});

// Serve Register Page (for EJS frontend)
router.get("/register", (req, res) => {
    res.render("register", { msg: "", error: "" });
});

// Register User API
router.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // console.log("Registering user:", { name, email, password });

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Ensure email is properly trimmed
        const cleanEmail = email.trim().toLowerCase();

        let user = await User.findOne({ email: cleanEmail });
        if (user) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // console.log("hashedPassword :", hashedPassword ,cleanEmail,name);

        user = new User({ username:name, email: cleanEmail, password: hashedPassword }); // Remove 'await' here
        await user.save();
        
        res.status(201).json({ msg: "Registration successful", redirectURL: "/login" });

    } catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({ error: "Server error" });
    }
});



// Login User API
router.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

        // Store user data in session
        req.session.user = { id: user._id, email: user.email };
        console.log("sesion",req.session.user);

        // Ensure session is saved before redirecting
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ error: "Session error" });
            }
            res.json({ success: true, redirectURL: `/dashboard` });
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error" });
    }
});


// Check Authentication
router.get("/api/auth/check", (req, res) => {
    if (req.cookies.token) {
        return res.json({ authenticated: true });
    }
    return res.json({ authenticated: false });
});

module.exports = router;