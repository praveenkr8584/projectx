const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Booking = require('../models/booking');
const Service = require('../models/service');
const Room = require('../models/room');
const { sendEmail, sendAdminAlert } = require('../utils/email');

const router = express.Router();

// Create Booking (public)
router.post('/booking', authenticateToken, async (req, res) => {
    try {
        const { roomNumber } = req.body;

        const room = await Room.findOne({ roomNumber, status: 'available' });
        if (!room) return res.status(400).json({ error: 'Room not available' });

        let newBooking = new Booking({ ...req.body, status: 'booked' });
        await newBooking.save();

        await Room.findOneAndUpdate({ roomNumber }, { status: 'occupied' });

        const subject = 'Booking Confirmation';
        const text = `Dear ${newBooking.customerName},\n\nYour booking has been confirmed.\n\nDetails:\nRoom: ${newBooking.roomNumber}\nCheck-in: ${newBooking.checkInDate}\nCheck-out: ${newBooking.checkOutDate}\nTotal Amount: $${newBooking.totalAmount}\n\nThank you for choosing our hotel!`;
        const html = `<p>Dear ${newBooking.customerName},</p><p>Your booking has been confirmed.</p><p><strong>Details:</strong></p><ul><li>Room: ${newBooking.roomNumber}</li><li>Check-in: ${newBooking.checkInDate}</li><li>Check-out: ${newBooking.checkOutDate}</li><li>Total Amount: $${newBooking.totalAmount}</li></ul><p>Thank you for choosing our hotel!</p>`;
        await sendEmail(newBooking.customerEmail, subject, text, html);

        const adminSubject = 'New Booking Alert';
        const adminText = `A new booking has been made.\n\nCustomer: ${newBooking.customerName}\nEmail: ${newBooking.customerEmail}\nRoom: ${newBooking.roomNumber}\nCheck-in: ${newBooking.checkInDate}\nCheck-out: ${newBooking.checkOutDate}\nTotal Amount: $${newBooking.totalAmount}`;
        const adminHtml = `<p><strong>New Booking Alert</strong></p><p>Customer: ${newBooking.customerName}</p><p>Email: ${newBooking.customerEmail}</p><p>Room: ${newBooking.roomNumber}</p><p>Check-in: ${newBooking.checkInDate}</p><p>Check-out: ${newBooking.checkOutDate}</p><p>Total Amount: $${newBooking.totalAmount}</p>`;
        await sendAdminAlert(adminSubject, adminText, adminHtml);

        res.json({ message: "Booking created", booking: newBooking });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get Services (public)
router.get('/services', async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Create Service (public)
router.post('/services', authenticateToken, async (req, res) => {
    try {
        let newService = new Service(req.body);
        await newService.save();
        res.json({ message: "Service created", service: newService });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get Rooms (public) with filters
router.get('/rooms', async (req, res) => {
    try {
        const { type, minPrice, maxPrice, checkInDate, checkOutDate } = req.query;
        let query = {};

        if (type) query.type = type;
        if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
        if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };

        // For date filters, check availability (not booked or maintenance during the period)
        if (checkInDate && checkOutDate) {
            // Find rooms that are not booked during the specified dates
            const conflictingBookings = await Booking.find({
                checkInDate: { $lt: new Date(checkOutDate) },
                checkOutDate: { $gt: new Date(checkInDate) }
            }).select('roomNumber');

            const bookedRoomNumbers = conflictingBookings.map(b => b.roomNumber);
            query.roomNumber = { $nin: bookedRoomNumbers };
            query.status = { $ne: 'maintenance' }; // Exclude maintenance rooms
        }

        const rooms = await Room.find(query);
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Available Rooms
router.get('/rooms/available', async (req, res) => {
    try {
        const availableRooms = await Room.find({ status: 'available' });
        res.json(availableRooms);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
