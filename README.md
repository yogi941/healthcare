A full-stack hospital appointment booking application that allows patients to book appointments with doctors and provides admin/doctor functionalities to manage schedules.

🌟 Features

Patient

Register/Login

Book doctor appointments based on available slots

View appointment history

Doctor/Admin

Manage available time slots

View patient appointments

Tech Stack

Frontend: React, Axios

Backend: Node.js, Express, MongoDB, Mongoose

Authentication: JWT, bcrypt

📂 Project Structure
healthcare-appointment-system/
├── backend/       # Server-side code
│   ├── .env       # Environment variables (DB URI, JWT secret)
│   ├── server.js  # Express server & routes setup
│   ├── models.js  # Mongoose schemas
│   ├── controllers.js  # Business logic
│   ├── routes.js  # API endpoints
│   └── middleware.js  # Auth & role checks
│
└── frontend/      # Client-side React app
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx   # Main app component
        ├── main.jsx  # React entry point
        └── assets/   # Images, styles, etc.
