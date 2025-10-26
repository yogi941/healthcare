import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import { router as apiRoutes } from './routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET; // Ensure this is set in .env

// --- Middleware ---
app.use(cors());
app.use(express.json()); // Body parser for raw json

// --- Routes ---
app.use('/api', apiRoutes);

// Simple default route check
app.get('/', (req, res) => {
    res.send('API is running for Healthcare Appointment System...');
});

// --- MongoDB Connection ---
if (!MONGO_URI || !JWT_SECRET) {
    console.error('FATAL ERROR: MONGO_URI or JWT_SECRET is not defined in the .env file.');
    process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully.'))
  .catch(err => {
    console.error('MongoDB connection error. Please check your MONGO_URI.');
    console.error(err);
    process.exit(1); // Exit process on connection failure
  });

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
