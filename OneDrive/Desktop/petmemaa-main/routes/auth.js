const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Signup
router.post('/signup', async (req, res) => {
  const { username, phone, password, confirmPassword } = req.body;

  // Debug: Log password and confirmPassword
  console.log('Password:', password);
  console.log('Confirm Password:', confirmPassword);

  if (password !== confirmPassword) {
    return res.status(400).send('Passwords do not match');
  }

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { phone }] });
    if (existingUser) {
      return res.status(400).send('Username or phone number already exists');
    }
    const user = new User({ username, phone, password });
    await user.save();
    res.status(201).send('User created');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Signin
router.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  // Debug: Log request body
  console.log('Signin request received:', req.body);

  try {
    const user = await User.findOne({ username });

    // Debug: Log user found status
    console.log('User found:', !!user);

    if (user && await user.comparePassword(password)) {
      req.session.userId = user._id;  // Setting the session userId
      console.log('Signin successful, redirecting to welcome page');
      res.redirect('/welcome'); // Redirect to the home page after successful signin
    } else {
      res.status(400).send('Invalid credentials');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Signout
router.post('/signout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Could not log out.');
    } else {
      res.send('Logout successful');
    }
  });
});

module.exports = router;