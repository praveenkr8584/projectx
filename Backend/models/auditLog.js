const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: String, // e.g., 'create', 'update', 'delete'
    entity: String, // e.g., 'room', 'booking', 'service', 'user'
    entityId: mongoose.Schema.Types.ObjectId,
    adminId: mongoose.Schema.Types.ObjectId, // admin who performed the action
    details: Object, // additional details like old/new values
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
