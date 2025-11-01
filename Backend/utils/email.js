const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// --- Email Sending Function ---
const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html
        };
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// --- Admin Alert Function ---
const sendAdminAlert = async (subject, text, html) => {
    const adminEmail = process.env.ADMIN_EMAIL;
    await sendEmail(adminEmail, subject, text, html);
};

module.exports = {
    sendEmail,
    sendAdminAlert
};
