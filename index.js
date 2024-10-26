const express = require('express');


const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust the path based on your project structure
require('dotenv').config();

const app = express();
app.use(express.json()); // Middleware to parse JSON data

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
// register
// Adjust the path to your User model

app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create a new user
        const newUser = new User({ email, password });
        await newUser.save();

        return res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email) {
      return res.status(400).json({ message: "Email is required" });
  }
  if (!password) {
      return res.status(400).json({ message: "Password is required" });
  }

  try {
      // Find user by email
      const userInfo = await User.findOne({ email });
      if (!userInfo) {
          return res.status(404).json({ message: "User not found" });
      }

      console.log("User Info:", userInfo); // Log retrieved user information
      console.log("Provided Password:", password); // Log provided password
      console.log("Stored Password (hashed):", userInfo.password); // Log stored hashed password

      // Compare provided password with stored hashed password
      const passwordMatch = await bcrypt.compare(password, userInfo.password);
      console.log("Password match:", passwordMatch); // This should log true if the password is correct

      if (!passwordMatch) {
          return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create user payload
      const userPayload = {
          id: userInfo._id,
          email: userInfo.email,
          role: userInfo.role || 'user',
      };

      // Generate a JWT token
      const accessToken = jwt.sign(userPayload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });

      return res.json({
          message: "Login successful",
          userRole: userInfo.role, // 'admin' or 'user'
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
