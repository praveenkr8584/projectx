// Script to create/reset a test admin user for ProjectX
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = 'mongodb://127.0.0.1:27017/HotelManagementDB';

const userSchema = new mongoose.Schema({
    username: String,
    fullname: String,
    email: String,
    password: String,
    phone: Number,
    aadharno: Number,
    role: { type: String, default: 'customer' }
});

const User = mongoose.model('User', userSchema);

async function createOrUpdateAdmin() {
    await mongoose.connect(MONGO_URI);
    const username = 'admin';
    const password = 'admin123';
    const email = 'admin@example.com';
    const fullname = 'Admin User';
    const phone = 9999999999;
    const aadharno = 123456789012;
    const role = 'admin';

    const hashedPassword = await bcrypt.hash(password, 10);
    let user = await User.findOne({ username });
    if (user) {
        user.fullname = fullname;
        user.email = email;
        user.password = hashedPassword;
        user.phone = phone;
        user.aadharno = aadharno;
        user.role = role;
        await user.save();
        console.log('Test admin user updated.');
    } else {
        await User.create({ username, fullname, email, password: hashedPassword, phone, aadharno, role });
        console.log('Test admin user created.');
    }
    await mongoose.disconnect();
}

createOrUpdateAdmin();
