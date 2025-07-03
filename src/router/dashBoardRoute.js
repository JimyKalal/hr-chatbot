const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardControl');
const auth = require('../middleware/auth');

router.get('/dashboard', auth, dashboardController.showDashboard);


module.exports = router;
