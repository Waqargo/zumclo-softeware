const mongoose = require('mongoose');

const FundSchema = new mongoose.Schema({
    from: { type: String, required: true }, // Who gave the money
    to: { type: String, required: true },   // Who received it (or "Business" if it's capital)
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: String
});

module.exports = mongoose.model('Fund', FundSchema);