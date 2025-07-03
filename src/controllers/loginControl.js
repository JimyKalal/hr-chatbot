//src\controllers\loginControl.js
const bcrypt = require('bcryptjs');
const User = require('../models/userDetails');
const { generateToken } = require('../utils/jwt');

exports.login = async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.send("Invalid credentials");

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.send("Invalid credentials");

        if (user.role !== role) return res.send("Role mismatched");

        const token = generateToken({ id: user._id, role: user.role });

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        });

        if (user.role === 'hr') {
            return res.redirect('/dashboard');
        } else {
            return res.redirect('/chatbot');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};


