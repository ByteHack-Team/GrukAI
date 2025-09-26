import { useState } from 'react'
import UserLeaderBoard from './UserLeaderBoard'
import CityLeaderBoard from './City LeaderBoard'

function Leaderboard() {
  const [activeTab, setActiveTab] = useState('users') // 'users' or 'cities'

  return (
    <div className="min-h-screen bg-emerald-50/30 pb-20">
      {/* Header */}
      <div className="bg-emerald-100/80 backdrop-blur-md border-b border-emerald-200/40 p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-emerald-900 mb-4">Leaderboard</h1>
        
        {/* Tab Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-lg transform scale-105'
                : 'bg-white/80 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            🏆 Top Users
          </button>
          <button
            onClick={() => setActiveTab('cities')}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeTab === 'cities'
                ? 'bg-emerald-600 text-white shadow-lg transform scale-105'
                : 'bg-white/80 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            🌍 Healthiest Cities
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'users' ? <UserLeaderBoard /> : <CityLeaderBoard />}
      </div>
    </div>
  )
}

export default Leaderboard