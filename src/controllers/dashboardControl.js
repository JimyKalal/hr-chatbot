//src\controllers\dashboardControl.js
const User = require('../models/userDetails');

exports.showDashboard = async (req, res) => {
  try {
    // Only HR users should access here; auth middleware already ensures they've logged in
    const currentUserRole = req.user.role;
    if (currentUserRole !== 'hr') {
      return res.status(403).send('Access denied');
    }

    const users = await User.find({ role: 'user' }).lean();
    res.render('dashboard', { users });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).send("User not found");

    // Optional: Delete resume file from uploads
    const fs = require('fs');
    const path = require('path');
    if (user.resumeURL) {
      const resumePath = path.join(__dirname, '..', user.resumeURL);
      if (fs.existsSync(resumePath)) fs.unlinkSync(resumePath);
    }

    await user.deleteOne();
    res.redirect('/dashboard');
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).send('Server error');
  }
};
