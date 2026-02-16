const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    type: { type: String, required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    userId: { type: String, required: true }, // Ensure userId is included
});

module.exports = mongoose.model("Transaction", transactionSchema);
