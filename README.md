# 🚚 SwiftMove – Movers & Packers Platform

SwiftMove is a full-stack web application designed to simplify logistics services such as moving, packing, warehousing, and transportation.  
Users can calculate prices, book services, make secure payments, and track their bookings through a modern web interface.

---
## 📌 Project Status: **In Development**

> ⚠️ This project is currently under active development.Features are being implemented step by step.

---

## 🧩 Features

### 👤 Authentication
- User signup & login (JWT-based)
- Role-based access (User / Admin / Mover)
- Protected routes

### 📦 Logistics Services
- Moving & Packing
- Warehousing
- Transportation
- Service-based price calculation

### 🧾 Booking System
- Service selection
- Price estimation
- Booking confirmation
- Booking summary

### 💳 Payment Integration
- Razorpay payment gateway
- Secure order creation
- Server-side payment verification
- Payment status handling

### 📊 Dashboards (Planned / In Progress)
- User dashboard (bookings & payments)
- Admin dashboard (users, services, payments)

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- React Router
- Context API

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Razorpay SDK

### Tools
- Git & GitHub
- Postman
- VS Code

---

## Run Backend

cd Backend
npm install
npm start

## Backend runs on:

http://localhost:5000

## Run Frontend 

cd Frontend
npm install
npm run dev

## Frontend runs on: 

http://localhost:5173

## 🔐 Payment Flow (Razorpay)

1. User selects service and price  
2. Backend creates a Razorpay order  
3. Razorpay checkout opens  
4. Payment is completed by the user  
5. Backend verifies the payment signature  
6. Booking is marked as successful  

---

## 👨‍💻 Author

**Muhammed Aflah A**  
Full-Stack Developer (Learning)



