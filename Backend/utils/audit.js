const AuditLog = require('../models/auditLog');

// --- Audit Logging Function ---
const logAudit = async (action, entity, entityId, adminId, details) => {
    try {
        const auditEntry = new AuditLog({
            action,
            entity,
            entityId,
            adminId,
            details
        });
        await auditEntry.save();
    } catch (error) {
        console.error('Error logging audit:', error);
    }
};

module.exports = logAudit;
