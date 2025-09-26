import { useState, useEffect } from 'react'

function UserLeaderBoard() {
  const [animateCards, setAnimateCards] = useState(false)

  // Mock user leaderboard data
  const topUsers = [
    {
      id: 1,
      rank: 1,
      name: "EcoWarrior_2025",
      avatar: "🌟",
      points: 15420,
      city: "San Francisco, CA",
      itemsScanned: 847,
      streak: 43,
      isCurrentUser: false
    },
    {
      id: 2,
      rank: 2,
      name: "GreenGuru",
      avatar: "🌱",
      points: 14250,
      city: "Portland, OR",
      itemsScanned: 692,
      streak: 38,
      isCurrentUser: false
    },
    {
      id: 3,
      rank: 3,
      name: "RecycleRanger",
      avatar: "♻️",
      points: 13980,
      city: "Seattle, WA",
      itemsScanned: 756,
      streak: 35,
      isCurrentUser: false
    },
    {
      id: 4,
      rank: 4,
      name: "Alex Chen", // Current user
      avatar: "👤",
      points: 12750,
      city: "San Francisco, CA",
      itemsScanned: 483,
      streak: 7,
      isCurrentUser: true
    },
    {
      id: 5,
      rank: 5,
      name: "EarthProtector",
      avatar: "🌍",
      points: 11890,
      city: "Austin, TX",
      itemsScanned: 534,
      streak: 28,
      isCurrentUser: false
    },
    {
      id: 6,
      rank: 6,
      name: "CleanEnergy",
      avatar: "⚡",
      points: 11200,
      city: "Denver, CO",
      itemsScanned: 445,
      streak: 22,
      isCurrentUser: false
    },
    {
      id: 7,
      rank: 7,
      name: "SustainableSam",
      avatar: "🌿",
      points: 10950,
      city: "Boulder, CO",
      itemsScanned: 398,
      streak: 31,
      isCurrentUser: false
    },
    {
      id: 8,
      rank: 8,
      name: "OceanCleanup",
      avatar: "🌊",
      points: 10400,
      city: "San Diego, CA",
      itemsScanned: 367,
      streak: 19,
      isCurrentUser: false
    }
  ]

  // Animate cards on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimateCards(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const getRankIcon = (rank) => {
    switch(rank) {
      case 1: return "🥇"
      case 2: return "🥈"
      case 3: return "🥉"
      default: return `#${rank}`
    }
  }

  const getRankStyle = (rank, isCurrentUser) => {
    if (isCurrentUser) {
      return "bg-emerald-100/90 backdrop-blur-sm text-emerald-900 border-2 border-emerald-300 transform scale-[1.02] shadow-xl"
    }
    
    switch(rank) {
      case 1: return "bg-gradient-to-br from-amber-50 to-yellow-100/80 backdrop-blur-sm text-gray-900 border-2 border-amber-200 shadow-xl hover:shadow-2xl"
      case 2: return "bg-gradient-to-br from-gray-50 to-slate-100/80 backdrop-blur-sm text-gray-900 border-2 border-slate-300 shadow-lg hover:shadow-xl"
      case 3: return "bg-gradient-to-br from-orange-50 to-orange-100/80 backdrop-blur-sm text-gray-900 border-2 border-orange-200 shadow-lg hover:shadow-xl"
      default: return "bg-white/90 backdrop-blur-sm text-emerald-900 border border-emerald-200/40 shadow-sm hover:shadow-md"
    }
  }

  return (
    <div className="p-3 sm:p-4 space-y-4 overflow-x-hidden max-w-full">
      {/* Current User Highlight */}
      <div className="bg-emerald-100/50 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border-2 border-emerald-300/50 shadow-sm max-w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-emerald-800">Your Position</h3>
          <span className="text-xs text-emerald-600 flex-shrink-0">Keep climbing! 🚀</span>
        </div>
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-2xl flex-shrink-0">#4</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-emerald-900">You're ranked #4</p>
            <p className="text-xs text-emerald-700">2,670 points behind #1</p>
          </div>
        </div>
      </div>

      {/* Top Users List */}
      <div className="space-y-3 max-w-full">
        {topUsers.map((user, index) => (
          <div
            key={user.id}
            className={`rounded-2xl p-3 sm:p-4 border transform transition-all duration-700 hover:scale-[1.03] hover:-translate-y-1 max-w-full overflow-hidden ${
              getRankStyle(user.rank, user.isCurrentUser)
            } ${
              animateCards ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            } ${
              user.rank <= 3 ? 'hover:rotate-1 hover:shadow-2xl' : ''
            }`}
            style={{ 
              transitionDelay: `${index * 150}ms`,
              transformOrigin: 'center'
            }}
          >
            {/* Rank Badge */}
            <div className="flex items-center justify-between mb-3 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className={`text-xl sm:text-2xl font-bold transition-all duration-300 flex-shrink-0 ${
                  user.rank <= 3 ? 'transform hover:scale-125 hover:rotate-12' : ''
                }`}>
                  {getRankIcon(user.rank)}
                </div>
                <div className={`text-2xl sm:text-3xl transition-all duration-300 flex-shrink-0 ${
                  user.rank <= 3 ? 'transform hover:scale-110 hover:rotate-6' : ''
                }`}>
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg flex items-center gap-2 truncate">
                    <span className="truncate">{user.name}</span>
                    {user.isCurrentUser && <span className="text-sm animate-pulse flex-shrink-0">👋</span>}
                  </h3>
                  <p className="text-xs sm:text-sm opacity-70 truncate">📍 {user.city}</p>
                </div>
              </div>
              
              {user.rank <= 3 && (
                <div className="text-xl sm:text-2xl animate-pulse hover:animate-spin transition-all duration-500 flex-shrink-0">
                  ✨
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
              <div className="text-center min-w-0">
                <div className="font-bold text-base sm:text-lg truncate">{user.points.toLocaleString()}</div>
                <div className="text-xs opacity-80">Points</div>
              </div>
              <div className="text-center min-w-0">
                <div className="font-bold text-base sm:text-lg">{user.itemsScanned}</div>
                <div className="text-xs opacity-80">Items Scanned</div>
              </div>
              <div className="text-center min-w-0">
                <div className="font-bold text-base sm:text-lg">{user.streak}</div>
                <div className="text-xs opacity-80">Day Streak</div>
              </div>
            </div>

            {/* Progress to next rank (for current user) */}
            {user.isCurrentUser && user.rank > 1 && (
              <div className="mt-4 pt-3 border-t border-emerald-300/50">
                <div className="flex justify-between text-xs mb-1 opacity-80">
                  <span>Progress to #{user.rank - 1}</span>
                  <span>{topUsers.find(u => u.rank === user.rank - 1)?.points - user.points} points needed</span>
                </div>
                <div className="w-full bg-emerald-200/40 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-1500 ease-out"
                    style={{ 
                      width: animateCards ? '65%' : '0%' 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <div className="text-center pt-4">
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
          Load More Rankings
        </button>
      </div>
    </div>
  )
}

export default UserLeaderBoard
