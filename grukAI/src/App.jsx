import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import BottomNavigation from './components/mobile/BottomNavigation'
import Dashboard from './components/mobile/Dashboard'
import CameraApp from './components/mobile/CameraApp'
import Leaderboard from './components/mobile/Leaderboard'
import Map from './components/mobile/Map'
import Shop from './components/mobile/Shop'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 w-full">
        <div className="w-full min-h-screen bg-white">
          <header className="bg-blue-500 text-white p-4 w-full">
            <h1 className="text-xl font-bold">GrukAI Mobile</h1>
          </header>
          
          <main className="pb-20 w-full">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/camera" element={<CameraApp />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/map" element={<Map />} />
              <Route path="/shop" element={<Shop />} />
            </Routes>
          </main>
        </div>
        
        <BottomNavigation />
      </div>
    </Router>
  )
}

export default App