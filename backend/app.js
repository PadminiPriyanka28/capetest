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
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/userdb';

mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => console.error('MongoDB connection error:', err));

const server = app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

module.exports = { app, server };
