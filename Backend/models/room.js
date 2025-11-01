const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomNumber: String,
    type: String,
    price: Number,
    status: String,
    features: [String],
    images: [String], // Array of image URLs or filenames
});

module.exports = mongoose.model('Room', roomSchema);
