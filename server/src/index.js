import express from 'express'
import morgan from 'morgan'
import cors from 'cors'
import mongoose from 'mongoose'
import { connectDB } from './lib/db.js'
import 'dotenv/config'
import router from './routes/index.js'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';

const app = express()
const PORT = process.env.PORT || 4000
const ORIGIN = process.env.CORS_ORIGIN || '*'
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yantrabhashi'
const JWT_SECRET = process.env.JWT_SECRET;


app.use(cors({ origin: ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))
app.use(cookieParser());


app.use('/api', router)

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  username: {type: String, required: true, unique: true},
  role: {type: String, required: true}
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// JWT Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth Routes
app.post('/signup', async (req, res) => {
  try {
    const { email, password, username, role } = req.body;
    console.log(req.body)
    if (!email || !password || !username || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUserEmail = await User.findOne({ email });
    const existingUsername = await User.findOne({ username });

    console.log(existingUsername);
    console.log("*********************");

    if (existingUserEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    if(existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ email, username, role, password: hashedPassword });

    // Generate JWT
    const token = jwt.sign({ userId: user._id, username, role }, JWT_SECRET, { expiresIn: '7d' });

    // Set cookie (non-httpOnly so frontend can read it)
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id, role: user.role, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    // Set cookie (non-httpOnly so frontend can read it)
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      token,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

mongoose.set('strictQuery', true)
mongoose.connect(MONGO_URI).then(()=>{
  console.log('[mongo] connected')
  app.listen(PORT, ()=> console.log(`[server] http://localhost:${PORT}`))
}).catch(err=>{
  console.error('Mongo connection error:', err.message)
  process.exit(1)
})
