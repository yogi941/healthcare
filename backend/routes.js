import express from 'express';
import { 
    registerUser, loginUser, 
    getDoctors, updateAvailability,
    bookAppointment, getPatientAppointments, getDoctorAppointments, cancelAppointment
} from './controllers.js';
import { protect, restrictTo } from './middleware.js';

const router = express.Router();

// --- Auth Routes ---
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);

// --- Doctor Routes (Requires Auth) ---
// We allow unauthenticated users (like new patients) to view doctors for booking, 
// so this route is unprotected.
router.get('/doctors', getDoctors); 
router.put('/doctors/availability', protect, restrictTo(['doctor']), updateAvailability);

// --- Appointment Routes (Requires Auth) ---
// Patient routes
router.post('/appointments', protect, restrictTo(['patient']), bookAppointment);
router.get('/appointments/patient', protect, restrictTo(['patient']), getPatientAppointments);
router.put('/appointments/:id/cancel', protect, restrictTo(['patient']), cancelAppointment);

// Doctor routes
router.get('/appointments/doctor', protect, restrictTo(['doctor']), getDoctorAppointments);


export { router };
