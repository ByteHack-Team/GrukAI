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
    <div className="fixed z-50 w-full h-16 bg-emerald-50/90 backdrop-blur-md border-t border-emerald-200/30 bottom-0 left-0 shadow-lg">
      <div className="grid h-full grid-cols-5 w-full px-4">
        {navItems.map(({ path, icon: Icon, label, isCenter }, index) => {
          const isActive = location.pathname === path
          
          if (isCenter) {
            return (
              <div key={path} className="flex items-center justify-center">
                <button
                  onClick={() => navigate(path)}
                  className={`inline-flex items-center justify-center w-12 h-12 font-medium rounded-full group focus:ring-4 focus:outline-none transition-colors ${
                    isActive 
                      ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-300' 
                      : 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-300'
                  }`}
                >
                  <Icon className="w-6 h-6 text-white" />
                  <span className="sr-only">{label}</span>
                </button>
              </div>
            )
          }
          
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="inline-flex flex-col items-center justify-center px-2 hover:bg-emerald-100/50 group transition-colors"
            >
              <Icon className={`w-5 h-5 mb-1 transition-colors ${
                isActive 
                  ? 'text-emerald-600' 
                  : 'text-emerald-500/70 group-hover:text-emerald-600'
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