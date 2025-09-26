'use client'

import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '../../lib/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import ShopPopUp from './ShopPopUp'

function Shop() {
  const [currentUserUid, setCurrentUserUid] = useState(null)
  const [user, setUser] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUserUid(user.uid)
      else setCurrentUserUid(null)
    })
    return () => unsubscribe()
  }, [])

  // Fetch user points from Firestore
  useEffect(() => {
    if (!currentUserUid) return

    const fetchUser = async () => {
      try {
        const userRef = doc(db, 'users', currentUserUid)
        const snap = await getDoc(userRef)
        if (snap.exists()) setUser(snap.data())
        else setUser({ points: 0, uid: currentUserUid })
      } catch (err) {
        console.error('Error fetching user:', err)
        setUser({ points: 0, uid: currentUserUid })
      }
    }

    fetchUser()
  }, [currentUserUid])

  // Shop items
  const shopItems = [
    { id: 1, name: 'HydroFlask Water Bottle', description: 'Reusable aesthetic water bottle in pastel colors', points: 450, category: 'Everyday Aesthetic', image: '🌊' },
    { id: 2, name: 'Stojo Collapsible Cup', description: 'Collapsible silicone cup for on-the-go', points: 280, category: 'Everyday Aesthetic', image: '☕' },
    { id: 3, name: 'Eco Sticker Pack', description: 'Cute eco-themed stickers from recycled materials', points: 120, category: 'Everyday Aesthetic', image: '🌿' },
    { id: 4, name: 'Biodegradable Phone Grip', description: 'PopSocket-style grip made from biodegradable materials', points: 180, category: 'Everyday Aesthetic', image: '📱' },
    { id: 5, name: 'Bamboo Cutlery Kit', description: 'Bamboo utensils with cute carrying pouch', points: 220, category: 'Everyday Aesthetic', image: '🥢' },
    { id: 6, name: 'Sustainable Tote Bag', description: 'Organic cotton tote with minimalist or meme prints', points: 200, category: 'Everyday Aesthetic', image: '🛍️' },
    { id: 7, name: 'Eco Spotify Playlist', description: 'Curated eco-awareness themed playlist drop', points: 50, category: 'Digital & Lifestyle', image: '🎵' },
    { id: 8, name: 'Eco Brand Discount', description: 'Discount codes for thrifted fits & eco skincare', points: 150, category: 'Digital & Lifestyle', image: '💚' },
    { id: 9, name: 'Carbon Offset Credits', description: 'Plant a tree or support clean energy in your name', points: 300, category: 'Digital & Lifestyle', image: '🌳' },
    { id: 10, name: 'Pela Eco Phone Case', description: 'Compostable phone case in pastel tones', points: 320, category: 'Digital & Lifestyle', image: '📱' },
    { id: 11, name: 'Digital Eco Badge', description: 'Collectible badges to flex sustainability achievements', points: 80, category: 'Digital & Lifestyle', image: '🏅' },
    { id: 12, name: 'Bamboo Toothbrush Set', description: 'Multipack of bamboo toothbrushes in pastel shades', points: 160, category: 'Personal Care', image: '🦷' },
    { id: 13, name: 'Solid Shampoo Bar', description: 'Colorful Lush-style shampoo and conditioner bars', points: 190, category: 'Personal Care', image: '🧴' },
    { id: 14, name: 'Reusable Makeup Pads', description: 'Cotton makeup remover pads with cute storage case', points: 140, category: 'Personal Care', image: '💄' },
    { id: 15, name: 'Eco Skincare Sampler', description: 'Natural face masks and cruelty-free minis', points: 250, category: 'Personal Care', image: '✨' },
    { id: 16, name: 'Essential Oil Roller', description: 'Aromatherapy stress relief roller, eco-sourced', points: 180, category: 'Personal Care', image: '🌸' },
    { id: 17, name: 'Bike Share Credits', description: 'Credits for sustainable city bike or scooter travel', points: 400, category: 'Lifestyle & Mobility', image: '🚲' },
    { id: 18, name: 'Reusable Coffee Sleeve', description: 'Cute printed sleeve that attaches to backpacks', points: 110, category: 'Lifestyle & Mobility', image: '☕' },
    { id: 19, name: 'Pocket Reusable Bag', description: 'Foldable bag that fits on keychain, colorful design', points: 90, category: 'Lifestyle & Mobility', image: '🗝️' },
    { id: 20, name: 'Solar Phone Charger', description: 'Mini solar-powered keychain charger', points: 380, category: 'Lifestyle & Mobility', image: '☀️' },
    { id: 21, name: 'Eco Profile Skin', description: 'Exclusive eco-themed avatar and profile customization', points: 100, category: 'Digital & Lifestyle', image: '🎨' },
    { id: 22, name: 'Plant Certificate', description: 'Digital tree planting certificate (shareable on socials)', points: 200, category: 'Digital & Lifestyle', image: '🌱' },
    { id: 23, name: 'Aesthetic Journal', description: 'Eco-friendly planner with aesthetic design', points: 270, category: 'Everyday Aesthetic', image: '📔' }
  ]

  const categories = ['All', ...new Set(shopItems.map(item => item.category))]
  const [selectedCategory, setSelectedCategory] = useState('All')
  const filteredItems = selectedCategory === 'All'
    ? shopItems
    : shopItems.filter(item => item.category === selectedCategory)

  const handleRedeem = (item) => {
    if (!user) return
    if (user.points >= item.points) {
      setSelectedItem(item)
      setIsPopupOpen(true)
    } else {
      alert(`Not enough points! You need ${item.points - user.points} more points.`)
    }
  }

  const handleRedeemConfirm = async (item) => {
    if (!user) return
    const newPoints = user.points - item.points
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, { points: newPoints })
      setUser(prev => ({ ...prev, points: newPoints }))
      console.log('Redemption successful:', { item, user })
    } catch (err) {
      console.error('Error updating points:', err)
      alert('Failed to redeem item. Try again.')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-emerald-900 font-semibold">
        Loading...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-emerald-50/30 pb-20">
      {/* Header */}
      <div className="bg-emerald-100/80 backdrop-blur-md border-b border-emerald-200/40 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-emerald-900">Shop</h1>
          <div className="bg-emerald-600 text-white px-4 py-2 rounded-full">
            <span className="font-semibold">{user.points} Points</span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white/80 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Shop Items Grid */}
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-200/30 shadow-sm max-w-full">
              <div className="flex items-start gap-3 mb-4">
                <div className="text-3xl flex-shrink-0">{item.image}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-emerald-900 text-base sm:text-lg mb-1">{item.name}</h3>
                  <p className="text-emerald-700/80 text-sm mb-2 leading-relaxed">{item.description}</p>
                  <span className="inline-block bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium">
                    {item.category}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4">
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-emerald-600 font-bold text-lg">{item.points}</span>
                  <span className="text-emerald-600 text-sm">points</span>
                </div>
                <button
                  onClick={() => handleRedeem(item)}
                  disabled={user.points < item.points}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                    user.points >= item.points
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {user.points >= item.points ? 'Redeem' : 'Need More'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Redemption Popup */}
      <ShopPopUp
        item={selectedItem}
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false)
          setSelectedItem(null)
        }}
        onRedeem={() => selectedItem && handleRedeemConfirm(selectedItem)}
        user={user}
      />
    </div>
  )
}

export default Shop
