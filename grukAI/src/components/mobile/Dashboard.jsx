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
  const [isScanHistoryModalOpen, setIsScanHistoryModalOpen] = useState(false)
  const [selectedScanItem, setSelectedScanItem] = useState(null)
  const [isScanResultModalOpen, setIsScanResultModalOpen] = useState(false)
  const [isScanSectionExpanded, setIsScanSectionExpanded] = useState(false)
  const [nearbyFacilities, setNearbyFacilities] = useState([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scanHistory, setScanHistory] = useState([])

  // Mock scan history data
  const mockScanHistory = [
    {
      id: 1,
      imageUrl: '/path/to/plastic-bottle-image.jpg',
      response: {
        item: 'Plastic Water Bottle',
        category: 'Plastic',
        confidence: 95,
        disposalInstructions: 'Remove cap and label, rinse container clean, then place in recycling bin. Check local recycling guidelines for specific requirements.',
        description: 'This plastic item can be processed through recycling facilities to create new products and reduce environmental waste.',
        points: 50
      },
      timestamp: new Date('2025-09-27T10:30:00'),
      userId: 'user123',
      scanResult: 'recyclable'
    },
    {
      id: 2,
      imageUrl: '/path/to/pizza-box-image.jpg',
      response: {
        item: 'Pizza Box',
        category: 'Cardboard',
        confidence: 88,
        disposalInstructions: 'Remove any remaining food debris. Grease-stained portions should be torn off and placed in compost. Clean sections can be recycled.',
        description: 'This cardboard item should be disposed of in regular trash as it cannot be processed through standard recycling methods.',
        points: 0
      },
      timestamp: new Date('2025-09-26T15:45:00'),
      userId: 'user123',
      scanResult: 'non-recyclable'
    },
    {
      id: 3,
      imageUrl: '/path/to/aluminum-can-image.jpg',
      response: {
        item: 'Aluminum Can',
        category: 'Metal',
        confidence: 98,
        disposalInstructions: 'Rinse clean to remove any residue, crush to save space, then place in metal recycling bin. No need to remove labels.',
        description: 'This metal item can be processed through recycling facilities to create new products and reduce environmental waste.',
        points: 75
      },
      timestamp: new Date('2025-09-25T09:15:00'),
      userId: 'user123',
      scanResult: 'recyclable'
    },
    {
      id: 4,
      imageUrl: '/path/to/glass-jar-image.jpg',
      response: {
        item: 'Glass Jar',
        category: 'Glass',
        confidence: 92,
        disposalInstructions: 'Remove metal lid and rinse jar thoroughly. Labels can remain attached. Place in glass recycling container.',
        description: 'This glass item can be processed through recycling facilities to create new products and reduce environmental waste.',
        points: 60
      },
      timestamp: new Date('2025-09-24T14:20:00'),
      userId: 'user123',
      scanResult: 'recyclable'
    },
    {
      id: 5,
      imageUrl: '/path/to/styrofoam-container-image.jpg',
      response: {
        item: 'Styrofoam Container',
        category: 'Polystyrene',
        confidence: 97,
        disposalInstructions: 'Clean container of food residue and place in regular trash bin. Consider reusing for storage or craft projects before disposal.',
        description: 'This polystyrene item should be disposed of in regular trash as it cannot be processed through standard recycling methods.',
        points: 0
      },
      timestamp: new Date('2025-09-23T12:10:00'),
      userId: 'user123',
      scanResult: 'non-recyclable'
    },
    {
      id: 6,
      imageUrl: '/path/to/newspaper-image.jpg',
      response: {
        item: 'Newspaper',
        category: 'Paper',
        confidence: 99,
        disposalInstructions: 'Ensure paper is dry and free from food contamination. Remove any plastic bags or rubber bands, then bundle or place loose in paper recycling.',
        description: 'This paper item can be processed through recycling facilities to create new products and reduce environmental waste.',
        points: 40
      },
      timestamp: new Date('2025-09-22T08:30:00'),
      userId: 'user123',
      scanResult: 'recyclable'
    }
  ]

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
              city: data.city || "New York City",
              location: data.location || "New York, USA",
              shareLocation: data.shareLocation !== undefined ? data.shareLocation : true
            })
            setUserPoints(data.totalPoints || 0)
            setUserLevel(data.level || 1)
            setScanHistory(mockScanHistory) // Load mock scan history
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
        address: "123 Green Street, New York, NY",
        icon: "♻️",
        coordinates: "40.7749,-73.9194"
      },
      {
        id: 2,
        name: "EcoWaste Drop-off",
        type: "Drop-off Point",
        distance: "1.2 miles", 
        address: "456 Earth Ave, New York, NY",
        icon: "🗂️",
        coordinates: "40.7849,-73.9094"
      },
      {
        id: 3,
        name: "Hudson River Cleanup Station",
        type: "Cleanup Center",
        distance: "2.1 miles",
        address: "789 River Blvd, New York, NY", 
        icon: "🌊",
        coordinates: "40.7649,-73.9294"
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

  // Helper functions for scan history
  const formatDate = (date) => {
    const now = new Date()
    const scanDate = new Date(date)
    const diffTime = Math.abs(now - scanDate)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    return scanDate.toLocaleDateString()
  }

  const getResultIcon = (result) => {
    return result === 'recyclable' ? '♻️' : '🗑️'
  }

  const getResultColor = (result) => {
    return result === 'recyclable' ? 'text-green-600' : 'text-red-600'
  }

  const getResultBg = (result) => {
    return result === 'recyclable' ? 'bg-green-50/50 border-green-200/50' : 'bg-red-50/50 border-red-200/50'
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Plastic': '🥤',
      'Cardboard': '📦',
      'Metal': '🥫',
      'Glass': '🍯',
      'Paper': '📰',
      'Polystyrene': '📦'
    }
    return icons[category] || '📋'
  }

  // Handle clicking on a scan item
  const handleScanItemClick = (scan) => {
    setSelectedScanItem(scan)
    setIsScanResultModalOpen(true)
  }

  // Scan Result Modal Component (mimics camera app result)
  const ScanResultModal = ({ isOpen, onClose, scanItem }) => {
    if (!isOpen || !scanItem) return null

    const isRecyclable = scanItem.scanResult === 'recyclable'

    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl border border-emerald-200/30">
          {/* Header */}
          <div className="relative">
            <div className={`p-6 text-center ${isRecyclable ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white`}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
              >
                <span className="text-white">✕</span>
              </button>
              
              <div className="text-6xl mb-4">{getCategoryIcon(scanItem.response.category)}</div>
              <h2 className="text-2xl font-bold mb-2">{scanItem.response.item}</h2>
              <p className="text-white/90 text-sm">{scanItem.response.category}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Result Status */}
            <div className="text-center">
              <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl font-bold text-lg ${
                isRecyclable 
                  ? 'bg-green-100 text-green-800 border-2 border-green-200' 
                  : 'bg-red-100 text-red-800 border-2 border-red-200'
              }`}>
                <span className="text-2xl">{getResultIcon(scanItem.scanResult)}</span>
                <span>{isRecyclable ? 'RECYCLABLE' : 'NON-RECYCLABLE'}</span>
              </div>
            </div>

            {/* Points Earned */}
            <div className="flex items-center justify-center gap-3 bg-yellow-50/50 rounded-xl p-4 border border-yellow-200/30">
              <span className="text-3xl">⭐</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {scanItem.response.points > 0 ? `+${scanItem.response.points}` : '0'}
                </p>
                <p className="text-yellow-600 text-sm">Points Earned</p>
              </div>
            </div>

            {/* Scan Details */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-emerald-200/30">
                <span className="text-emerald-700 font-medium">Scanned On</span>
                <span className="text-emerald-900 font-semibold">{formatDate(scanItem.timestamp)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-emerald-200/30">
                <span className="text-emerald-700 font-medium">Category</span>
                <span className="text-emerald-900 font-semibold">{scanItem.response.category}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-emerald-700 font-medium">Material Type</span>
                <span className="text-emerald-900 font-semibold">{scanItem.response.item}</span>
              </div>
            </div>

            {/* Disposal Instructions */}
            {scanItem.response.disposalInstructions && (
              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/30">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span>�</span>
                  Disposal Instructions
                </h4>
                <p className="text-blue-800 text-sm leading-relaxed mb-3">{scanItem.response.disposalInstructions}</p>
                <div className="bg-blue-100/50 rounded-lg p-3 border border-blue-200/30">
                  <p className="text-blue-800 text-xs leading-relaxed">
                    <strong>Description:</strong> {scanItem.response.description}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>✓</span>
                Got it!
              </button>
              <button
                onClick={() => {
                  // Add share functionality here
                  console.log('Sharing scan result:', scanItem)
                }}
                className="px-4 py-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>📤</span>
                Share
              </button>
            </div>

            {/* Environmental Impact */}
            <div className={`rounded-xl p-4 border-2 ${
              isRecyclable 
                ? 'bg-green-50/50 border-green-200/50' 
                : 'bg-orange-50/50 border-orange-200/50'
            }`}>
              <div className="text-center">
                <div className="text-2xl mb-2">{isRecyclable ? '🌱' : '🌍'}</div>
                <p className={`text-sm font-medium ${
                  isRecyclable ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {isRecyclable 
                    ? 'Great job! Recycling this item helps reduce waste and protect our environment.'
                    : 'This item cannot be recycled, but proper disposal still helps keep our environment clean.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Scan History Modal Component
  const ScanHistoryModal = ({ isOpen, onClose, scanHistory }) => {
    const [filter, setFilter] = useState('all')
    const [sortBy, setSortBy] = useState('newest')

    if (!isOpen) return null

    // Filter and sort scans
    const getFilteredAndSortedScans = () => {
      let filtered = scanHistory

      // Apply filter
      if (filter === 'recyclable') {
        filtered = filtered.filter(scan => scan.result === 'recyclable')
      } else if (filter === 'non-recyclable') {
        filtered = filtered.filter(scan => scan.result === 'non-recyclable')
      }

      // Apply sort
      switch (sortBy) {
        case 'oldest':
          filtered = [...filtered].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          break
        case 'points':
          filtered = [...filtered].sort((a, b) => b.points - a.points)
          break
        case 'newest':
        default:
          filtered = [...filtered].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          break
      }

      return filtered
    }

    const filteredScans = getFilteredAndSortedScans()
    const totalScans = scanHistory.length
    const recyclableScans = scanHistory.filter(scan => scan.result === 'recyclable').length
    const totalPointsEarned = scanHistory.reduce((sum, scan) => sum + scan.points, 0)

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-emerald-200/30">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-emerald-200/30">
            <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
              <span>📸</span>
              Complete Scan History
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors duration-200"
            >
              <span className="text-emerald-700">✕</span>
            </button>
          </div>

          <div className="overflow-y-auto max-h-[75vh]">
            {/* Stats Section */}
            <div className="p-6 pb-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-emerald-50/50 rounded-xl p-4 text-center border border-emerald-200/30">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="text-xl font-bold text-emerald-900">{totalScans}</p>
                  <p className="text-sm text-emerald-700">Total Scans</p>
                </div>
                <div className="bg-green-50/50 rounded-xl p-4 text-center border border-green-200/30">
                  <div className="text-2xl mb-2">♻️</div>
                  <p className="text-xl font-bold text-green-600">{recyclableScans}</p>
                  <p className="text-sm text-emerald-700">Recyclable</p>
                </div>
                <div className="bg-yellow-50/50 rounded-xl p-4 text-center border border-yellow-200/30">
                  <div className="text-2xl mb-2">⭐</div>
                  <p className="text-xl font-bold text-yellow-600">{totalPointsEarned}</p>
                  <p className="text-sm text-emerald-700">Points Earned</p>
                </div>
              </div>

              {/* Filter and Sort */}
              <div className="flex gap-4 mb-4">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 text-emerald-900 text-sm"
                >
                  <option value="all">All Results</option>
                  <option value="recyclable">Recyclable Only</option>
                  <option value="non-recyclable">Non-Recyclable Only</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 text-emerald-900 text-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="points">Highest Points</option>
                </select>
              </div>
            </div>

            {/* Scan List */}
            <div className="px-6 pb-6 space-y-3">
              {filteredScans.map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => handleScanItemClick(scan)}
                  className={`rounded-xl p-4 border transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-md ${getResultBg(scan.result)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getCategoryIcon(scan.category)}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-emerald-900">{scan.item}</h4>
                          <p className="text-emerald-700/80 text-sm">{scan.category}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{getResultIcon(scan.result)}</span>
                            <span className={`font-bold text-sm ${getResultColor(scan.result)}`}>
                              {scan.result === 'recyclable' ? 'Recyclable' : 'Non-Recyclable'}
                            </span>
                          </div>
                          <p className="text-xs text-emerald-600">{scan.confidence}% confident</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-yellow-600 font-bold text-sm">
                          {scan.points > 0 ? `+${scan.points}` : scan.points} points
                        </span>
                        <span className="text-emerald-600/70 text-xs">
                          {formatDate(scan.timestamp)}
                        </span>
                      </div>

                      {scan.tips && (
                        <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-200/50">
                          <p className="text-emerald-800 text-sm flex items-start gap-2">
                            <span>💡</span>
                            <span>{scan.tips}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="text-center pt-4 border-t border-emerald-200/30">
                <p className="text-emerald-700">
                  Showing <span className="font-bold text-emerald-900">{filteredScans.length}</span> of{' '}
                  <span className="font-bold text-emerald-900">{totalScans}</span> scans
                </p>
                <p className="text-emerald-600/80 text-sm mt-1">
                  Keep scanning to earn more points and help the environment! 🌱
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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

        {/* Recent Scan History Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-emerald-200/30 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-emerald-900">Latest Scans</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsScanSectionExpanded(!isScanSectionExpanded)}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
              >
                <span className="text-sm font-medium">
                  {isScanSectionExpanded ? 'Show Less' : 'Show All'}
                </span>
                <div className={`transform transition-transform duration-300 text-lg ${
                  isScanSectionExpanded ? 'rotate-180' : ''
                }`}>
                  ▼
                </div>
              </button>
              <button
                onClick={() => setIsScanHistoryModalOpen(true)}
                className="text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
                title="Open full history modal"
              >
                <div className="text-2xl">📸</div>
              </button>
            </div>
          </div>

          {scanHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">📸</div>
              <h4 className="text-lg font-bold text-emerald-900 mb-2">No Scans Yet</h4>
              <p className="text-emerald-700">Start scanning items to see your history here!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.slice(0, isScanSectionExpanded ? scanHistory.length : 3).map((scan) => (
                <div
                  key={scan.id}
                  onClick={() => handleScanItemClick(scan)}
                  className={`rounded-xl p-4 border transition-all duration-300 hover:shadow-md cursor-pointer transform hover:scale-[1.02] ${getResultBg(scan.scanResult)}`}
                >
                  <div className="flex items-start gap-3">
                    {/* Category Icon */}
                    <div className="text-2xl">{getCategoryIcon(scan.response.category)}</div>
                    
                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-emerald-900">{scan.response.item}</h4>
                          <p className="text-emerald-700/80 text-sm">{scan.response.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getResultIcon(scan.scanResult)}</span>
                          <span className={`font-bold text-sm ${getResultColor(scan.scanResult)}`}>
                            {scan.scanResult === 'recyclable' ? 'Recyclable' : 'Non-Recyclable'}
                          </span>
                        </div>
                      </div>

                      {/* Points and Date */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-yellow-600 font-bold text-sm">
                          {scan.response.points > 0 ? `+${scan.response.points}` : scan.response.points} points
                        </span>
                        <span className="text-emerald-600/70 text-xs">
                          {formatDate(scan.timestamp)}
                        </span>
                      </div>

                      {/* Tips */}
                      {scan.response.disposalInstructions && (
                        <div className="bg-emerald-50/50 rounded-lg p-2 border border-emerald-200/50">
                          <p className="text-emerald-800 text-xs flex items-start gap-2">
                            <span>�</span>
                            <span>{scan.response.disposalInstructions}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* View All Button - only show when not expanded and there are more than 3 items */}
              {!isScanSectionExpanded && scanHistory.length > 3 && (
                <button 
                  onClick={() => setIsScanHistoryModalOpen(true)}
                  className="w-full mt-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <span>📋</span>
                  View All Scan History ({scanHistory.length} total)
                </button>
              )}
              
              {/* Summary when expanded */}
              {isScanSectionExpanded && scanHistory.length > 3 && (
                <div className="text-center pt-4 border-t border-emerald-200/30 mt-4">
                  <p className="text-emerald-700 text-sm">
                    Showing all <span className="font-bold text-emerald-900">{scanHistory.length}</span> scans
                  </p>
                  <p className="text-emerald-600/80 text-xs mt-1">
                    {scanHistory.filter(scan => scan.scanResult === 'recyclable').length} recyclable items found 🌱
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nearby Facilities Section */}
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

      {/* Scan History Modal */}
      <ScanHistoryModal
        isOpen={isScanHistoryModalOpen}
        onClose={() => setIsScanHistoryModalOpen(false)}
        scanHistory={scanHistory}
      />

      {/* Scan Result Modal */}
      <ScanResultModal
        isOpen={isScanResultModalOpen}
        onClose={() => setIsScanResultModalOpen(false)}
        scanItem={selectedScanItem}
      />
    </div>
  )
}

export default Dashboard
