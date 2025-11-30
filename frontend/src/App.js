import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthProvider from './contexts/AuthContext';
import WorkspaceProvider from './contexts/WorkspaceContext';
import Home from "./components/Home";
import Login from "./components/Login";
import Registration from "./components/Registration";
import KanbanBoard from "./components/KanbanBoard";
import WorkspaceHome from "./components/WorkspaceHome";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Settings from "./components/Settings";
import Wiki from "./components/WikiResources";
import InvitationPage from "./components/InvitationPage";
import './App.css';
import "./css/Home.css";
import './css/Login.css';
import './css/Registration.css';
import './css/Sidebar.css';
import './css/KanbanBoard.css';
import './css/KanbanColumn.css';
import './css/KanbanTask.css';
import './css/TaskModal.css';
import './css/WorkspaceHome.css';
import "./css/PrivacyPolicy.css"
import "./css/Settings.css"
import "./css/Wiki.css"
import "./css/CalendarView.css";
import "./css/MyTaskView.css";
import "./css/InviteModal.css";
import "./css/InvitationPage.css";
import "./css/SectionSettings/ProfileSettings.css";
import "./css/SectionSettings/MembersSettings.css";

export default function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
         <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registration" element={<Registration />} />
            <Route path="/invite/:token" element={<InvitationPage />} />
            <Route path="/:username/project/:projectId/board/:boardId" element={<KanbanBoard />} />
            <Route path="/:username/" element={<WorkspaceHome />} />
            <Route path="/:username/settings" element={<Settings />} />
            <Route path="wiki" element={<Wiki />} />

            <Route path="/documents/privacy" element={<PrivacyPolicy />} />

            {/* <Route path="/workspace" element={<ProtectedRoute> <Workspace /> </ProtectedRoute>} /> */}
         </Routes>
      </WorkspaceProvider>
    </AuthProvider>
  );
}