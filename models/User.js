const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: String,
    role: { type: String, default: 'Partner' },
    isApproved: { type: Boolean, default: false } // New users start as unapproved
});

module.exports = mongoose.model('User', UserSchema);