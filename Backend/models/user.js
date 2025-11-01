const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    fullname: String,
    email: String,
    password: String,
    phone: Number,
    aadharno: Number,
    image: String, // Profile image URL or filename
    role: { type: String, default: "customer" } // roles: customer, admin
});

module.exports = mongoose.model('User', userSchema);
