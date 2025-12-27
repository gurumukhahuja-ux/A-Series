import React, { useState } from 'react';
import { Routes, Route, Outlet, Navigate, BrowserRouter } from 'react-router';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerificationForm from './pages/VerificationForm';
import Chat from './pages/Chat';
import Sidebar from './Components/SideBar/Sidebar.jsx';
import Marketplace from './pages/Marketplace';
import MyAgents from './pages/MyAgents';
import DashboardOverview from './pages/DashboardOverview';
import Automations from './pages/Automations';
import Admin from './pages/Admin';
import Invoices from './pages/Invoices';
import Notifications from './pages/Notifications';

import { AppRoute } from './types';
import { Menu } from 'lucide-react';
import AiBiz from './agents/AIBIZ/AiBiz.jsx';
import AiBase from './agents/AIBASE/AiBase.jsx';
import ComingSoon from './Components/ComingSoon/ComingSoon.jsx';

import { lazy, Suspense } from 'react';
import ProtectedRoute from './Components/ProtectedRoute/ProtectedRoute.jsx';

const LiveDemoPage = lazy(() => import('./pages/LiveDemoPage'));

const AuthenticatRoute = ({ children }) => {
  return children;
}

// ------------------------------
// Dashboard Layout (Auth pages)
// ------------------------------

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const user = JSON.parse(
    localStorage.getItem('user') || '{"name":"User"}'
  );

  return (
    <div className="fixed inset-0 flex bg-secondary text-maintext overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 bg-secondary h-full relative">

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-secondary shrink-0 z-50 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-surface text-maintext active:bg-surface/80 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-primary">AI-Mall</span>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm uppercase">
            {user.name?.charAt(0) || 'U'}
          </div>
        </div>

        {/* Outlet for pages */}
        <main className="flex-1 overflow-hidden relative w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// ------------------------------
// Placeholder Page
// ------------------------------

const PlaceholderPage = ({ title }) => (
  <div className="flex items-center justify-center h-full text-subtext flex-col">
    <h2 className="text-2xl font-bold mb-2 text-maintext">{title}</h2>
    <p>Coming soon...</p>
  </div>
);

// ------------------------------
// App Router
// ------------------------------

const NavigateProvider = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path={AppRoute.LANDING} element={<Landing />} />
        <Route path={AppRoute.LOGIN} element={<Login />} />
        <Route path={AppRoute.SIGNUP} element={<Signup />} />
        <Route path={AppRoute.E_Verification} element={<VerificationForm />} />
        <Route path="/agentsoon" element={<ComingSoon />}></Route>
        {/* agents */}
        <Route path='/agents/aibiz' element={<AiBiz />}></Route>
        <Route path='/agents/aibase' element={<AiBase />}></Route>
        {/* Dashboard (Protected) */}
        <Route
          path={AppRoute.DASHBOARD}
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="chat" replace />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:sessionId" element={<Chat />} />
          <Route path="overview" element={<DashboardOverview />} />
          <Route path="marketplace" element={<Marketplace />} />
          {/* <Route path="live-demos" element={
            <Suspense fallback={<div className="flex items-center justify-center h-full"><p className="text-subtext">Loading...</p></div>}>
              <LiveDemoPage />
            </Suspense>
          } /> */}
          <Route path="agents" element={<MyAgents />} />
          <Route path="automations" element={<Automations />} />
          <Route path="admin" element={<Admin />} />
          <Route path="settings" element={<Admin />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to={AppRoute.LANDING} replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default NavigateProvider;