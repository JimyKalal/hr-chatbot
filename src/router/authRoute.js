const express = require('express');
const router = express.Router();
const loginControl = require('../controllers/loginControl');
const registerControl = require('../controllers/registerControl');

router.post('/login',loginControl.login);
router.post('/register',registerControl.register);

module.exports = router;