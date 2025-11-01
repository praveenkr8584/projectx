const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { userValidationSchema } = require('../validators/schemas');
const User = require('../models/user');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', upload.single('image'), async (req, res) => {
    try {
        const { error } = userValidationSchema.validate(req.body);
        if (error) {
            console.error('Registration validation error:', error.details[0].message, req.body);
            return res.status(400).json({ error: error.details[0].message });
        }

        let { username, fullname, email, password, phone, aadharno, role } = req.body;
        phone = typeof phone === 'string' ? Number(phone) : phone;
        aadharno = typeof aadharno === 'string' ? Number(aadharno) : aadharno;

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            console.error('Registration error: User already exists', { email, username });
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let image = req.file ? req.file.filename : undefined;
        const newUser = new User({ username, fullname, email, password: hashedPassword, phone, aadharno, role, image });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration internal server error:', error, req.body);
        res.status(500).json({ error: 'Internal server error' });
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
