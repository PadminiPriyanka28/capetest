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
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, 'secret', { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
