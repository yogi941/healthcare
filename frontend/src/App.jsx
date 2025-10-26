import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './index.css'; // Import the new CSS file

// --- Global Configuration ---

// Base URL for the backend API
const API_URL = 'http://localhost:5000/api';

// --- Utility Functions for Local Storage and Authentication ---

// Function to retrieve auth data (token, user object, role) from localStorage
const getAuthData = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const role = localStorage.getItem('role');
  return { token, user: user ? JSON.parse(user) : null, role };
};

// Function to save auth data to localStorage upon successful login/registration
const setAuthData = (token, user, role) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('role', role);
};

// Function to remove all auth data from localStorage on logout
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('role');
};

// --- API Service (Axios Instance) ---

// Create an Axios instance with base URL and default headers
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Axios Request Interceptor: Adds the Authorization token to every outgoing request
api.interceptors.request.use(config => {
  const { token } = getAuthData();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});


// --- Shared Components ---

// Toast Notification Component for user feedback
const Toast = ({ message, type, onClose }) => {
  if (!message) return null;

  // Define styling based on the toast type (success, error, info)
  const typeClassMap = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info',
  };

  const finalClass = `toast-message ${typeClassMap[type] || typeClassMap.info}`;

  return (
    // Fixed position ensures the toast is always visible
    <div className={finalClass} role="alert">
      <div className="toast-content-wrapper">
        <span className="toast-title">{type.charAt(0).toUpperCase() + type.slice(1)}:</span>
        <button onClick={onClose} className="toast-close-btn">&times;</button>
      </div>
      <p className="toast-text">{message}</p>
    </div>
  );
};

// Global Navigation Bar
const Navbar = ({ user, role, onLogout, onNavigate }) => (
  <nav className="nav-bar">
    <div className="nav-container">
      {/* Brand Name */}
      <div className="nav-brand-group">
        <div className="nav-brand-name" onClick={() => onNavigate('home')}>
          Health<span className="brand-suffix">Connect</span>
        </div>
      </div>
      {/* Auth/Navigation Buttons */}
      <div className="nav-actions">
        {user ? (
          // Logged in state: Show user info, Dashboard, and Logout buttons
          <>
            <span className="user-info">
              {user.name} ({role})
            </span>
            <button
              onClick={() => onNavigate(role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard')}
              className="btn btn-dashboard"
            >
              Dashboard
            </button>
            <button
              onClick={onLogout}
              className="btn btn-logout"
            >
              Logout
            </button>
          </>
        ) : (
          // Logged out state: Show Login and Sign Up buttons
          <>
            <button
              onClick={() => onNavigate('login')}
              className="btn btn-nav-login"
            >
              Login
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="btn btn-nav-signup"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  </nav>
);

// Reusable Card component for consistent styling of sections
const Card = ({ title, children, className = '' }) => (
  <div className={`card-component ${className}`}>
    {title && <h2 className="card-title">{title}</h2>}
    {children}
  </div>
);


// --- Page/Feature Components ---

// Landing Page
const HomePage = ({ onNavigate, role }) => (
  <div className="homepage-hero">
    <h1 className="hero-title">
      Heal the <span className="hero-title-suffix">Future</span>.
    </h1>
    <p className="hero-subtitle">
      Your seamless connection to top healthcare professionals. Manage bookings, availability, and care all in one place.
    </p>
    {/* Conditional navigation based on user login status */}
    <div className="hero-actions">
      {!role ? (
        // Not logged in: buttons for Login and Signup
        <>
          <button
            onClick={() => onNavigate('login')}
            className="btn btn-hero-primary"
          >
            Login to Dashboard
          </button>
          <button
            onClick={() => onNavigate('signup')}
            className="btn btn-hero-secondary"
          >
            Get Started
          </button>
        </>
      ) : (
        // Logged in: button to go straight to dashboard
        <button
          onClick={() => onNavigate(role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard')}
          className="btn btn-hero-dashboard"
        >
          Go to My Dashboard
        </button>
      )}
    </div>
  </div>
);

// Combined Login and Registration Form
const AuthForm = ({ type, setAuth, onNavigate, showToast }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');
  const [specialization, setSpecialization] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = type === 'login'; // Determine if we are rendering the login or signup flow

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    showToast('', ''); // Clear previous toast message

    try {
      // Build the payload for the API call
      const payload = { email, password };
      if (!isLogin) {
        payload.name = name;
        payload.role = role;
        if (role === 'doctor') payload.specialization = specialization;
      }

      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, payload);

      const { token, _id, name: userName, email: userEmail, role: userRole } = response.data;

      // Save token and user details to localStorage and update app state
      setAuthData(token, { _id, name: userName, email: userEmail }, userRole);
      setAuth({ user: { _id, name: userName, email: userEmail }, role: userRole, token });
      
      showToast(`Welcome, ${userName}!`, 'success');
      // Navigate to the appropriate dashboard
      onNavigate(userRole === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard');

    } catch (err) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 'Authentication failed. Please check credentials.';
      showToast(errorMessage, 'error');
      setLoading(false);
    }
  };

  const title = isLogin ? 'Sign In to HealthConnect' : 'Create Your HealthConnect Account';
  const buttonText = isLogin ? 'Sign In' : 'Register';

  return (
    <div className="auth-page-wrapper">
      <Card title={title}>
        <form onSubmit={handleSubmit} className="auth-form">
          {/* Registration fields (Name, Role, Specialization) are hidden during login */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />
          )}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="form-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="form-input"
          />
          {!isLogin && (
            <>
              {/* Role selection dropdown */}
              <div className="form-field-group">
                <label className="form-label">I am registering as:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-select"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                </select>
              </div>
              {/* Specialization field visible only for doctors */}
              {role === 'doctor' && (
                <input
                  type="text"
                  placeholder="Specialization (e.g., Cardiology)"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  required
                  className="form-input"
                />
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-auth-submit"
          >
            {loading ? 'Processing...' : buttonText}
          </button>
        </form>

        {/* Toggle between login/signup */}
        <p className="auth-toggle-text">
          {isLogin ? "Need an account? " : "Already registered? "}
          <span
            onClick={() => onNavigate(isLogin ? 'signup' : 'login')}
            className="auth-toggle-link"
          >
            {isLogin ? 'Register Now' : 'Login Here'}
          </span>
        </p>
      </Card>
    </div>
  );
};

// Patient Dashboard Component
const PatientDashboard = ({ user, showToast }) => {
  const [doctors, setDoctors] = useState([]); // List of all doctors available for booking
  const [appointments, setAppointments] = useState([]); // List of patient's appointments
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);

  // Function to fetch both doctors and the patient's appointments
  const fetchDoctorsAndAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const [doctorsRes, appointmentsRes] = await Promise.all([
        api.get('/doctors'),
        api.get('/appointments/patient'),
      ]);
      // Map doctor data to include user details (name, email)
      setDoctors(doctorsRes.data.map(d => ({ ...d, name: d.userId.name, email: d.userId.email })));
      
      // Sort appointments by date and time for cleaner display
      const sortedAppointments = appointmentsRes.data.sort((a, b) => {
          if (a.appointmentDate !== b.appointmentDate) return a.appointmentDate.localeCompare(b.appointmentDate);
          return a.appointmentTime.localeCompare(b.appointmentTime);
      });
      setAppointments(sortedAppointments);
      
    } catch (err) {
      showToast('Failed to fetch dashboard data.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchDoctorsAndAppointments();
  }, [fetchDoctorsAndAppointments]);

  // Handler for booking a new appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      showToast('Please select a doctor, date, and time.', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.post('/appointments', {
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
      });
      showToast('Appointment booked successfully! Confirmation sent.', 'success');
      // Reset form fields after successful booking
      setSelectedDoctor(null);
      setSelectedDate('');
      setSelectedTime('');
      fetchDoctorsAndAppointments(); // Refresh appointment list
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Booking failed. Slot might be taken.';
      showToast(`Error: ${errMsg}`, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handler for cancelling an existing appointment
  const handleCancelAppointment = async (appointmentId) => {
    // Custom check replaces window.confirm for better UI/UX
    if (!window.confirm('Do you really want to cancel this appointment? This action cannot be undone.')) return;

    setLoading(true);
    try {
      await api.put(`/appointments/${appointmentId}/cancel`);
      showToast('Appointment cancelled successfully.', 'info');
      fetchDoctorsAndAppointments(); // Refresh list to show cancelled status
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Cancellation failed.';
      showToast(`Error: ${errMsg}`, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Memoized value to calculate available time slots for the currently selected doctor and date
  const doctorAvailability = useMemo(() => {
    if (!selectedDoctor || !selectedDate) return [];
    // Find the availability object that matches the selected date
    return selectedDoctor.availability.find(av => av.date === selectedDate)?.slots || [];
  }, [selectedDoctor, selectedDate]);


  // Helper to get today's date in YYYY-MM-DD format for date picker minimum
  const getToday = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Welcome Back, <span className="patient-name">{user.name}</span>!</h1>

      {loading && <div className="loading-text">Loading Data...</div>}

      {/* --- Book Appointment Section --- */}
      <Card title="Book a New Appointment">
        <div className="book-appointment-grid">
          {/* Doctor Selection Dropdown */}
          <select
            value={selectedDoctor ? selectedDoctor._id : ''}
            onChange={(e) => setSelectedDoctor(doctors.find(d => d._id === e.target.value) || null)}
            className="form-select-lg"
          >
            <option value="">Select Doctor</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>{d.name} ({d.specialization})</option>
            ))}
          </select>

          {/* Date Selection Input */}
          <input
            type="date"
            min={getToday()} // Prevent booking in the past
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            disabled={!selectedDoctor || loading}
            className="form-input-lg"
          />

          {/* Time Slot Selection Dropdown (Dynamically populated based on doctor and date) */}
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            disabled={!selectedDate || doctorAvailability.length === 0 || loading}
            className="form-select-lg"
          >
            <option value="">Select Time Slot ({doctorAvailability.length} available)</option>
            {doctorAvailability.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>

          {/* Booking Button */}
          <button
            onClick={handleBookAppointment}
            disabled={!selectedDoctor || !selectedDate || !selectedTime || loading}
            className="btn btn-book-appointment"
          >
            {loading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
        {/* Feedback for no available slots */}
        {selectedDoctor && selectedDate && doctorAvailability.length === 0 && (
          <p className="no-slot-feedback">Dr. {selectedDoctor.name} has no available slots on {selectedDate}.</p>
        )}
      </Card>

      {/* --- Patient Appointments List --- */}
      <Card title="My Upcoming Appointments">
        {appointments.length === 0 ? (
          <p className="empty-list-message">You currently have no scheduled appointments.</p>
        ) : (
          <div className="appointment-list">
            {appointments.map(app => {
                const isBooked = app.status === 'booked';
                // Dynamic styling based on status
                const statusClass = isBooked ? 'appointment-booked' : 'appointment-cancelled';
                
                return (
                  <div
                    key={app._id}
                    className={`appointment-item ${statusClass}`}
                  >
                    <div className="appointment-details">
                      <p className="appointment-doctor">Dr. {app.doctorName}</p>
                      <p className="appointment-time-info">
                        <span className="font-medium">Date:</span> {app.appointmentDate} at {app.appointmentTime}
                      </p>
                    </div>
                    <div className="appointment-actions">
                      {/* Status badge */}
                      <span className="appointment-status-badge">
                        {app.status.toUpperCase()}
                      </span>
                      {/* Cancel button only for booked appointments */}
                      {isBooked && (
                        <button
                          onClick={() => handleCancelAppointment(app._id)}
                          disabled={loading}
                          className="btn btn-cancel-appointment"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

// Doctor Dashboard Component
const DoctorDashboard = ({ user, showToast }) => {
  const [appointments, setAppointments] = useState([]); // List of doctor's appointments
  const [availability, setAvailability] = useState([]); // Doctor's current set availability
  const [newDate, setNewDate] = useState(''); // State for new availability date input
  const [newSlots, setNewSlots] = useState(''); // State for new time slots input
  const [loading, setLoading] = useState(false);

  // Function to fetch doctor's profile (for availability) and booked appointments
  const fetchDoctorData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Doctor Profile to get existing availability (requires getting all doctors and filtering)
      const doctorsRes = await api.get('/doctors');
      const profile = doctorsRes.data.find(d => d.userId._id === user._id);
      if (profile) {
        // Sort availability by date before setting
        setAvailability(profile.availability.sort((a, b) => a.date.localeCompare(b.date)));
      }

      // 2. Fetch all appointments booked for this doctor
      const appointmentsRes = await api.get('/appointments/doctor');
       const sortedAppointments = appointmentsRes.data.sort((a, b) => {
          if (a.appointmentDate !== b.appointmentDate) return a.appointmentDate.localeCompare(b.appointmentDate);
          return a.appointmentTime.localeCompare(b.appointmentTime);
      });
      setAppointments(sortedAppointments);

    } catch (err) {
      showToast('Failed to fetch doctor data.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user._id, showToast]);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchDoctorData();
  }, [fetchDoctorData]);

  // Handler to submit new availability
  const handleUpdateAvailability = async (e) => {
    e.preventDefault();
    // Parse the comma-separated slots string into an array, cleaning up whitespace
    const slotsArray = newSlots.split(',').map(s => s.trim()).filter(s => s);

    if (!newDate || slotsArray.length === 0) {
      showToast('Please enter a date and comma-separated time slots (e.g., 09:00, 10:30).', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.put('/doctors/availability', {
        date: newDate,
        slots: slotsArray,
      });
      showToast(`Availability for ${newDate} updated successfully!`, 'success');
      setNewDate('');
      setNewSlots('');
      fetchDoctorData(); // Refresh current availability list
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update availability.';
      showToast(`Error: ${errMsg}`, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to get today's date in YYYY-MM-DD format for date picker minimum
  const getToday = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">Hello, <span className="doctor-name">{user.name}</span> (Doctor)!</h1>

      {loading && <div className="loading-text">Loading Data...</div>}

      <div className="doctor-dashboard-grid">
        {/* --- Manage Availability Section (Form) --- */}
        <Card title="Manage Availability" className="availability-form-card">
          <form onSubmit={handleUpdateAvailability} className="availability-form">
            <p className="availability-form-help-text">Add or update a full day's worth of availability. Existing slots for the date will be overwritten.</p>
            <div className="availability-form-inputs">
              <input
                type="date"
                min={getToday()}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="form-input"
              />
              <input
                type="text"
                placeholder="Time Slots (e.g., 09:00, 10:30, 14:00)"
                value={newSlots}
                onChange={(e) => setNewSlots(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-update-availability"
            >
              {loading ? 'Updating...' : 'Update/Set Availability'}
            </button>
          </form>
        </Card>

        {/* --- Current Availability Summary --- */}
        <Card title="Current Set Availability" className="availability-summary-card">
          <div className="availability-list-wrapper">
            {availability.length === 0 ? (
              <p className="empty-list-message">No availability set yet.</p>
            ) : (
              <ul className="availability-list">
                {/* Filter to show only future dates */}
                {availability.filter(av => new Date(av.date) >= new Date(getToday())).map(av => (
                  <li key={av.date} className="availability-item">
                    <p className="availability-date">{av.date}</p>
                    <p className="availability-slots">Slots: {av.slots.join(', ')}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      {/* --- View Appointments Section --- */}
      <Card title="Patient Appointments">
        {appointments.length === 0 ? (
          <p className="empty-list-message">You have no booked appointments.</p>
        ) : (
          <div className="doctor-appointments-grid">
            {appointments.map(app => {
                const isBooked = app.status === 'booked';
                // Dynamic card styling based on status
                const statusClass = isBooked ? 'appointment-booked-card' : 'appointment-cancelled-card';

                return (
                    <div
                        key={app._id}
                        className={`appointment-card ${statusClass}`}
                    >
                        <p className="appointment-card-patient-name">Patient: {app.patientName}</p>
                        <p className="appointment-card-time">
                            <span className="font-medium">Date & Time:</span> {app.appointmentDate} at {app.appointmentTime}
                        </p>
                        {/* Status badge */}
                        <p className="appointment-card-status-badge">
                          {app.status.toUpperCase()}
                        </p>
                    </div>
                );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};


// --- Main App Component ---

const App = () => {
  // Initialize auth state by checking localStorage
  const [auth, setAuth] = useState(getAuthData);
  const [currentPage, setCurrentPage] = useState('home');
  // State for global toast notifications
  const [toast, setToast] = useState({ message: '', type: '' });

  // Custom function to show toast messages, memoized with useCallback
  const showToast = useCallback((message, type) => {
    setToast({ message, type });
    // Auto-hide the toast after 4 seconds
    setTimeout(() => {
      setToast({ message: '', type: '' });
    }, 4000);
  }, []);

  // Effect hook for handling initial load and redirection based on auth status
  useEffect(() => {
    // If logged in, ensure the user lands on their correct dashboard unless they are on the home page
    if (auth.token) {
      if (auth.role === 'doctor' && !['doctor-dashboard', 'home'].includes(currentPage)) {
        setCurrentPage('doctor-dashboard');
      } else if (auth.role === 'patient' && !['patient-dashboard', 'home'].includes(currentPage)) {
        setCurrentPage('patient-dashboard');
      }
    } else if (currentPage !== 'login' && currentPage !== 'signup') {
      // If logged out, always default to the home page
      setCurrentPage('home');
    }
  }, [auth.token, auth.role, currentPage]); // Re-run when auth changes

  // Logout handler
  const handleLogout = () => {
    clearAuthData();
    setAuth({ token: null, user: null, role: null });
    showToast('You have been logged out successfully.', 'info');
    setCurrentPage('home');
  };

  // Navigation handler, includes route protection logic
  const handleNavigate = (page) => {
    if (auth.token) {
      // Prevent navigation to auth pages if already logged in
      if (page === 'login' || page === 'signup') return;
      
      // Role-based protection for dashboards
      if (page === 'doctor-dashboard' && auth.role !== 'doctor') {
          showToast('Access Denied. You are not a doctor.', 'error');
          return;
      }
      if (page === 'patient-dashboard' && auth.role !== 'patient') {
          showToast('Access Denied. You are not a patient.', 'error');
          return;
      }
    }
    setCurrentPage(page);
  };

  // Function to render the correct page based on the current state
  const renderPage = () => {
    if (auth.token && auth.role === 'patient' && currentPage.includes('patient-dashboard')) {
      return <PatientDashboard user={auth.user} showToast={showToast} />;
    }
    if (auth.token && auth.role === 'doctor' && currentPage.includes('doctor-dashboard')) {
      return <DoctorDashboard user={auth.user} showToast={showToast} />;
    }
    if (currentPage === 'login') {
      return <AuthForm type="login" setAuth={setAuth} onNavigate={handleNavigate} showToast={showToast} />;
    }
    if (currentPage === 'signup') {
      return <AuthForm type="signup" setAuth={setAuth} onNavigate={handleNavigate} showToast={showToast} />;
    }
    // Default to Home page
    return <HomePage onNavigate={handleNavigate} role={auth.role} />;
  };

  return (
    <>
      {/* Normalize CSS included via link (Good practice, kept as is) */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css" 
      />
      
      {/* Global styles are now handled by index.css */}
      
      <div className="app-main-layout">
        {/* Render Navbar and pass state/handlers */}
        <Navbar user={auth.user} role={auth.role} onLogout={handleLogout} onNavigate={handleNavigate} />
        <main className="app-main-content">
          {/* Render the current page */}
          {renderPage()}
        </main>
        {/* Render the global Toast component */}
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      </div>
    </>
  );
};

export default App;