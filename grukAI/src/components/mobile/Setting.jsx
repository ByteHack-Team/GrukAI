import { useState } from 'react'

function Setting({ isOpen, onClose, userData, onUpdateUserData, onLogout }) {
  const [formData, setFormData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    city: userData?.city || '',
    location: userData?.location || '',
    shareLocation: userData?.shareLocation || true
  })
  const [isEditing, setIsEditing] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  if (!isOpen) return null

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    onUpdateUserData(formData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: userData?.name || '',
      email: userData?.email || '',
      city: userData?.city || '',
      location: userData?.location || '',
      shareLocation: userData?.shareLocation || true
    })
    setIsEditing(false)
  }

  const handleLogout = () => {
    onLogout()
    setShowLogoutConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-emerald-200/30">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-emerald-200/30">
          <h2 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
            <span>⚙️</span>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 flex items-center justify-center transition-colors duration-200"
          >
            <span className="text-emerald-700">✕</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
              <span>👤</span>
              Profile Information
            </h3>
            
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 transition-all duration-200"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-200/50 text-emerald-900">
                    {formData.name || 'Not set'}
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 transition-all duration-200"
                    placeholder="Enter your email"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-200/50 text-emerald-900">
                    {formData.email || 'Not set'}
                  </div>
                )}
              </div>

              {/* City Field */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  City
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 transition-all duration-200"
                    placeholder="Enter your city"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-200/50 text-emerald-900">
                    {formData.city || 'Not set'}
                  </div>
                )}
              </div>

              {/* Location Field */}
              <div>
                <label className="block text-sm font-medium text-emerald-800 mb-2">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white/80 transition-all duration-200"
                    placeholder="Enter your location (e.g., California, USA)"
                  />
                ) : (
                  <div className="px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-200/50 text-emerald-900">
                    {formData.location || 'Not set'}
                  </div>
                )}
              </div>

              {/* Edit/Save/Cancel Buttons */}
              <div className="flex gap-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <span>✏️</span>
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <span>💾</span>
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <span>❌</span>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
              <span>🔒</span>
              Privacy Settings
            </h3>
            
            {/* Location Sharing Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/50">
              <div className="flex-1">
                <h4 className="font-medium text-emerald-900">Share Location</h4>
                <p className="text-sm text-emerald-700/80">
                  Allow the app to access your location for nearby facilities
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.shareLocation}
                  onChange={(e) => handleInputChange('shareLocation', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* Account Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
              <span>🔑</span>
              Account
            </h3>
            
            {/* Logout Button */}
            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>🚪</span>
                Log Out
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <h4 className="font-medium text-red-900 mb-2">Are you sure you want to log out?</h4>
                  <p className="text-sm text-red-700">You will need to sign in again to access your account.</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    Yes, Log Out
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <span>❌</span>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* App Info */}
          <div className="pt-4 border-t border-emerald-200/30">
            <div className="text-center text-sm text-emerald-600/80">
              <p>GrukAI App v1.0.0</p>
              <p>© 2025 GrukAI. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Setting