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
