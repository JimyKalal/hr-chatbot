const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardControl');
const authMiddleware = require('../middleware/auth');

// Existing routes...
router.get('/dashboard', authMiddleware, dashboardController.showDashboard);

// New DELETE route
router.post('/dashboard/delete/:id', authMiddleware, dashboardController.deleteUser);

module.exports = router;
