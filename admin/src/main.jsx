import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './admin.css'

import { AuthProvider } from './AuthContext.jsx'
import { ToastProvider } from './components/Toast.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import HomeManager from './pages/HomeManager.jsx'
import SessionsManager from './pages/SessionsManager.jsx'
import PrivatePremiumManager from './pages/PrivatePremiumManager.jsx'
import TeamManager from './pages/TeamManager.jsx'
import GalleryManager from './pages/GalleryManager.jsx'
import PhotosManager from './pages/PhotosManager.jsx'
import AboutManager from './pages/AboutManager.jsx'
import BookingsManager from './pages/BookingsManager.jsx'
import PaymentsManager from './pages/PaymentsManager.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/home" element={<HomeManager />} />
                <Route path="/sessions" element={<SessionsManager />} />
                <Route path="/private-premium" element={<PrivatePremiumManager />} />
                <Route path="/team" element={<TeamManager />} />
                <Route path="/gallery" element={<GalleryManager />} />
                <Route path="/photos" element={<PhotosManager />} />
                <Route path="/about" element={<AboutManager />} />
                <Route path="/bookings" element={<BookingsManager />} />
                <Route path="/payments" element={<PaymentsManager />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
