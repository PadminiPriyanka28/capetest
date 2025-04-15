// const express = require('express');
// const app = express();
// require('dotenv').config();

// app.use(express.json());

// const userRoutes = require('./routes/userRoutes');
// app.use('/api', userRoutes);

// module.exports = app;

const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use('/api', userRoutes);

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server };
