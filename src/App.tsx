import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
import LandingPage from '@/pages/LandingPage';
import Install from '@/pages/Install';
import Chat from '@/pages/dashboard/Chat';
import Overview from '@/pages/dashboard/Overview';
import VoiceChat from '@/pages/dashboard/VoiceChat';
import History from '@/pages/dashboard/History';
import CreativeEngine from '@/pages/dashboard/CreativeEngine';
import CreativeCarousel from '@/pages/dashboard/CreativeCarousel';
import ProfileAnalysis from '@/pages/dashboard/ProfileAnalysis';
import VideoGenerator from '@/pages/dashboard/VideoGenerator';
import VideoAddons from '@/pages/dashboard/VideoAddons';
import Settings from '@/pages/dashboard/Settings';
import UserContexts from '@/pages/dashboard/UserContexts';
import Pricing from '@/pages/dashboard/Pricing';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminAgents from '@/pages/admin/AdminAgents';
import AdminLogs from '@/pages/admin/AdminLogs';
import AdminSettings from '@/pages/admin/AdminSettings';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/install" element={<Install />} />

          {/* App Routes - Requires Authentication */}
          <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Overview />} />
            <Route path="chat" element={<Chat />} />
            <Route path="voice-chat" element={<VoiceChat />} />
            <Route path="history" element={<History />} />
            <Route path="creative-engine" element={<CreativeEngine />} />
            <Route path="carousel" element={<CreativeCarousel />} />
            <Route path="profile-analysis" element={<ProfileAnalysis />} />
            <Route path="video-generator" element={<VideoGenerator />} />
            <Route path="video-addons" element={<VideoAddons />} />
            <Route path="contexts" element={<UserContexts />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Admin Routes - Requires Admin Role */}
          <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="agents" element={<AdminAgents />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Redirect to Home if no route matches */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;