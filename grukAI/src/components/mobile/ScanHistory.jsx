import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { auth, db } from '../../lib/firestore'

function ScanHistory() {
  const [user, setUser] = useState(null)
  const [scanHistory, setScanHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, recyclable, non-recyclable
  const [sortBy, setSortBy] = useState('newest') // newest, oldest, points

  // Mock data for demonstration (replace with Firebase data)
  const mockScanHistory = [
    {
      id: 1,
      item: 'Plastic Water Bottle',
      category: 'Plastic',
      result: 'recyclable',
      confidence: 95,
      points: 50,
      timestamp: new Date('2025-09-27T10:30:00'),
      image: null,
      tips: 'Remove cap and label before recycling',
      location: 'New York City, NY'
    },
    {
      id: 2,
      item: 'Pizza Box',
      category: 'Cardboard',
      result: 'non-recyclable',
      confidence: 88,
      points: 0,
      timestamp: new Date('2025-09-26T15:45:00'),
      image: null,
      tips: 'Grease-stained cardboard cannot be recycled',
      location: 'New York City, NY'
    },
    {
      id: 3,
      item: 'Aluminum Can',
      category: 'Metal',
      result: 'recyclable',
      confidence: 98,
      points: 75,
      timestamp: new Date('2025-09-25T09:15:00'),
      image: null,
      tips: 'Rinse clean and crush to save space',
      location: 'New York City, NY'
    },
    {
      id: 4,
      item: 'Glass Jar',
      category: 'Glass',
      result: 'recyclable',
      confidence: 92,
      points: 60,
      timestamp: new Date('2025-09-24T14:20:00'),
      image: null,
      tips: 'Remove lid and rinse before recycling',
      location: 'New York City, NY'
    },
    {
      id: 5,
      item: 'Styrofoam Container',
      category: 'Polystyrene',
      result: 'non-recyclable',
      confidence: 97,
      points: 0,
      timestamp: new Date('2025-09-23T12:10:00'),
      image: null,
      tips: 'Most recycling centers do not accept styrofoam',
      location: 'New York City, NY'
    },
    {
      id: 6,
      item: 'Newspaper',
      category: 'Paper',
      result: 'recyclable',
      confidence: 99,
      points: 40,
      timestamp: new Date('2025-09-22T08:30:00'),
      image: null,
      tips: 'Keep dry and bundle for easier recycling',
      location: 'New York City, NY'
    }
  ]

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        // fetchScanHistory(firebaseUser.uid)
        // For now, use mock data
        setScanHistory(mockScanHistory)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Future function to fetch real scan history from Firebase
  const fetchScanHistory = async (userId) => {
    try {
      const scansRef = collection(db, 'scanHistory')
      const q = query(
        scansRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      )
      const querySnapshot = await getDocs(q)
      const scans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate()
      }))
      setScanHistory(scans)
    } catch (error) {
      console.error('Error fetching scan history:', error)
      setScanHistory(mockScanHistory) // Fallback to mock data
    }
  }

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
    return result === 'recyclable' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
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

  const totalScans = scanHistory.length
  const recyclableScans = scanHistory.filter(scan => scan.result === 'recyclable').length
  const totalPointsEarned = scanHistory.reduce((sum, scan) => sum + scan.points, 0)
  const filteredScans = getFilteredAndSortedScans()

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">📸</div>
          <h2 className="text-xl font-bold text-emerald-900 mb-2">Loading Scan History...</h2>
          <p className="text-emerald-700">Fetching your scanning data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 pb-20">
      {/* Header */}
      <div className="bg-emerald-100/80 backdrop-blur-md border-b border-emerald-200/40 p-4">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Scan History</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/30 shadow-sm text-center">
            <div className="text-2xl mb-2">📊</div>
            <p className="text-2xl font-bold text-emerald-900">{totalScans}</p>
            <p className="text-sm text-emerald-700">Total Scans</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/30 shadow-sm text-center">
            <div className="text-2xl mb-2">♻️</div>
            <p className="text-2xl font-bold text-green-600">{recyclableScans}</p>
            <p className="text-sm text-emerald-700">Recyclable</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/30 shadow-sm text-center">
            <div className="text-2xl mb-2">⭐</div>
            <p className="text-2xl font-bold text-yellow-600">{totalPointsEarned}</p>
            <p className="text-sm text-emerald-700">Points Earned</p>
          </div>
        </div>

        {/* Filter and Sort Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/30 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-emerald-800 mb-2">Filter by Result</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 text-emerald-900"
              >
                <option value="all">All Results</option>
                <option value="recyclable">Recyclable Only</option>
                <option value="non-recyclable">Non-Recyclable Only</option>
              </select>
            </div>
            
            {/* Sort */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-emerald-800 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 text-emerald-900"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="points">Highest Points</option>
              </select>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {filteredScans.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200/30 shadow-sm text-center">
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-emerald-900 mb-2">No Scans Yet</h3>
              <p className="text-emerald-700">Start scanning items to see your history here!</p>
            </div>
          ) : (
            filteredScans.map((scan) => (
              <div
                key={scan.id}
                className={`bg-white/80 backdrop-blur-sm rounded-2xl p-4 border shadow-sm transform hover:scale-[1.02] transition-all duration-300 ${getResultBg(scan.result)}`}
              >
                <div className="flex items-start gap-4">
                  {/* Category Icon */}
                  <div className="text-3xl">{getCategoryIcon(scan.category)}</div>
                  
                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-emerald-900 text-lg">{scan.item}</h4>
                        <p className="text-emerald-700/80 text-sm">{scan.category}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{getResultIcon(scan.result)}</span>
                          <span className={`font-bold text-sm ${getResultColor(scan.result)}`}>
                            {scan.result.charAt(0).toUpperCase() + scan.result.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-600">{scan.confidence}% confident</p>
                      </div>
                    </div>

                    {/* Points and Date */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className="text-yellow-600 font-bold text-sm">
                          {scan.points > 0 ? `+${scan.points}` : scan.points} points
                        </span>
                        <span className="text-emerald-600/70 text-xs">
                          📍 {scan.location}
                        </span>
                      </div>
                      <span className="text-emerald-600/70 text-xs">
                        {formatDate(scan.timestamp)}
                      </span>
                    </div>

                    {/* Tips */}
                    {scan.tips && (
                      <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-200/50">
                        <p className="text-emerald-800 text-sm flex items-start gap-2">
                          <span className="text-lg">💡</span>
                          <span>{scan.tips}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary Footer */}
        {filteredScans.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/30 shadow-sm text-center">
            <p className="text-emerald-700">
              Showing <span className="font-bold text-emerald-900">{filteredScans.length}</span> of{' '}
              <span className="font-bold text-emerald-900">{totalScans}</span> scans
            </p>
            <p className="text-emerald-600/80 text-sm mt-1">
              Keep scanning to earn more points and help the environment! 🌱
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScanHistory