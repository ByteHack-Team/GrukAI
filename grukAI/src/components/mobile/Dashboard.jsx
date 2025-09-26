import { useState, useEffect } from 'react'

function Dashboard() {
  const [userPoints, setUserPoints] = useState(1250) // Mock user points (same as XP)
  const [userLevel, setUserLevel] = useState(5)
  const [animateXP, setAnimateXP] = useState(false)

  // Calculate XP for current level (example: level * 1000 XP needed)
  const xpForNextLevel = userLevel * 1000
  const xpProgress = userPoints % 1000 // XP progress within current level
  const xpPercentage = (xpProgress / 1000) * 100

  // Mock user data
  const userData = {
    name: "Alex Chen",
    profileImage: "👤", // Could be replaced with actual image
    totalPoints: userPoints, // Points are the same as XP
    streak: 7,
    city: "San Francisco",
    location: "California, USA"
  }

  // Mock nearby facilities
  const nearbyFacilities = [
    {
      id: 1,
      name: "GreenPoint Recycling Center",
      type: "Recycling Center",
      distance: "0.8 miles",
      address: "123 Green Street, San Francisco, CA",
      icon: "♻️",
      coordinates: "37.7749,-122.4194"
    },
    {
      id: 2,
      name: "EcoWaste Drop-off",
      type: "Drop-off Point",
      distance: "1.2 miles", 
      address: "456 Earth Ave, San Francisco, CA",
      icon: "🗂️",
      coordinates: "37.7849,-122.4094"
    },
    {
      id: 3,
      name: "Ocean Cleanup Station",
      type: "Cleanup Center",
      distance: "2.1 miles",
      address: "789 Ocean Blvd, San Francisco, CA", 
      icon: "🌊",
      coordinates: "37.7649,-122.4294"
    }
  ]

  const openInGoogleMaps = (facility) => {
    const query = encodeURIComponent(`${facility.name}, ${facility.address}`)
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`
    window.open(url, '_blank')
  }

  // Animate XP bar on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateXP(true), 300)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-emerald-50/30 pb-20">
      {/* Header */}
      <div className="bg-emerald-100/80 backdrop-blur-md border-b border-emerald-200/40 p-4">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Dashboard</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* User Profile Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/30 shadow-sm transform hover:scale-[1.02] transition-all duration-300">
          {/* Profile Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl animate-pulse">
              {userData.profileImage}
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-900 animate-fade-in">
                Welcome back, {userData.name}! 👋
              </h2>
              <p className="text-emerald-700/80 text-sm">
                {userData.streak} day streak • {userData.totalPoints} points earned
              </p>
              <p className="text-emerald-600/70 text-xs flex items-center gap-1 mt-1">
                📍 {userData.city}, {userData.location}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2">
              <span>⚙️</span>
              Settings
            </button>
            <button className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2">
              <span>🏆</span>
              Rewards
            </button>
          </div>
        </div>

        {/* XP and Level Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/30 shadow-sm transform hover:scale-[1.02] transition-all duration-300">
          {/* Level Badge */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg transform hover:scale-110 transition-transform duration-300">
                Level {userLevel}
              </div>
              <div className="text-emerald-800">
                <p className="font-semibold text-lg">{userPoints.toLocaleString()} Points</p>
                <p className="text-sm text-emerald-600">
                  {(1000 - xpProgress).toLocaleString()} points to level {userLevel + 1}
                </p>
              </div>
            </div>
            <div className="text-3xl animate-bounce">
              ⭐
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-emerald-700">
              <span>Level {userLevel}</span>
              <span>Level {userLevel + 1}</span>
            </div>
            <div className="w-full bg-emerald-200/50 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className={`bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2 ${
                  animateXP ? 'animate-pulse' : ''
                }`}
                style={{ 
                  width: animateXP ? `${xpPercentage}%` : '0%'
                }}
              >
                {xpPercentage > 15 && (
                  <span className="text-white text-xs font-bold">
                    {Math.round(xpPercentage)}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-center text-sm text-emerald-600 mt-2">
              {xpProgress}/{1000} Points
            </div>
          </div>

          {/* XP Sources */}
          <div className="mt-4 pt-4 border-t border-emerald-200/50">
            <h3 className="text-sm font-semibold text-emerald-800 mb-2">Recent Point Gains</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700 flex items-center gap-2">
                  📸 <span>Scanned plastic bottle</span>
                </span>
                <span className="font-semibold text-emerald-600 animate-fade-in">+50 Points</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700 flex items-center gap-2">
                  🎯 <span>Daily challenge completed</span>
                </span>
                <span className="font-semibold text-emerald-600 animate-fade-in">+100 Points</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-emerald-700 flex items-center gap-2">
                  🔥 <span>7-day streak bonus</span>
                </span>
                <span className="font-semibold text-emerald-600 animate-fade-in">+200 Points</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nearby Facilities Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/30 shadow-sm transform hover:scale-[1.02] transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-emerald-900">Nearby Facilities</h3>
            <div className="text-2xl">🗺️</div>
          </div>
          
          <div className="space-y-3">
            {nearbyFacilities.map(facility => (
              <div 
                key={facility.id}
                onClick={() => openInGoogleMaps(facility)}
                className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/30 cursor-pointer hover:bg-emerald-100/50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{facility.icon}</div>
                  <div>
                    <h4 className="font-semibold text-emerald-900 text-sm">{facility.name}</h4>
                    <p className="text-emerald-700/80 text-xs">{facility.type}</p>
                    <p className="text-emerald-600/70 text-xs">{facility.distance} away</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-xs">View on Map</span>
                  <div className="text-emerald-600">📍</div>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => {
              const query = encodeURIComponent(`recycling centers near ${userData.city}, ${userData.location}`)
              const url = `https://www.google.com/maps/search/?api=1&query=${query}`
              window.open(url, '_blank')
            }}
            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
          >
            <span>🔍</span>
            Find More Facilities
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard