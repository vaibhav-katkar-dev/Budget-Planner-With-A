const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    category: { type: String, required: true },
    amount: { type: Number, required: true }
});
budgetSchema.index({ userId: 1, category: 1 }, { unique: true });


module.exports = mongoose.model("Budget", budgetSchema);
