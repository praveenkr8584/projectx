const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userValidationSchema } = require('../validators/schemas');
const User = require('../models/user');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', upload.single('image'), async (req, res) => {
    try {
        // Validate input data
        const { error } = userValidationSchema.validate(req.body);
        if (error) {
            console.error('Registration validation error:', error.details[0].message);
            return res.status(400).json({ error: 'Invalid input data: ' + error.details[0].message });
        }

        let { username, fullname, email, password, phone, aadharno, role } = req.body;

        // Convert phone and aadharno to numbers if they are strings
        try {
            phone = typeof phone === 'string' ? Number(phone) : phone;
            aadharno = typeof aadharno === 'string' ? Number(aadharno) : aadharno;
        } catch (conversionError) {
            console.error('Data conversion error:', conversionError);
            return res.status(400).json({ error: 'Invalid phone or Aadhar number format' });
        }

        // Check for existing user
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            console.error('Registration error: User already exists', { email, username });
            return res.status(409).json({ error: 'User with this email or username already exists' });
        }

        // Hash password
        let hashedPassword;
        try {
            hashedPassword = await bcrypt.hash(password, 10);
        } catch (hashError) {
            console.error('Password hashing error:', hashError);
            return res.status(500).json({ error: 'Failed to process password' });
        }

        // Handle image upload
        let image = req.file ? req.file.filename : undefined;

        // Create and save new user
        const newUser = new User({ username, fullname, email, password: hashedPassword, phone, aadharno, role, image });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration internal server error:', error.message, req.body);

        // Handle specific database errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: 'Validation failed: ' + Object.values(error.errors).map(e => e.message).join(', ') });
        }
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Duplicate entry: User already exists' });
        }

        // Generic internal server error
        res.status(500).json({ error: 'Internal server error. Please try again later.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        let isMatch;
        if (user.password.startsWith('$2b$') || user.password.startsWith('$2a$')) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = password === user.password;
        }

        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const secret = user.role === 'admin' ? process.env.ADMIN_SECRET : process.env.CUSTOMER_SECRET;
        const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1h' });
        res.json({ token, role: user.role, user: { id: user._id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user._id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            aadharno: user.aadharno,
            role: user.role,
            image: user.image
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
