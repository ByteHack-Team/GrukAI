import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import BottomNavigation from './components/mobile/BottomNavigation'
import Dashboard from './components/mobile/Dashboard'
import CameraApp from './components/mobile/CameraApp'
import Leaderboard from './components/mobile/Leaderboard'
import Map from './components/mobile/Map'
import Shop from './components/mobile/Shop'
import LoginPage from './pages/LoginPage'
import ItemDetail from './components/mobile/ItemDetail'
import ScanHistory from './components/mobile/ScanHistory'
import ScanDetail from './components/mobile/ScanDetail'
import './App.css'

function AppContent() {
  const location = useLocation()
  const isLoginPage = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-none">
      <div className="w-full min-h-screen bg-white max-w-none">        
        <main className={isLoginPage ? "w-full max-w-none" : "pb-20 w-full max-w-none"}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/camera" element={<CameraApp />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/map" element={<Map />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/item-detail" element={<ItemDetail />} />
            <Route path="/scan-history" element={<ScanHistory />} />
            <Route path="/scan-detail" element={<ScanDetail />} />
          </Routes>
        </main>
      </div>
      
      {!isLoginPage && <BottomNavigation />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App