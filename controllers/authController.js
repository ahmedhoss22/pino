// controllers/authController.js
const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const User = require('../models/userModel');
const db = require('../config/db');

const router = express.Router();
router.use(bodyParser.json());

const secretKey = 'my-32-character-ultra-secure-and-ultra-long-secret';

router.post('/login', async (req, res) => {
  try {
    console.log(req.body);
    const { email, password } = req.body;

    if( !email || !password){
      return res.send({message :"email  & password are required"})
    }

    const user = await User.findByEmail(email);

    // if (!user) {
    //   return res.status(401).json({ message: 'Invalid email or password' });
    // }

    const passwordMatch = await user.comparePassword(password);
    // if (!passwordMatch) {
    //   return res.status(401).json({ message: 'Invalid email or password' });
    // }

    const token = jwt.sign({ userId: user.id, role: user.role }, secretKey, { expiresIn: '1h' });
    console.log('Generated Token:', token);

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error in Login Route:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if the email is already registered
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered' });
    }

    // Create a new user using the register method
    const newUser = await User.register({ email, password });

    // Generate a JWT token for the newly registered user
    const token = jwt.sign({ userId: newUser.id, role: newUser.role }, secretKey, { expiresIn: '1h' });

    res.status(201).json({ token });
  } catch (error) {
    console.error('Error in Register Route:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


module.exports = router;
