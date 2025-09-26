import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "../../lib/firestore" // adjust if your firebase export path differs
import Setting from './Setting'

function Dashboard() {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    profileImage: "👤",
    totalPoints: 0,
    streak: 0,
    city: "",
    location: "",
    shareLocation: true
  })
  const [userPoints, setUserPoints] = useState(0)
  const [userLevel, setUserLevel] = useState(1)
  const [animateXP, setAnimateXP] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [nearbyFacilities, setNearbyFacilities] = useState([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
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
            setUserData({
              name: data.name || firebaseUser.displayName || "User",
              email: data.email || firebaseUser.email || "",
              profileImage: "👤",
              totalPoints: data.totalPoints || 0,
              streak: data.streak || 0,
              city: data.city || "San Francisco",
              location: data.location || "California, USA",
              shareLocation: data.shareLocation !== undefined ? data.shareLocation : true
            })
            setUserPoints(data.totalPoints || 0)
            setUserLevel(data.level || 1)
          }
        } catch (err) {
          console.error("Error fetching user data:", err)
        }
      } else {
        setUser(null)
        setUserData({
          name: "",
          email: "",
          profileImage: "👤",
          totalPoints: 0,
          streak: 0,
          city: "",
          location: "",
          shareLocation: true
        })
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // XP logic
  const xpForNextLevel = userLevel * 1000
  const xpProgress = userPoints % 1000
  const xpPercentage = (xpProgress / 1000) * 100

  // Google Maps API key - using VITE prefix for Vite projects
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  // Function to get user's current location
  const getCurrentLocation = () => {
    setIsLoadingLocation(true)
    setLocationError(null)

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.')
      setIsLoadingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        searchNearbyFacilities(latitude, longitude)
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location.'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.'
            break
          default:
            errorMessage = 'An unknown error occurred.'
            break
        }
        setLocationError(errorMessage)
        setIsLoadingLocation(false)
        // Load mock data as fallback
        loadMockFacilities()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  // Function to search nearby recycling facilities using Google Places API
  const searchNearbyFacilities = async (lat, lng) => {
    try {
      const service = new window.google.maps.places.PlacesService(
        document.createElement('div')
      )

      const request = {
        location: new window.google.maps.LatLng(lat, lng),
        radius: 10000, // 10km radius
        keyword: 'recycling center waste management environmental facility',
        type: 'establishment'
      }

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const facilities = results.slice(0, 5).map((place, index) => {
            const distance = calculateDistance(lat, lng, place.geometry.location.lat(), place.geometry.location.lng())
            
            return {
              id: place.place_id || index,
              name: place.name,
              type: getFacilityType(place.types),
              distance: `${distance.toFixed(1)} miles`,
              address: place.vicinity || place.formatted_address || 'Address not available',
              icon: getFacilityIcon(place.types),
              coordinates: `${place.geometry.location.lat()},${place.geometry.location.lng()}`,
              rating: place.rating,
              photos: place.photos
            }
          })
          
          setNearbyFacilities(facilities)
        } else {
          console.warn('Places search failed:', status)
          // Load mock data as fallback
          loadMockFacilities()
        }
        setIsLoadingLocation(false)
      })
    } catch (error) {
      console.error('Error searching nearby facilities:', error)
      loadMockFacilities()
      setIsLoadingLocation(false)
    }
  }

  // Fallback mock data
  const loadMockFacilities = () => {
    setNearbyFacilities([
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
    ])
  }

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Helper function to determine facility type from Google Places types
  const getFacilityType = (types) => {
    if (types.includes('recycling_center')) return 'Recycling Center'
    if (types.includes('waste_management')) return 'Waste Management'
    if (types.includes('local_government_office')) return 'Government Facility'
    if (types.includes('store')) return 'Drop-off Point'
    return 'Environmental Facility'
  }

  // Helper function to get appropriate icon based on facility type
  const getFacilityIcon = (types) => {
    if (types.includes('recycling_center')) return '♻️'
    if (types.includes('waste_management')) return '🗂️'
    if (types.includes('local_government_office')) return '🏛️'
    if (types.includes('store')) return '🏪'
    if (types.includes('gas_station')) return '⛽'
    return '🌱'
  }

  const openInGoogleMaps = (facility) => {
    const query = encodeURIComponent(`${facility.name}, ${facility.address}`)
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`
    window.open(url, "_blank")
  }

  // Animate XP bar on mount and load facilities
  useEffect(() => {
    const timer = setTimeout(() => setAnimateXP(true), 300)
    
    // Only load facilities after userData is loaded
    if (!loading && userData) {
      // Load Google Maps API and get current location
      if (userData.shareLocation && !window.google) {
        loadGoogleMapsAPI()
      } else if (userData.shareLocation && window.google) {
        getCurrentLocation()
      } else {
        loadMockFacilities()
      }
    }
    
    return () => clearTimeout(timer)
  }, [userData?.shareLocation, loading])

  // Function to load Google Maps API
  const loadGoogleMapsAPI = () => {
    if (window.google) {
      getCurrentLocation()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      getCurrentLocation()
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps API')
      loadMockFacilities()
    }
    document.head.appendChild(script)
  }

  // Handle user data updates from settings
  const handleUpdateUserData = (newData) => {
    setUserData(prev => ({
      ...prev,
      ...newData,
      totalPoints: userPoints // Keep points in sync
    }))
    
    // If location sharing setting changed, update facilities
    if (newData.shareLocation !== undefined && newData.shareLocation !== userData.shareLocation) {
      if (newData.shareLocation) {
        getCurrentLocation()
      } else {
        loadMockFacilities()
      }
    }
  }

  // Handle logout
  const handleLogout = () => {
    // Add logout logic here (e.g., clear localStorage, redirect to login)
    console.log('Logging out...')
    // Example: localStorage.removeItem('authToken')
    // Example: navigate('/login')
  }

  // Show loading state while fetching user data
  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🌱</div>
          <h2 className="text-xl font-bold text-emerald-900 mb-2">Loading Dashboard...</h2>
          <p className="text-emerald-700">Getting your data ready</p>
        </div>
      </div>
    )
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
              {userData?.profileImage || "👤"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-900 animate-fade-in">
                Welcome back, {userData?.name || user?.displayName || "User"}! 👋
              </h2>
              <p className="text-emerald-700/80 text-sm">
                {userData?.streak || 0} day streak • {userPoints} points earned
              </p>
              <p className="text-emerald-600/70 text-xs flex items-center gap-1 mt-1">
                📍 {userData?.city || "Unknown"}, {userData?.location || ""}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
            >
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
            <button
              onClick={userData?.shareLocation ? getCurrentLocation : loadMockFacilities}
              disabled={isLoadingLocation}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isLoadingLocation 
                  ? 'bg-emerald-200 cursor-not-allowed' 
                  : 'bg-emerald-100 hover:bg-emerald-200 cursor-pointer'
              }`}
              title="Refresh locations"
            >
              <span className={`text-emerald-700 ${isLoadingLocation ? 'animate-spin' : ''}`}>
                🔄
              </span>
            </button>
          </div>

          {/* Loading State */}
          {isLoadingLocation && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-2">🌍</div>
                <p className="text-emerald-700 font-medium">Finding nearby facilities...</p>
                <p className="text-emerald-600 text-sm">Using your location to find the best options</p>
              </div>
            </div>
          )}

          {/* Facilities List */}
          {!isLoadingLocation && (
            <>
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
                        {facility.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-yellow-500">⭐</span>
                            <span className="text-emerald-600 text-xs">{facility.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 text-xs">View on Map</span>
                      <div className="text-emerald-600">📍</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button              onClick={() => {
                const query = encodeURIComponent(`recycling centers near ${userData?.city || 'your location'}, ${userData?.location || ''}`)
                const url = `https://www.google.com/maps/search/?api=1&query=${query}`
                window.open(url, '_blank')
              }}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>🔍</span>
                Find More Facilities
              </button>
            </>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      <Setting
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userData={userData}
        onUpdateUserData={handleUpdateUserData}
        onLogout={handleLogout}
      />
    </div>
  )
}

export default Dashboard
