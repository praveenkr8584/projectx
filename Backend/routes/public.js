const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Booking = require('../models/booking');
const Service = require('../models/service');
const Room = require('../models/room');
const { sendEmail, sendAdminAlert } = require('../utils/email');

const router = express.Router();

// Create Booking (public - for non-authenticated users)
router.post('/booking', async (req, res) => {
    try {
        const { customerName, customerEmail, roomNumber, checkInDate, checkOutDate, totalAmount, notes } = req.body;

        // Validate required fields
        if (!customerName || !customerEmail || !roomNumber || !checkInDate || !checkOutDate || !totalAmount) {
            return res.status(400).json({ error: 'All required fields must be provided' });
        }

        // Validate dates
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        if (checkIn >= checkOut) {
            return res.status(400).json({ error: 'Check-out date must be after check-in date' });
        }
        if (checkIn < new Date()) {
            return res.status(400).json({ error: 'Check-in date cannot be in the past' });
        }

        // Find and validate room
        const room = await Room.findOne({ roomNumber: roomNumber.toString().trim() });
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }
        if (room.status.toLowerCase() !== 'available') {
            return res.status(400).json({ error: 'Room is not available' });
        }

        // Calculate expected total amount
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const expectedTotal = nights * room.price;
        if (Math.abs(totalAmount - expectedTotal) > 0.01) {
            return res.status(400).json({ error: 'Total amount calculation mismatch' });
        }

        // Check for conflicting bookings
        const conflictingBooking = await Booking.findOne({
            roomNumber: roomNumber.toString().trim(),
            status: { $in: ['confirmed', 'checked-in'] },
            $or: [
                { checkInDate: { $lt: checkOut, $gte: checkIn } },
                { checkOutDate: { $gt: checkIn, $lte: checkOut } },
                { checkInDate: { $lte: checkIn }, checkOutDate: { $gte: checkOut } }
            ]
        });

        if (conflictingBooking) {
            return res.status(400).json({ error: 'Room is not available for the selected dates' });
        }

        // Create booking
        const newBooking = new Booking({
            customerName: customerName.trim(),
            customerEmail: customerEmail.toLowerCase().trim(),
            roomNumber: roomNumber.toString().trim(),
            checkInDate: checkIn,
            checkOutDate: checkOut,
            totalAmount,
            notes: notes?.trim(),
            status: 'confirmed' // Auto-confirm for public bookings
        });

        await newBooking.save();

        // Update room status
        await Room.findOneAndUpdate(
            { roomNumber: roomNumber.toString().trim() },
            { status: 'occupied' }
        );

        // Send confirmation email
        const subject = `Booking Confirmation - ${newBooking.bookingReference}`;
        const text = `Dear ${newBooking.customerName},\n\nYour booking has been confirmed.\n\nBooking Reference: ${newBooking.bookingReference}\nRoom: ${newBooking.roomNumber}\nCheck-in: ${newBooking.checkInDate.toLocaleDateString()}\nCheck-out: ${newBooking.checkOutDate.toLocaleDateString()}\nTotal Amount: $${newBooking.totalAmount}\n\nThank you for choosing our hotel!`;
        const html = `<p>Dear ${newBooking.customerName},</p><p>Your booking has been confirmed.</p><p><strong>Booking Details:</strong></p><ul><li><strong>Reference:</strong> ${newBooking.bookingReference}</li><li><strong>Room:</strong> ${newBooking.roomNumber}</li><li><strong>Check-in:</strong> ${newBooking.checkInDate.toLocaleDateString()}</li><li><strong>Check-out:</strong> ${newBooking.checkOutDate.toLocaleDateString()}</li><li><strong>Total Amount:</strong> $${newBooking.totalAmount}</li></ul><p>Thank you for choosing our hotel!</p>`;
        await sendEmail(newBooking.customerEmail, subject, text, html);

        // Send admin alert
        const adminSubject = `New Booking Alert - ${newBooking.bookingReference}`;
        const adminText = `A new booking has been made.\n\nReference: ${newBooking.bookingReference}\nCustomer: ${newBooking.customerName}\nEmail: ${newBooking.customerEmail}\nRoom: ${newBooking.roomNumber}\nCheck-in: ${newBooking.checkInDate.toLocaleDateString()}\nCheck-out: ${newBooking.checkOutDate.toLocaleDateString()}\nTotal Amount: $${newBooking.totalAmount}`;
        const adminHtml = `<p><strong>New Booking Alert</strong></p><p><strong>Reference:</strong> ${newBooking.bookingReference}</p><p><strong>Customer:</strong> ${newBooking.customerName}</p><p><strong>Email:</strong> ${newBooking.customerEmail}</p><p><strong>Room:</strong> ${newBooking.roomNumber}</p><p><strong>Check-in:</strong> ${newBooking.checkInDate.toLocaleDateString()}</p><p><strong>Check-out:</strong> ${newBooking.checkOutDate.toLocaleDateString()}</p><p><strong>Total Amount:</strong> $${newBooking.totalAmount}</p>`;
        await sendAdminAlert(adminSubject, adminText, adminHtml);

        res.json({
            message: "Booking created successfully",
            booking: {
                bookingReference: newBooking.bookingReference,
                customerName: newBooking.customerName,
                customerEmail: newBooking.customerEmail,
                roomNumber: newBooking.roomNumber,
                checkInDate: newBooking.checkInDate,
                checkOutDate: newBooking.checkOutDate,
                status: newBooking.status,
                totalAmount: newBooking.totalAmount
            }
        });
    } catch (error) {
        console.error('Booking creation error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Booking reference already exists. Please try again.' });
        }
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
        let query = { status: 'available' }; // Only show available rooms

        if (type) query.type = type;
        if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
        if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };

        // For date filters, check availability (not booked during the period)
        if (checkInDate && checkOutDate) {
            // Find rooms that are not booked during the specified dates
            const conflictingBookings = await Booking.find({
                checkInDate: { $lt: new Date(checkOutDate) },
                checkOutDate: { $gt: new Date(checkInDate) }
            }).select('roomNumber');

            const bookedRoomNumbers = conflictingBookings.map(b => b.roomNumber);
            query.roomNumber = { $nin: bookedRoomNumbers };
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
