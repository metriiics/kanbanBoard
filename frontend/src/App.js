import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from "./components/Home";
import Login from "./components/Login";
import Registration from "./components/Registration";
import Workspace from "./components/Workspace";
import './App.css';
import "./css/Home.css";
import './css/Login.css';
import './css/Registration.css';

export default function App() {
  return (
    <AuthProvider>
      <Router>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registration" element={<Registration />} />

            <Route path="/workspace" element={<ProtectedRoute> <Workspace /> </ProtectedRoute>} />
         </Routes>
      </Router>
    </AuthProvider>
  );
}