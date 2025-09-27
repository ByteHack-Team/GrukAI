import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowBack, LocationOn, CalendarToday, History } from "@mui/icons-material";
import { CircularProgress, Skeleton } from "@mui/material";
import { auth, getUserScanHistory } from "../../lib/firestore";

function ScanHistory() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadScanHistory();
  }, []);

  const loadScanHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in to view scan history");
        return;
      }

      setLoading(true);
      const history = await getUserScanHistory(user.uid);
      setScans(history);
    } catch (err) {
      console.error("Failed to load scan history:", err);
      // Better error handling - check if it's actually an error or just empty
      if (err.message && (err.message.includes('permission') || err.message.includes('index'))) {
        setError(`Database error: ${err.message}`);
      } else {
        // If it's just empty or other issues, don't show error
        setScans([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const scanDate = new Date(date);
    const diffMs = now - scanDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return scanDate.toLocaleDateString();
    }
  };

  const formatLocation = (location) => {
    if (!location) return "Location not available";
    return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
  };

  const handleScanClick = (scan) => {
    navigate('/scan-detail', { state: { scan } });
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowBack className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Scan History</h1>
        </div>

        {/* Loading Content */}
        <div className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <Skeleton variant="rectangular" width={80} height={80} className="rounded-lg" />
                <div className="flex-1">
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={20} className="mt-2" />
                  <Skeleton variant="text" width="50%" height={16} className="mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <History className="text-red-400 text-6xl mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Database Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadScanHistory}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Better empty state with helpful messaging
  if (scans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowBack className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Scan History</h1>
        </div>

        {/* Better Empty State */}
        <div className="flex-1 flex items-center justify-center p-6 min-h-[calc(100vh-120px)]">
          <div className="text-center max-w-sm">
            <div className="relative mb-6">
              <History className="text-gray-300 text-8xl mb-2" />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-lg">📷</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">No Scans Yet!</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              You haven't scanned any items yet. Start by scanning waste items to build your history and earn points!
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/camera')}
                className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="text-xl">📷</span>
                Start Your First Scan
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
            <div className="mt-6 text-xs text-gray-500">
              💡 Tip: Scan plastic bottles, cans, or paper items to get started!
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div 
        className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowBack className="text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Scan History</h1>
        <div className="ml-auto text-sm text-gray-500">
          {scans.length} scan{scans.length !== 1 ? 's' : ''}
        </div>
      </motion.div>

      {/* Better scrolling with proper padding */}
      <motion.div 
        className="p-4 space-y-4 pb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        style={{ minHeight: 'calc(100vh - 80px)' }}
      >
        {scans.map((scan, index) => (
          <motion.div
            key={scan.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200"
            onClick={() => handleScanClick(scan)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <div className="flex items-center gap-4">
              {/* Scan Image */}
              <div className="relative flex-shrink-0">
                <img
                  src={scan.imageUrl}
                  alt={scan.type === 'multiple' ? `${scan.totalItems} items` : scan.object}
                  className="w-20 h-20 rounded-lg object-cover shadow-md border border-gray-200"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f3f4f6"/><text x="40" y="45" text-anchor="middle" fill="%236b7280" font-size="12">📸</text></svg>';
                  }}
                />
                {scan.type === 'multiple' && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{scan.totalItems}</span>
                  </div>
                )}
              </div>

              {/* Scan Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {scan.type === 'multiple' 
                    ? `${scan.totalItems} Items Detected` 
                    : scan.object
                  }
                </h3>
                
                <div className="flex items-center gap-2 mt-1">
                  <CalendarToday className="text-gray-400" fontSize="small" />
                  <span className="text-sm text-gray-600">{formatDate(scan.createdAt)}</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <LocationOn className="text-gray-400" fontSize="small" />
                  <span className="text-sm text-gray-600">{formatLocation(scan.location)}</span>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    +{scan.type === 'multiple' ? scan.totalPoints : scan.pointsEarned} pts
                  </span>
                  {scan.type === 'single' && (
                    <span className="text-xs text-gray-500">{scan.material}</span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

export default ScanHistory;