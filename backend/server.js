const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Database connection configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306
};

// Create MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connection established successfully!');
    connection.release();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
};

// Call the function to test the database connection
testDatabaseConnection();

// Simple user authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const userId = req.headers['user-id'];
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Get user from database
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid user' });
    }
    
    // Add user to request object
    req.user = users[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

// Check if user is admin middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required' });
  }
};

// Authentication Routes

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    // Check if user with the same email already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Validate role
    const validRoles = ['user', 'admin', 'manager'];
    const userRole = validRoles.includes(role) ? role : 'user';
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert the new user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)',
      [name, email, userRole, hashedPassword]
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.insertId,
        name,
        email,
        role: userRole
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user by email
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    
    // Compare provided password with stored hash
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to authenticate user' });
  }
});

// User API Routes

// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error(`Error fetching user with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// CREATE a new user
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    // Check if user with the same email already exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Validate role
    const validRoles = ['user', 'admin', 'manager'];
    const userRole = validRoles.includes(role) ? role : 'user';
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert the new user
    const [result] = await pool.query(
      'INSERT INTO users (name, email, role, password) VALUES (?, ?, ?, ?)',
      [name, email, userRole, hashedPassword]
    );
    
    res.status(201).json({
      id: result.insertId,
      name,
      email,
      role: userRole
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// UPDATE an existing user
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;
    
    // Check if user exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user in the database
    let updateQuery = 'UPDATE users SET ';
    const updateParams = [];
    
    if (name) {
      updateQuery += 'name = ?, ';
      updateParams.push(name);
    }
    
    if (email) {
      // Check if new email is already taken by another user
      if (email !== existingUsers[0].email) {
        const [emailCheck] = await pool.query('SELECT * FROM users WHERE email = ? AND id != ?', [email, id]);
        if (emailCheck.length > 0) {
          return res.status(400).json({ message: 'Email is already in use by another user' });
        }
      }
      
      updateQuery += 'email = ?, ';
      updateParams.push(email);
    }
    
    if (role) {
      // Validate role
      const validRoles = ['user', 'admin', 'manager'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      updateQuery += 'role = ?, ';
      updateParams.push(role);
    }
    
    if (password) {
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      updateQuery += 'password = ?, ';
      updateParams.push(hashedPassword);
    }
    
    // Remove the trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    
    // Add the WHERE clause
    updateQuery += ' WHERE id = ?';
    updateParams.push(id);
    
    // Execute the update query
    await pool.query(updateQuery, updateParams);
    
    // Fetch and return the updated user
    const [updatedUser] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
    res.json(updatedUser[0]);
  } catch (error) {
    console.error(`Error updating user with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// DELETE a user
app.delete('/api/users/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only administrators can delete users' });
    }
    
    // Check if user exists
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (existingUsers.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete the user
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(`Error deleting user with ID ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', require('./routes/userRoutes'));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
