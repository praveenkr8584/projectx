const jwt = require('jsonwebtoken');
require('dotenv').config();

const customerSecret = process.env.CUSTOMER_SECRET;
const adminSecret = process.env.ADMIN_SECRET;

// --- Middleware ---
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied' });

    try {
        // Try verifying with customer secret first
        let verified = jwt.verify(token, customerSecret);
        req.user = verified;
        next();
    } catch (error) {
        try {
            // If customer secret fails, try admin secret
            const verified = jwt.verify(token, adminSecret);
            req.user = verified;
            next();
        } catch (error) {
            res.status(400).json({ error: 'Invalid token' });
        }
    }
};

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
};

const authorizeCustomer = (req, res, next) => {
    if (req.user.role !== 'customer') return res.status(403).json({ error: 'Customer access required' });
    next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin,
    authorizeCustomer
};
