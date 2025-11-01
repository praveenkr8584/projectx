const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    customerName: String,
    customerEmail: String,
    roomNumber: String,  // Just roomNumber, no reference
    checkInDate: Date,
    checkOutDate: Date,
    status: String,
    totalAmount: Number,
});

module.exports = mongoose.model('Booking', bookingSchema);
