const express = require('express');
const router = express.Router();
const authRoutes = require('./Auth/routes');
const interviewRoutes = require('./interview/routes');
router.use('/auth', authRoutes);
router.use('/interview', interviewRoutes);

module.exports = router;