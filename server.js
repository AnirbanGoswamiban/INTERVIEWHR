require("dotenv").config();
const express = require('express');
const cors = require('cors');
const { initializeFirebase } = require('./src/config/firebase');
const apiRoutes = require('./src/api/index.routes');

// Initialize Firebase Admin SDK
initializeFirebase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api',apiRoutes)


initializeFirebase

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
