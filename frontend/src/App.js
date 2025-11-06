import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from "./components/Home";
import Login from "./components/Login";
import Registration from "./components/Registration";
import KanbanBoard from "./components/KanbanBoard";
import WorkspaceHome from "./components/WorkspaceHome";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Settings from "./components/Settings";
import Wiki from "./components/WikiResources";
import './App.css';
import "./css/Home.css";
import './css/Login.css';
import './css/Registration.css';
import './css/KanbanBoard.css';
import './css/Sidebar.css';
import './css/TaskModal.css';
import './css/Home.css';
import './css/WorkspaceHome.css';
import "./css/PrivacyPolicy.css"
import "./css/Settings.css"
import "./css/Wiki.css"
import "./css/CalendarView.css";
import "./css/MyTaskView.css";

export default function App() {
  return (
    <AuthProvider>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/:username/project/:projectId/board/:boardId" element={<KanbanBoard />} />
            <Route path="/:username/" element={<WorkspaceHome />} />
            <Route path="/:username/settings" element={<Settings />} />
            <Route path="wiki" element={<Wiki />} />

            <Route path="/documents/privacy" element={<PrivacyPolicy />} />

            {/* <Route path="/workspace" element={<ProtectedRoute> <Workspace /> </ProtectedRoute>} /> */}
         </Routes>
    </AuthProvider>
  );
}