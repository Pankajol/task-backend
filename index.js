const express = require('express');
const cors = require("cors");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path if necessary
require('dotenv').config();

const app = express();
app.use(express.json());

// CORS settings
const corsOptions = {
    origin: 'exp://127.0.0.1:8081', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type', 'Authorization'] // Headers that your app might use
  };
  app.use(cors(corsOptions));

// Optimized database connection
let cachedDb = null;
async function connectToDatabase(uri) {
  if (cachedDb) {
    return cachedDb;
  }
  try {
    const client = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    cachedDb = client;
    console.log('MongoDB connected');
    return client;
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw new Error('Database connection failed');
  }
}

// Sample route to verify server status
app.get("/", (req, res) => {
  res.json({
    data: "Server is up and running!",
  });
});

// Register route
app.post('/register', async (req, res) => {
  await connectToDatabase(process.env.MONGODB_URI); // Ensure DB connection

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Password hashing with a reduced salt round for performance
    const hashedPassword = await bcrypt.hash(password, 8);

    // Create and save a new user
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    return res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Login route
app.post('/login', async (req, res) => {
  await connectToDatabase(process.env.MONGODB_URI);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find user and validate password
    const userInfo = await User.findOne({ email });
    if (!userInfo) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, userInfo.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const userPayload = { id: userInfo._id, email: userInfo.email, role: userInfo.role || 'user' };
    const accessToken = jwt.sign(userPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });

    return res.json({
      message: "Login successful",
      userRole: userInfo.role,
      email,
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Server setup
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
