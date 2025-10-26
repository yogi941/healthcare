import mongoose from 'mongoose';

// --- User Schema ---
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor'], default: 'patient' },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

// --- Doctor Profile Schema ---
const doctorProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true },
    // Availability is an array of objects: { date: 'YYYY-MM-DD', slots: ['HH:MM', 'HH:MM'] }
    availability: [{
        date: { type: String, required: true }, // Format YYYY-MM-DD
        slots: [{ type: String }]               // Format HH:MM
    }],
}, { timestamps: true });

export const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);

// --- Appointment Schema ---
const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'DoctorProfile', required: true },
    appointmentDate: { type: String, required: true }, // Format YYYY-MM-DD
    appointmentTime: { type: String, required: true }, // Format HH:MM
    status: { type: String, enum: ['booked', 'cancelled'], default: 'booked' },
}, { timestamps: true });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
