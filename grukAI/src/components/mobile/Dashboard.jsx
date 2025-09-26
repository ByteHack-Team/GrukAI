import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../lib/firestore" // adjust if your firebase export path differs

function Dashboard() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [userPoints, setUserPoints] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [animateXP, setAnimateXP] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fetch auth state + user profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))
          if (userDoc.exists()) {
            const data = userDoc.data()
            setUserData(data)
            setUserPoints(data.totalPoints || 0)
            setUserLevel(data.level || 1)
          }
        } catch (err) {
          console.error("Error fetching user data:", err)
        }
      } else {
        setUser(null)
        setUserData(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // XP logic
  const xpForNextLevel = userLevel * 1000
  const xpProgress = userPoints % 1000
  const xpPercentage = (xpProgress / 1000) * 100

  // Animate XP bar
  useEffect(() => {
    const timer = setTimeout(() => setAnimateXP(true), 300)
    return () => clearTimeout(timer)
  }, [])

  // Mock facilities (keep as-is)
  const nearbyFacilities = [
    {
      id: 1,
      name: "GreenPoint Recycling Center",
      type: "Recycling Center",
      distance: "0.8 miles",
      address: "123 Green Street, San Francisco, CA",
      icon: "♻️",
    },
    {
      id: 2,
      name: "EcoWaste Drop-off",
      type: "Drop-off Point",
      distance: "1.2 miles",
      address: "456 Earth Ave, San Francisco, CA",
      icon: "🗂️",
    },
    {
      id: 3,
      name: "Ocean Cleanup Station",
      type: "Cleanup Center",
      distance: "2.1 miles",
      address: "789 Ocean Blvd, San Francisco, CA",
      icon: "🌊",
    },
  ]

  const openInGoogleMaps = (facility) => {
    const query = encodeURIComponent(`${facility.name}, ${facility.address}`)
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`
    window.open(url, "_blank")
  }

  if (loading) {
    return <div className="p-6 text-emerald-700">Loading dashboard...</div>
  }

  if (!user || !userData) {
    return <div className="p-6 text-red-600">Please sign in to view your dashboard.</div>
  }

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
              {userData.profileImage || "👤"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-900 animate-fade-in">
                Welcome back, {userData.name || user.displayName || "User"}! 👋
              </h2>
              <p className="text-emerald-700/80 text-sm">
                {userData.streak || 0} day streak • {userPoints} points earned
              </p>
              <p className="text-emerald-600/70 text-xs flex items-center gap-1 mt-1">
                📍 {userData.city || "Unknown"}, {userData.location || ""}
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
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                Level {userLevel}
              </div>
              <div className="text-emerald-800">
                <p className="font-semibold text-lg">{userPoints.toLocaleString()} Points</p>
                <p className="text-sm text-emerald-600">
                  {(1000 - xpProgress).toLocaleString()} points to level {userLevel + 1}
                </p>
              </div>
            </div>
            <div className="text-3xl animate-bounce">⭐</div>
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
                  animateXP ? "animate-pulse" : ""
                }`}
                style={{
                  width: animateXP ? `${xpPercentage}%` : "0%",
                }}
              >
                {xpPercentage > 15 && (
                  <span className="text-white text-xs font-bold">{Math.round(xpPercentage)}%</span>
                )}
              </div>
            </div>
            <div className="text-center text-sm text-emerald-600 mt-2">
              {xpProgress}/{1000} Points
            </div>
          </div>
        </div>

        {/* Nearby Facilities Section (kept static for now) */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-emerald-900">Nearby Facilities</h3>
            <div className="text-2xl">🗺️</div>
          </div>

          <div className="space-y-3">
            {nearbyFacilities.map((facility) => (
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
        </div>
      </div>
    </div>
  )
}

export default Dashboard
