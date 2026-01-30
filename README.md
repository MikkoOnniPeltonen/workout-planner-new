# Workout Planner Application

A comprehensive **Workout Planner** application built with the **MERN stack** (MongoDB, Express, React, Node.js). This project provides a complete solution for managing workouts, tracking progress, and visualizing user statistics.

## 🚀 Technologies

- **Frontend**: React 19, Vite, Tailwind CSS 4, React Query, React Router 7, Recharts.
- **Backend**: Node.js (v22+), Express, Mongoose, JWT Authentication.
- **Tooling**: Biome (Linting/Formatting), TypeScript.

## 📂 Project Structure

- `frontend/`: React application (Vite).
- `backend/`: Node.js Express API.

## 🛠️ Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v22 or later recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas URI)

## 📦 Installation & Setup

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    pnpm install
    ```
3.  Configure environment variables:
    Create a `.env` file in the `backend` directory with the following content:
    ```env
    PORT=3000
    MONGODB_URI=mongodb://localhost:27017/workout-planner
    TOKEN_SECRET=your_secret_key_here
    ```
4.  Start the server:
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:3000`.

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    # or
    pnpm install
    ```
3.  Configure environment variables:
    Create a `.env` file in the `frontend` directory with the following content:
    ```env
    VITE_BACKEND_URL=http://localhost:3000
    ```
4.  Start the development server:
    ```bash
    npm run dev
    ```
    The application will be available at the URL shown in the terminal (usually `http://localhost:5173`).

## 📜 Available Scripts

### Backend
- `npm run dev`: Start the server in watch mode.
- `npm start`: Start the server in production mode.
- `npm run build`: Compile TypeScript.
- `npm run lint`: Lint code using Biome.

### Frontend
- `npm run dev`: Start the Vite development server.
- `npm run build`: Build the app for production.
- `npm run lint`: Lint code using Biome.
- `npm run preview`: Preview the production build.

## ✨ Features

- **User Authentication**: Secure Login/Signup with JWT.
- **Workout Management**: Create, view, and manage workouts.
- **Exercise Library**: detailed list of exercises and muscle groups.
- **Statistics**: Visual progress tracking with charts.
- **Responsive Design**: Modern UI built with Tailwind CSS.
