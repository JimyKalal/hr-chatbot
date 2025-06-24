const express = require('express');
const router = express.Router();
const loginControl = require('../controllers/loginControl');
const registerControl = require('../controllers/registerControl');

router.post('/login',loginControl);
router.post('/register',registerControl);

module.exports = router;


//src\controllers\loginControl.js