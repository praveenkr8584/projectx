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

// Make New Booking (authenticated users)
router.post('/bookings', authenticateToken, authorizeCustomer, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const { roomNumber, checkInDate, checkOutDate, totalAmount, notes } = req.body;

        // Validate required fields
        if (!roomNumber || !checkInDate || !checkOutDate || !totalAmount) {
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
            customerName: user.fullname,
            customerEmail: user.email,
            roomNumber: roomNumber.toString().trim(),
            checkInDate: checkIn,
            checkOutDate: checkOut,
            totalAmount,
            notes: notes?.trim(),
            createdBy: userId,
            status: 'confirmed' // Auto-confirm for authenticated users
        });

        await newBooking.save();

        // Update room status
        await Room.findOneAndUpdate(
            { roomNumber: roomNumber.toString().trim() },
            { status: 'occupied' }
        );

        // Send confirmation email
        const subject = `Booking Confirmation - ${newBooking.bookingReference}`;
        const text = `Dear ${user.fullname},\n\nYour booking has been confirmed.\n\nBooking Reference: ${newBooking.bookingReference}\nRoom: ${newBooking.roomNumber}\nCheck-in: ${newBooking.checkInDate.toLocaleDateString()}\nCheck-out: ${newBooking.checkOutDate.toLocaleDateString()}\nTotal Amount: $${newBooking.totalAmount}\n\nThank you for choosing our hotel!`;
        const html = `<p>Dear ${user.fullname},</p><p>Your booking has been confirmed.</p><p><strong>Booking Details:</strong></p><ul><li><strong>Reference:</strong> ${newBooking.bookingReference}</li><li><strong>Room:</strong> ${newBooking.roomNumber}</li><li><strong>Check-in:</strong> ${newBooking.checkInDate.toLocaleDateString()}</li><li><strong>Check-out:</strong> ${newBooking.checkOutDate.toLocaleDateString()}</li><li><strong>Total Amount:</strong> $${newBooking.totalAmount}</li></ul><p>Thank you for choosing our hotel!</p>`;
        await sendEmail(user.email, subject, text, html);

        res.json({
            message: 'Booking created successfully',
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

// Cancel Booking
router.put('/bookings/:id/cancel', authenticateToken, authorizeCustomer, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const booking = await Booking.findOne({ _id: req.params.id, customerEmail: user.email });
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (!['confirmed', 'pending'].includes(booking.status)) {
            return res.status(400).json({ error: 'Cannot cancel this booking' });
        }

        // Check if cancellation is within allowed timeframe (e.g., 24 hours before check-in)
        const twentyFourHoursFromNow = new Date();
        twentyFourHoursFromNow.setHours(twentyFourHoursFromNow.getHours() + 24);

        if (booking.checkInDate <= twentyFourHoursFromNow) {
            return res.status(400).json({ error: 'Cannot cancel booking less than 24 hours before check-in' });
        }

        booking.status = 'cancelled';
        booking.cancelledAt = new Date();
        await booking.save();

        // Update room status back to available
        await Room.findOneAndUpdate({ roomNumber: booking.roomNumber }, { status: 'available' });

        // Send cancellation email
        const subject = `Booking Cancellation Confirmation - ${booking.bookingReference}`;
        const text = `Dear ${user.fullname},\n\nYour booking has been cancelled.\n\nBooking Reference: ${booking.bookingReference}\nRoom: ${booking.roomNumber}\nCheck-in: ${booking.checkInDate.toLocaleDateString()}\nCheck-out: ${booking.checkOutDate.toLocaleDateString()}\nTotal Amount: $${booking.totalAmount}\n\nThank you for choosing our hotel!`;
        const html = `<p>Dear ${user.fullname},</p><p>Your booking has been cancelled.</p><p><strong>Booking Details:</strong></p><ul><li><strong>Reference:</strong> ${booking.bookingReference}</li><li><strong>Room:</strong> ${booking.roomNumber}</li><li><strong>Check-in:</strong> ${booking.checkInDate.toLocaleDateString()}</li><li><strong>Check-out:</strong> ${booking.checkOutDate.toLocaleDateString()}</li><li><strong>Total Amount:</strong> $${booking.totalAmount}</li></ul><p>Thank you for choosing our hotel!</p>`;
        await sendEmail(user.email, subject, text, html);

        res.json({
            message: 'Booking cancelled successfully',
            booking: {
                bookingReference: booking.bookingReference,
                customerName: booking.customerName,
                customerEmail: booking.customerEmail,
                roomNumber: booking.roomNumber,
                checkInDate: booking.checkInDate,
                checkOutDate: booking.checkOutDate,
                status: booking.status,
                totalAmount: booking.totalAmount,
                cancelledAt: booking.cancelledAt
            }
        });
    } catch (error) {
        console.error('Booking cancellation error:', error);
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
