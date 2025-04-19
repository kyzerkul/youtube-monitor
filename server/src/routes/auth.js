const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { getSupabase } = require('../utils/supabase');
const { logger } = require('../utils/logger');

// Register a new user
router.post('/signup', async (req, res) => {
  try {
    console.log('Signup request received:', JSON.stringify({ ...req.body, password: '***' }));
    logger.info('Signup request received with email: ' + req.body.email);
    
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      logger.error('Signup validation failed: missing required fields');
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    const supabase = getSupabase();
    
    // Check if user already exists
    console.log('Checking if user exists with email:', email);
    try {
      const { data: existingUsers, error: existingUserError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .limit(1);
      
      if (existingUserError) {
        console.error('Error checking existing user:', existingUserError);
        logger.error('Error checking existing user: ' + JSON.stringify(existingUserError));
        return res.status(500).json({ message: 'Error checking if user exists' });
      }
      
      console.log('Existing users check result:', existingUsers);
      
      if (existingUsers && existingUsers.length > 0) {
        logger.info('Signup rejected: User already exists with email ' + email);
        return res.status(409).json({ message: 'User with this email already exists' });
      }
    } catch (checkError) {
      console.error('Exception checking if user exists:', checkError);
      logger.error('Exception checking if user exists: ' + checkError.message);
      return res.status(500).json({ message: 'Error checking if user exists' });
    }
    
    // Hash the password
    console.log('Hashing password...');
    try {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      console.log('Password hashed successfully');
      
      // Create the user
      console.log('Attempting to create user in database...');
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          { 
            name, 
            email, 
            password_hash: passwordHash,
            is_admin: false
          }
        ])
        .select('id, name, email, is_admin');
      
      console.log('Insert user result:', newUser ? 'Success' : 'Failed', error ? JSON.stringify(error) : 'No error');
      
      if (error) {
        console.error('Error creating user:', error);
        logger.error('Error creating user: ' + JSON.stringify(error));
        return res.status(500).json({ message: 'Failed to create user account: ' + error.message });
      }
      
      if (!newUser || newUser.length === 0) {
        console.error('No user was created despite no error');
        logger.error('No user was created despite no error');
        return res.status(500).json({ message: 'Failed to create user account: No user data returned' });
      }
    } catch (hashError) {
      console.error('Exception during user creation:', hashError);
      logger.error('Exception during user creation: ' + hashError.message);
      return res.status(500).json({ message: 'Error during account creation process' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser[0].id,
        email: newUser[0].email,
        name: newUser[0].name,
        isAdmin: newUser[0].is_admin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser[0].id,
        name: newUser[0].name,
        email: newUser[0].email,
        isAdmin: newUser[0].is_admin
      }
    });
  } catch (error) {
    console.error('Unhandled error in signup:', error);
    logger.error('Signup error: ' + error.message);
    logger.error('Signup error stack: ' + error.stack);
    res.status(500).json({ message: 'An error occurred during registration: ' + error.message });
  }
});

// DEV Login route - development only!
router.post('/dev-login', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: 'Not found' });
    }

    // Create a temporary admin user
    const user = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Admin User',
      email: 'admin@example.com',
      is_admin: true
    };

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Development login successful',
      token,
      user
    });
  } catch (error) {
    logger.error('Dev login error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

// Regular Login route
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', JSON.stringify({ ...req.body, password: '***' }));
    logger.info('Login attempt with email: ' + req.body.email);
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    const supabase = getSupabase();
    
    // Get user from database
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, is_admin')
      .eq('email', email)
      .limit(1);
    
    if (error) {
      console.error('Database error during login:', error);
      logger.error('Database error during login:', error);
      return res.status(500).json({ message: 'An error occurred during authentication' });
    }
    
    console.log('Users found:', users ? JSON.stringify(users) : 'None');
    
    // Check if user exists and password is correct
    if (!users || users.length === 0) {
      logger.info('Login failed: No user found with email ' + email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = users[0];
    console.log('Comparing password for user:', user.email);
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      logger.info('Login failed: Invalid password for ' + email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('Password validation successful');
    logger.info('Login successful for user: ' + email);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.is_admin
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during authentication' });
  }
});

// Get current user info
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.json({
        id: decoded.userId,
        name: decoded.name,
        email: decoded.email,
        isAdmin: decoded.isAdmin
      });
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

module.exports = router;
