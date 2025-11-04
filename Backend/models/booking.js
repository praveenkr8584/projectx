const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingReference: {
        type: String,
        unique: true,
        required: true
    },
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerEmail: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    roomNumber: {
        type: String,
        required: true,
        trim: true
    },
    checkInDate: {
        type: Date,
        required: true
    },
    checkOutDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'checked-in', 'completed', 'cancelled'],
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    checkedInAt: Date,
    checkedOutAt: Date,
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

// Generate booking reference before saving
bookingSchema.pre('save', async function(next) {
    if (this.isNew && !this.bookingReference) {
        // Generate reference like BK20241104-001
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const count = await mongoose.model('Booking').countDocuments({
            createdAt: { $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()) }
        });
        this.bookingReference = `BK${dateStr}-${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);
