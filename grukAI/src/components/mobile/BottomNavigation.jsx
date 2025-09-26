import { useNavigate, useLocation } from 'react-router-dom'
import DashboardIcon from '@mui/icons-material/Dashboard'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import LeaderboardIcon from '@mui/icons-material/Leaderboard'
import MapIcon from '@mui/icons-material/Map'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'

function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { path: '/map', icon: MapIcon, label: 'Map' },
    { path: '/camera', icon: CameraAltIcon, label: 'Camera', isCenter: true },
    { path: '/leaderboard', icon: LeaderboardIcon, label: 'Leaderboard' },
    { path: '/shop', icon: ShoppingCartIcon, label: 'Shop' }
  ]

  return (
    <div className="fixed z-50 w-full h-16 max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-4 left-1/2 shadow-lg">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto">
        {navItems.map(({ path, icon: Icon, label, isCenter }, index) => {
          const isActive = location.pathname === path
          
          if (isCenter) {
            // Center camera button
            return (
              <div key={path} className="flex items-center justify-center">
                <button
                  onClick={() => navigate(path)}
                  className={`inline-flex items-center justify-center w-10 h-10 font-medium rounded-full group focus:ring-4 focus:outline-none transition-colors ${
                    isActive 
                      ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-300' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-300'
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="sr-only">{label}</span>
                </button>
              </div>
            )
          }

          // Regular nav buttons
          const roundedClass = index === 0 ? 'rounded-s-full' : index === 4 ? 'rounded-e-full' : ''
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 group transition-colors ${roundedClass}`}
            >
              <Icon className={`w-5 h-5 mb-1 transition-colors ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 group-hover:text-blue-600'
              }`} />
              <span className="sr-only">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default BottomNavigation