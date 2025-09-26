import { useState, useEffect } from 'react'

function CityLeaderBoard() {
  const [animateCards, setAnimateCards] = useState(false)

  // Mock city leaderboard data based on environmental health metrics
  const topCities = [
    {
      id: 1,
      rank: 1,
      name: "Reykjavik",
      country: "Iceland",
      flag: "🇮🇸",
      healthScore: 98.5,
      population: "131k",
      airQuality: 95,
      recyclingRate: 89,
      greenSpaces: 92,
      renewableEnergy: 100,
      carbonFootprint: 2.1, // tons CO2 per capita
      initiatives: ["100% Renewable Energy", "Carbon Neutral by 2040"]
    },
    {
      id: 2,
      rank: 2,
      name: "Zurich",
      country: "Switzerland",
      flag: "🇨🇭",
      healthScore: 96.8,
      population: "434k",
      airQuality: 91,
      recyclingRate: 94,
      greenSpaces: 88,
      renewableEnergy: 85,
      carbonFootprint: 3.2,
      initiatives: ["Smart City Initiative", "Zero Waste Program"]
    },
    {
      id: 3,
      rank: 3,
      name: "Copenhagen",
      country: "Denmark",
      flag: "🇩🇰",
      healthScore: 95.2,
      population: "660k",
      airQuality: 89,
      recyclingRate: 91,
      greenSpaces: 95,
      renewableEnergy: 80,
      carbonFootprint: 3.8,
      initiatives: ["Bike-Friendly City", "Green Rooftops Program"]
    },
    {
      id: 4,
      rank: 4,
      name: "Vancouver",
      country: "Canada",
      flag: "🇨🇦",
      healthScore: 93.7,
      population: "695k",
      airQuality: 87,
      recyclingRate: 85,
      greenSpaces: 89,
      renewableEnergy: 95,
      carbonFootprint: 4.1,
      initiatives: ["Greenest City Action Plan", "Electric Vehicle Incentives"]
    },
    {
      id: 5,
      rank: 5,
      name: "San Francisco",
      country: "USA",
      flag: "🇺🇸",
      healthScore: 91.4,
      population: "875k",
      airQuality: 78,
      recyclingRate: 88,
      greenSpaces: 82,
      renewableEnergy: 75,
      carbonFootprint: 5.2,
      initiatives: ["Zero Waste Goal", "Clean Energy SF"],
      isUserCity: true
    },
    {
      id: 6,
      rank: 6,
      name: "Stockholm",
      country: "Sweden",
      flag: "🇸🇪",
      healthScore: 90.8,
      population: "975k",
      airQuality: 85,
      recyclingRate: 87,
      greenSpaces: 86,
      renewableEnergy: 88,
      carbonFootprint: 3.9,
      initiatives: ["Fossil Fuel Free by 2050", "Smart Waste Management"]
    },
    {
      id: 7,
      rank: 7,
      name: "Amsterdam",
      country: "Netherlands",
      flag: "🇳🇱",
      healthScore: 89.3,
      population: "905k",
      airQuality: 82,
      recyclingRate: 83,
      greenSpaces: 84,
      renewableEnergy: 70,
      carbonFootprint: 4.7,
      initiatives: ["Circular Economy", "Car-Free City Center"]
    },
    {
      id: 8,
      rank: 8,
      name: "Portland",
      country: "USA",
      flag: "🇺🇸",
      healthScore: 88.1,
      population: "652k",
      airQuality: 79,
      recyclingRate: 86,
      greenSpaces: 91,
      renewableEnergy: 68,
      carbonFootprint: 5.8,
      initiatives: ["Climate Action Plan", "Urban Forest Initiative"]
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

  const getRankStyle = (rank, isUserCity) => {
    if (isUserCity) {
      return "bg-emerald-100/90 backdrop-blur-sm text-emerald-900 border-2 border-emerald-300 transform scale-[1.02] shadow-xl"
    }
    
    switch(rank) {
      case 1: return "bg-gradient-to-br from-amber-50 to-yellow-100/80 backdrop-blur-sm text-gray-900 border-2 border-amber-200 shadow-xl hover:shadow-2xl"
      case 2: return "bg-gradient-to-br from-gray-50 to-slate-100/80 backdrop-blur-sm text-gray-900 border-2 border-slate-300 shadow-lg hover:shadow-xl"
      case 3: return "bg-gradient-to-br from-orange-50 to-orange-100/80 backdrop-blur-sm text-gray-900 border-2 border-orange-200 shadow-lg hover:shadow-xl"
      default: return "bg-white/90 backdrop-blur-sm text-emerald-900 border border-emerald-200/40 shadow-sm hover:shadow-md"
    }
  }

  const getHealthScoreColor = (score) => {
    if (score >= 95) return "text-green-600"
    if (score >= 90) return "text-emerald-600"
    if (score >= 85) return "text-yellow-600"
    return "text-orange-600"
  }

  return (
    <div className="p-4 space-y-4">
      {/* User's City Highlight */}
      <div className="bg-emerald-100/50 backdrop-blur-sm rounded-2xl p-4 border-2 border-emerald-300/50 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-emerald-800">Your City</h3>
          <span className="text-xs text-emerald-600">Help make it greener! 🌱</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-2xl">#5</div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">San Francisco ranked #5</p>
            <p className="text-xs text-emerald-700">91.4/100 health score</p>
          </div>
        </div>
      </div>

      {/* Top Cities List */}
      <div className="space-y-3">
        {topCities.map((city, index) => (
          <div
            key={city.id}
            className={`rounded-2xl p-4 border transform transition-all duration-700 hover:scale-[1.03] hover:-translate-y-1 relative ${
              getRankStyle(city.rank, city.isUserCity)
            } ${
              animateCards ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            } ${
              city.rank <= 3 ? 'hover:rotate-1 hover:shadow-2xl' : ''
            }`}
            style={{ 
              transitionDelay: `${index * 150}ms`,
              transformOrigin: 'center'
            }}
          >
            {/* City Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold transition-all duration-300 ${
                  city.rank <= 3 ? 'transform hover:scale-125 hover:rotate-12' : ''
                }`}>
                  {getRankIcon(city.rank)}
                </div>
                <div className={`text-3xl transition-all duration-300 ${
                  city.rank <= 3 ? 'transform hover:scale-110 hover:rotate-6' : ''
                }`}>
                  {city.flag}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    {city.name}
                    {city.isUserCity && <span className="text-sm animate-pulse">🏠</span>}
                  </h3>
                  <p className="text-sm opacity-70">{city.country} • {city.population} people</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-bold text-xl transition-all duration-300 ${getHealthScoreColor(city.healthScore)} ${
                  city.rank <= 3 ? 'hover:scale-110' : ''
                }`}>
                  {city.healthScore}
                </div>
                <div className="text-xs opacity-70">Health Score</div>
              </div>
            </div>

            {/* Environmental Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Air Quality:</span>
                <span className="font-semibold">{city.airQuality}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Recycling:</span>
                <span className="font-semibold">{city.recyclingRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Green Spaces:</span>
                <span className="font-semibold">{city.greenSpaces}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Renewable:</span>
                <span className="font-semibold">{city.renewableEnergy}%</span>
              </div>
            </div>

            {/* Carbon Footprint */}
            <div className="flex justify-between items-center mb-3 p-2 bg-black/5 rounded-lg">
              <span className="text-sm opacity-70">Carbon Footprint:</span>
              <span className="font-semibold text-sm">{city.carbonFootprint} tons CO₂/person</span>
            </div>

            {/* Initiatives */}
            <div className="space-y-1">
              <div className="text-xs opacity-70">Key Initiatives:</div>
              <div className="flex flex-wrap gap-1">
                {city.initiatives.map((initiative, idx) => (
                  <span 
                    key={idx}
                    className="text-xs bg-black/8 hover:bg-black/12 px-2 py-1 rounded-full transition-colors duration-200"
                  >
                    {initiative}
                  </span>
                ))}
              </div>
            </div>

            {/* Rank badges for top 3 */}
            {city.rank <= 3 && (
              <div className="absolute top-3 right-3 text-2xl animate-pulse hover:animate-spin transition-all duration-500">
                ✨
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-emerald-50/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/30">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📊</span>
          <h3 className="font-semibold text-emerald-900">Health Score Factors</h3>
        </div>
        <div className="text-xs text-emerald-700 space-y-1">
          <p>• <strong>Air Quality:</strong> PM2.5, NO₂, and ozone levels</p>
          <p>• <strong>Recycling Rate:</strong> Municipal waste recycling percentage</p>
          <p>• <strong>Green Spaces:</strong> Parks and nature per capita</p>
          <p>• <strong>Renewable Energy:</strong> Clean energy adoption</p>
          <p>• <strong>Carbon Footprint:</strong> CO₂ emissions per person</p>
        </div>
      </div>

      {/* Load More Button */}
      <div className="text-center pt-4">
        <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
          View Global Rankings
        </button>
      </div>
    </div>
  )
}

export default CityLeaderBoard
