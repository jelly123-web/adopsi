import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import ManageUsers from './pages/ManageUsers'
import ManageAnimals from './pages/ManageAnimals'
import ManageCategories from './pages/ManageCategories'
import ManageAdoptions from './pages/ManageAdoptions'
import Reports from './pages/Reports'
import PengaturanSistem from './pages/PengaturanSistem'
import Profile from './pages/Profile'
import QuestionnaireCharacter from './pages/QuestionnaireCharacter'
import Restore from './pages/Restore'
import HistoryLogs from './pages/HistoryLogs'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/users" element={<ManageUsers />} />
        <Route path="/dashboard/categories" element={<ManageCategories />} />
        <Route path="/dashboard/animals" element={<ManageAnimals />} />
        <Route path="/dashboard/adoptions" element={<ManageAdoptions />} />
        <Route path="/dashboard/reports" element={<Reports />} />
        <Route path="/dashboard/logs" element={<HistoryLogs />} />
        <Route path="/dashboard/settings" element={<PengaturanSistem />} />
        <Route path="/dashboard/profile" element={<Profile />} />
        <Route path="/dashboard/questionnaire-character" element={<QuestionnaireCharacter />} />
        <Route path="/dashboard/restore" element={<Restore />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
