const express = require('express');
const router = express.Router();
const { authenticateUser } = require('./controller');

// Route for user authentication
router.post('/login', authenticateUser);

module.exports = router;
