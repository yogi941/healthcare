import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, DoctorProfile, Appointment } from './models.js';

// Utility function to generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// --- AUTH CONTROLLERS ---

// @desc    Register a new user (Doctor or Patient)
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
    const { name, email, password, role, specialization } = req.body;

    // Basic validation
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please include all required fields.' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role.toLowerCase(),
    });

    if (user) {
        // If doctor, create doctor profile
        if (user.role === 'doctor') {
            if (!specialization) {
                 // Clean up user if specialization is missing for a doctor registration
                 await User.deleteOne({ _id: user._id }); 
                 return res.status(400).json({ message: 'Specialization is required for doctors.' });
            }
            await DoctorProfile.create({
                userId: user._id,
                specialization,
                availability: [], // Starts empty
            });
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data.' });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid credentials.' });
    }
};

// --- DOCTOR CONTROLLERS (Doctor role required) ---

// @desc    Get all doctors with profiles
// @route   GET /api/doctors
export const getDoctors = async (req, res) => {
    try {
        const doctors = await DoctorProfile.find()
            .populate('userId', 'name email role'); // Populate user name and email

        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching doctors.', error });
    }
};

// @desc    Set or update doctor availability for a specific date
// @route   PUT /api/doctors/availability
export const updateAvailability = async (req, res) => {
    const { date, slots } = req.body; // date: 'YYYY-MM-DD', slots: ['09:00', '10:00']

    if (!date || !slots || slots.length === 0) {
        return res.status(400).json({ message: 'Date and slots are required.' });
    }

    try {
        const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });

        if (!doctorProfile) {
            return res.status(404).json({ message: 'Doctor profile not found.' });
        }

        const existingAvailabilityIndex = doctorProfile.availability.findIndex(av => av.date === date);

        if (existingAvailabilityIndex !== -1) {
            // Update existing date
            doctorProfile.availability[existingAvailabilityIndex].slots = slots;
        } else {
            // Add new date
            doctorProfile.availability.push({ date, slots });
        }

        await doctorProfile.save();
        res.status(200).json({ message: 'Availability updated successfully.', availability: doctorProfile.availability });

    } catch (error) {
        res.status(500).json({ message: 'Server error updating availability.', error });
    }
};

// --- APPOINTMENT CONTROLLERS (Patient/Doctor roles required) ---

// @desc    Book a new appointment (Patient only)
// @route   POST /api/appointments
export const bookAppointment = async (req, res) => {
    const { doctorId, appointmentDate, appointmentTime } = req.body;

    if (!doctorId || !appointmentDate || !appointmentTime) {
        return res.status(400).json({ message: 'All appointment details are required.' });
    }

    try {
        // 1. Check if the slot is available and not already booked
        const doctorProfile = await DoctorProfile.findById(doctorId);
        if (!doctorProfile) {
            return res.status(404).json({ message: 'Doctor not found.' });
        }

        const availabilityEntry = doctorProfile.availability.find(av => av.date === appointmentDate);
        if (!availabilityEntry || !availabilityEntry.slots.includes(appointmentTime)) {
            return res.status(400).json({ message: 'The selected slot is not available.' });
        }

        // 2. Check for duplicate appointment by the same patient for the same time
        const existingApp = await Appointment.findOne({
            patientId: req.user.id,
            appointmentDate,
            appointmentTime,
            status: 'booked'
        });

        if (existingApp) {
            return res.status(400).json({ message: 'You already have an appointment at this time.' });
        }

        // 3. Check if the slot is already booked by another patient
        const slotBooked = await Appointment.findOne({
            doctorId: doctorId,
            appointmentDate,
            appointmentTime,
            status: 'booked'
        });
        
        if (slotBooked) {
             return res.status(400).json({ message: 'This slot is already taken by another patient.' });
        }

        // 4. Create appointment
        const appointment = await Appointment.create({
            patientId: req.user.id,
            doctorId,
            appointmentDate,
            appointmentTime,
        });

        // NOTE: In a real app, you would remove the slot from the doctor's availability, 
        // but for simplicity, we rely on the Appointment check for slot booking.

        res.status(201).json({
            message: 'Appointment booked successfully.',
            appointment
        });

    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ message: 'Server error during booking.' });
    }
};

// @desc    Get all patient's appointments (Patient only)
// @route   GET /api/appointments/patient
export const getPatientAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.id })
            .populate({
                path: 'doctorId',
                select: 'userId',
                populate: { path: 'userId', select: 'name' }
            });
        
        // Flatten structure for frontend
        const result = appointments.map(app => ({
            ...app._doc,
            doctorName: app.doctorId.userId.name
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching patient appointments.', error });
    }
};

// @desc    Get all doctor's appointments (Doctor only)
// @route   GET /api/appointments/doctor
export const getDoctorAppointments = async (req, res) => {
    try {
        // Find doctor profile ID using the user ID
        const doctorProfile = await DoctorProfile.findOne({ userId: req.user.id });
        if (!doctorProfile) {
            return res.status(404).json({ message: 'Doctor profile not found.' });
        }

        const appointments = await Appointment.find({ doctorId: doctorProfile._id })
            .populate('patientId', 'name email'); // Populate patient name and email

        // Flatten structure for frontend
        const result = appointments.map(app => ({
            ...app._doc,
            patientName: app.patientId.name
        }));

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching doctor appointments.', error });
    }
};

// @desc    Cancel an appointment (Patient only)
// @route   PUT /api/appointments/:id/cancel
export const cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }

        // Ensure the patient is cancelling their own appointment
        if (appointment.patientId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'You can only cancel your own appointments.' });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ message: 'Appointment is already cancelled.' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({ message: 'Appointment cancelled successfully.', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Server error during cancellation.', error });
    }
};
