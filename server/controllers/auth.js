// server/controllers/auth.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { verifyMessage } = require('ethers');

exports.signup = async (req, res) => {
  try {
    // Validate request data
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract user data from request body
    const { username, email, password, role } = req.body;

    console.log('Signup data:', { username, email, role });

    // Check if the user already exists
    const existingUser = await User.findOne({ role, email});
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists for role ${role}' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: 'User created successfully', role });
    console.log('getting the role',role)
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.login = async (req, res) => {
  try {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    // Extract user data from request body
    const { email, password, role } = req.body;
    
    console.log('user role is:', role)
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if the password is correct
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (req.body.role && user.role !== req.body.role) {
        return res.status(401).json({ error: 'Invalid credentials for the selected role' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    console.log(user.role)

    res.json({ token, userId: user._id, role: user.role });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getNonce = async (req, res) => {
  try {
    const { address } = req.params;
    const nonce = crypto.randomBytes(32).toString('hex');
    
    // Only store the nonce and wallet address temporarily
    let nonceDoc = await User.findOne({ walletAddress: address });
    if (!nonceDoc) {
      nonceDoc = new User({
        walletAddress: address,
        nonce,
        username: 'temp', // Will be updated during signup
        email: 'temp@temp.com' // Will be updated during signup
      });
    } else {
      nonceDoc.nonce = nonce;
    }
    await nonceDoc.save();
    
    res.json({ nonce });
  } catch (error) {
    console.error('Error generating nonce:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.verifyWallet = async (req, res) => {
  try {
    const { address, signature, email, role } = req.body;
    
    // Find user by wallet address, email AND role
    const user = await User.findOne({ 
      walletAddress: address,
      email,
      role
    });
    
    if (!user) {
      return res.status(404).json({ error: `No account found for this ${role} with the provided wallet address and email` });
    }

    // Verify signature
    const signerAddress = verifyMessage(user.nonce, signature);
    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Generate new nonce for next login
    user.nonce = crypto.randomBytes(32).toString('hex');
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, userId: user._id, role: user.role });
  } catch (error) {
    console.error('Error verifying wallet:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.signupWallet = async (req, res) => {
  try {
    const { address, signature, username, email, role } = req.body;
    
    // Validate email and username
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // First verify the signature
    const tempUser = await User.findOne({ walletAddress: address });
    if (!tempUser) {
      return res.status(404).json({ error: 'No nonce found for this address' });
    }

    // Verify signature
    const signerAddress = verifyMessage(tempUser.nonce, signature);
    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Check if user exists with same email/wallet AND same role
    const existingUser = await User.findOne({
      $and: [
        { username: { $ne: 'temp' } },
        { role },
        {
          $or: [
            { email },
            { walletAddress: address }
          ]
        }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: `You are already registered as a ${role}` 
      });
    }

    // Update the temporary user with the real data
    tempUser.username = username;
    tempUser.email = email;
    tempUser.role = role;
    tempUser.nonce = crypto.randomBytes(32).toString('hex'); // New nonce for next login

    await tempUser.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: tempUser._id, role: tempUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, userId: tempUser._id, role: tempUser.role });
  } catch (error) {
    console.error('Error in wallet signup:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
