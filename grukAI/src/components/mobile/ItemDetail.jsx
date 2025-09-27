import { motion } from "framer-motion";
import { ArrowBack } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

function ItemDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state?.item;

  if (!item) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-4">The item details could not be loaded.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <motion.div 
        className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3"
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
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {item.object}
        </h1>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <motion.div
          className="p-6 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Item Image */}
          <div className="relative">
            <img
              src={item.croppedImage || item.image_url}
              alt={item.object}
              className="w-full h-64 rounded-2xl object-cover shadow-lg border border-gray-200"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23f3f4f6"/><text x="128" y="140" text-anchor="middle" fill="%236b7280" font-size="24">📦</text></svg>';
              }}
            />
            {/* Success badge */}
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              ✓ Detected
            </div>
          </div>

          {/* Item Info */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{item.object}</h2>
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                Material: {item.material}
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🌱</span>
                <span className="font-semibold text-green-800">CO₂ Impact</span>
              </div>
              <p className="text-green-900 font-bold text-2xl">{item.co2value}</p>
              <p className="text-green-700 text-sm mt-1">Environmental impact</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⭐</span>
                <span className="font-semibold text-blue-800">Points</span>
              </div>
              <p className="text-blue-900 font-bold text-2xl">+{item.points_earned}</p>
              <p className="text-blue-700 text-sm mt-1">Points earned</p>
            </div>
          </div>

          {/* Disposal Instructions */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">♻️</span>
              <h3 className="text-xl font-bold text-gray-900">How to Dispose</h3>
            </div>
            <p className="text-gray-800 leading-relaxed text-base">
              {item.disposal_instructions}
            </p>
          </div>

          {/* Environmental Impact */}
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🌍</span>
              <h3 className="text-xl font-bold text-amber-800">Environmental Impact</h3>
            </div>
            <p className="text-amber-900 leading-relaxed text-base">
              {item.description || item.description_info}
            </p>
          </div>

          {/* Back Button */}
          <div className="flex justify-center pt-4 pb-8">
            <button
              onClick={handleBack}
              className="px-8 py-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors active:scale-95"
            >
              Back to Results
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ItemDetail;