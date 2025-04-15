// const db = require('../config');
// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');

// exports.register = (req, res) => {
//   const { username, password } = req.body;
//   const hashed = bcrypt.hashSync(password, 10);

//   const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
//   db.query(sql, [username, hashed], (err, result) => {
//     if (err) return res.status(500).json({ err });
//     res.status(201).json({ message: 'User registered' });
//   });
// };

// exports.login = (req, res) => {
//   const { username, password } = req.body;

//   db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
//     if (err || results.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

//     const user = results[0];
//     const valid = bcrypt.compareSync(password, user.password);
//     if (!valid) return res.status(401).json({ message: 'Invalid password' });

//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.json({ token });
//   });
// };

// exports.getProfile = (req, res) => {
//   db.query('SELECT id, username FROM users WHERE id = ?', [req.user.id], (err, results) => {
//     if (err || results.length === 0) return res.status(404).json({ message: 'User not found' });
//     res.json(results[0]);
//   });
// };


const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const registerUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { registerUser, loginUser };
