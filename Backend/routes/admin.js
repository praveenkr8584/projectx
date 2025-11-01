const express = require('express');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const Room = require('../models/room');
const Booking = require('../models/booking');
const Service = require('../models/service');
const User = require('../models/user');
const AuditLog = require('../models/auditLog');
const logAudit = require('../utils/audit');

const router = express.Router();

// Admin Dashboard
router.get('/dashboard', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        let bookings = await Booking.find();
        let users = await User.find();
        let services = await Service.find();
        let rooms = await Room.find();
        res.json({ message: "Admin Dashboard", bookings, users, services, rooms });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add Room
router.post('/dashboard/rooms', authenticateToken, authorizeAdmin, upload.array('images'), async (req, res) => {
    try {
        let images = req.files ? req.files.map(f => f.filename) : [];
        let features = req.body.features;
        if (typeof features === 'string') {
            features = features.split(',').map(f => f.trim());
        }
        let newRoom = new Room({
            ...req.body,
            features,
            images
        });
        await newRoom.save();
        await logAudit('create', 'room', newRoom._id, req.user.id, { newValues: req.body });
        res.json({ message: "Room created", room: newRoom });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update Room
router.put('/dashboard/rooms/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const oldRoom = await Room.findById(req.params.id);
        if (!oldRoom) return res.status(404).json({ error: 'Room not found' });
        let updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await logAudit('update', 'room', req.params.id, req.user.id, { oldValues: oldRoom, newValues: req.body });
        res.json({ message: "Room updated", room: updatedRoom });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Admin Stats
router.get('/stats', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalServices = await Service.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalRevenue = await Booking.aggregate([
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);
        const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

        const revenueByRoomType = await Booking.aggregate([
            {
                $lookup: {
                    from: 'rooms',
                    localField: 'roomNumber',
                    foreignField: 'roomNumber',
                    as: 'room'
                }
            },
            { $unwind: '$room' },
            {
                $group: {
                    _id: '$room.type',
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        res.json({
            totalRooms,
            totalBookings,
            totalServices,
            totalUsers,
            totalRevenue: revenue,
            revenueByRoomType
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Chart Data
router.get('/chart-data', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const bookingsData = await Booking.aggregate([
            { $match: { checkInDate: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkInDate" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const revenueData = await Booking.aggregate([
            { $match: { checkInDate: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkInDate" } },
                    revenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({
            bookingsOverTime: bookingsData,
            revenueOverTime: revenueData
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Monthly Revenue Report
router.get('/reports/revenue/monthly', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const monthlyRevenue = await Booking.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$checkInDate" } },
                    revenue: { $sum: "$totalAmount" },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({ monthlyRevenue });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Yearly Revenue Report
router.get('/reports/revenue/yearly', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const yearlyRevenue = await Booking.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: "%Y", date: "$checkInDate" } },
                    revenue: { $sum: "$totalAmount" },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.json({ yearlyRevenue });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Occupancy Report
router.get('/reports/occupancy', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();
        const occupiedRooms = await Room.countDocuments({ status: 'occupied' });
        const currentOccupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const occupancyTrends = await Booking.aggregate([
            { $match: { checkInDate: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$checkInDate" } },
                    occupiedDays: { $sum: { $divide: [{ $subtract: ["$checkOutDate", "$checkInDate"] }, 1000 * 60 * 60 * 24] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const averageOccupancy = occupancyTrends.length > 0 ? occupancyTrends.reduce((sum, day) => sum + day.occupiedDays, 0) / (occupancyTrends.length * totalRooms) * 100 : 0;

        res.json({
            currentOccupancyRate,
            averageOccupancy,
            occupancyTrends
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get Services (admin)
router.get('/services', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Add Service
router.post('/services', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        let newService = new Service(req.body);
        await newService.save();
        await logAudit('create', 'service', newService._id, req.user.id, { newValues: req.body });
        res.json({ message: "Service created", service: newService });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Update Service
router.put('/services/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const oldService = await Service.findById(req.params.id);
        if (!oldService) return res.status(404).json({ error: 'Service not found' });
        let updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await logAudit('update', 'service', req.params.id, req.user.id, { oldValues: oldService, newValues: req.body });
        res.json({ message: "Service updated", service: updatedService });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Delete Service
router.delete('/services/:id', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ error: 'Service not found' });
        await Service.findByIdAndDelete(req.params.id);
        await logAudit('delete', 'service', req.params.id, req.user.id, { deletedValues: service });
        res.json({ message: "Service deleted" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Audit Logs
router.get('/audit-logs', authenticateToken, authorizeAdmin, async (req, res) => {
    try {
        const auditLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
        res.json(auditLogs);
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
