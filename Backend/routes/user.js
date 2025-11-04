const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, authorizeCustomer } = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/user');
const Booking = require('../models/booking');
const Room = require('../models/room');
const Service = require('../models/service');
const { sendEmail, sendAdminAlert } = require('../utils/email');

const router = express.Router();

// User Dashboard
router.get('/dashboard', authenticateToken, authorizeCustomer, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const activeBookings = await Booking.find({ customerEmail: user.email, status: { $in: ['confirmed', 'checked-in'] } });

        const upcomingBookings = await Booking.find({
            customerEmail: user.email,
            checkInDate: { $gte: new Date() },
            status: 'confirmed'
        }).sort({ checkInDate: 1 });

        const totalSpent = await Booking.aggregate([
            { $match: { customerEmail: user.email, status: 'completed' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const totalSpentAmount = totalSpent.length > 0 ? totalSpent[0].total : 0;

        res.json({
            user: {
                id: user._id,
                username: user.username,
                fullname: user.fullname,
                email: user.email
            },
            activeBookings: activeBookings.length,
            upcomingBookings: upcomingBookings.length,
            totalSpent: totalSpentAmount
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get User Profile
router.get('/profile', authenticateToken, authorizeCustomer, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({
            id: user._id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            aadharno: user.aadharno,
            image: user.image
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// User Profile Update
router.put('/profile', authenticateToken, authorizeCustomer, upload.single('image'), async (req, res) => {
    try {
        const userId = req.user.id;
        let updateFields = {};
        if (req.body.fullname) updateFields.fullname = req.body.fullname;
        if (req.body.email) updateFields.email = req.body.email;
        if (req.body.phone) updateFields.phone = Number(req.body.phone);
        if (req.body.aadharno) updateFields.aadharno = Number(req.body.aadharno);
        if (req.file) updateFields.image = req.file.filename;

        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                username: updatedUser.username,
                fullname: updatedUser.fullname,
                email: updatedUser.email,
                phone: updatedUser.phone,
                aadharno: updatedUser.aadharno,
                image: updatedUser.image
            }
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Change Password
router.put('/change-password', authenticateToken, authorizeCustomer, async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        let isMatch;
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            isMatch = await bcrypt.compare(currentPassword, user.password);
        } else {
            isMatch = currentPassword === user.password;
        }

        if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(userId, { password: hashedPassword });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// User's Bookings
router.get('/bookings', authenticateToken, authorizeCustomer, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const bookings = await Booking.find({ customerEmail: user.email }).sort({ checkInDate: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Make New Booking
router.post('/bookings', authenticateToken, authorizeCustomer, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { roomNumber, checkInDate, checkOutDate, totalAmount } = req.body;

        const room = await Room.findOne({ roomNumber, status: 'available' });
        if (!room) return res.status(400).json({ error: 'Room not available' });

        const newBooking = new Booking({
            customerName: user.fullname,
            customerEmail: user.email,
            roomNumber,
            checkInDate,
            checkOutDate,
            status: 'confirmed',
            totalAmount
        });

        await newBooking.save();

        await Room.findOneAndUpdate({ roomNumber }, { status: 'occupied' });

        const subject = 'Booking Confirmation';
        const text = `Dear ${user.fullname},\n\nYour booking has been confirmed.\n\nDetails:\nRoom: ${roomNumber}\nCheck-in: ${checkInDate}\nCheck-out: ${checkOutDate}\nTotal Amount: $${totalAmount}\n\nThank you for choosing our hotel!`;
        const html = `<p>Dear ${user.fullname},</p><p>Your booking has been confirmed.</p><p><strong>Details:</strong></p><ul><li>Room: ${roomNumber}</li><li>Check-in: ${roomNumber}</li><li>Check-out: ${roomNumber}</li><li>Total Amount: $${totalAmount}</li></ul><p>Thank you for choosing our hotel!</p>`;
        await sendEmail(user.email, subject, text, html);

        res.json({ message: 'Booking created successfully', booking: newBooking });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Cancel Booking
router.put('/bookings/:id/cancel', authenticateToken, authorizeCustomer, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const booking = await Booking.findOne({ _id: req.params.id, customerEmail: user.email });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (booking.status !== 'confirmed') return res.status(400).json({ error: 'Cannot cancel this booking' });

        booking.status = 'cancelled';
        await booking.save();

        await Room.findOneAndUpdate({ roomNumber: booking.roomNumber }, { status: 'available' });

        const subject = 'Booking Cancellation Confirmation';
        const text = `Dear ${user.fullname},\n\nYour booking has been cancelled.\n\nDetails:\nRoom: ${booking.roomNumber}\nCheck-in: ${booking.checkInDate}\nCheck-out: ${booking.checkOutDate}\nTotal Amount: $${booking.totalAmount}\n\nThank you for choosing our hotel!`;
        const html = `<p>Dear ${user.fullname},</p><p>Your booking has been cancelled.</p><p><strong>Details:</strong></p><ul><li>Room: ${booking.roomNumber}</li><li>Check-in: ${booking.checkInDate}</li><li>Check-out: ${booking.checkOutDate}</li><li>Total Amount: $${booking.totalAmount}</li></ul><p>Thank you for choosing our hotel!</p>`;
        await sendEmail(user.email, subject, text, html);

        res.json({ message: 'Booking cancelled successfully', booking });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get All Rooms for User
router.get('/rooms', authenticateToken, authorizeCustomer, async (req, res) => {
    try {
        const rooms = await Room.find({}).sort({ roomNumber: 1 });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
