import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowBack, LocationOn, CalendarToday, Visibility } from "@mui/icons-material";
import { checkImageAccessibility, createCroppedImageCSS, createImageCropStyle } from "../../lib/firestore";

function ScanDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const scan = location.state?.scan;
  const [selectedItem, setSelectedItem] = useState(null);
  const [imageAccessible, setImageAccessible] = useState(true);
  const [checkingImage, setCheckingImage] = useState(true);

  useEffect(() => {
    if (scan?.imageUrl) {
      checkImageAccess();
    }
  }, [scan]);

  const checkImageAccess = async () => {
    try {
      console.log('Checking image accessibility:', scan.imageUrl);
      setCheckingImage(true);
      
      const accessible = await checkImageAccessibility(scan.imageUrl);
      setImageAccessible(accessible);
      
      console.log('Image accessible:', accessible);
    } catch (error) {
      console.error('Failed to check image accessibility:', error);
      setImageAccessible(false);
    } finally {
      setCheckingImage(false);
    }
  };

  const handleItemClick = (item, index) => {
    const itemWithImage = {
      ...item,
      index,
      // ✅ Try both cropping methods
      croppedImageStyle: item.bbox ? createCroppedImageCSS(scan.imageUrl, item.bbox) : null,
      croppedImageProps: item.bbox ? createImageCropStyle(scan.imageUrl, item.bbox) : null,
      object: item.object,
      material: item.material,
      disposalInstructions: item.disposalInstructions || item.disposal_instructions,
      description: item.description || item.description_info,
      pointsEarned: item.pointsEarned || item.points_earned,
      co2Value: item.co2Value || item.co2value
    };
    
    setSelectedItem(itemWithImage);
  };

  const formatStoredItems = (items) => {
    return items?.map(item => ({
      ...item,
      object: item.object,
      material: item.material,
      disposalInstructions: item.disposalInstructions || item.disposal_instructions,
      description: item.description || item.description_info,
      pointsEarned: item.pointsEarned || item.points_earned,
      co2Value: item.co2Value || item.co2value,
      bbox: item.bbox
    })) || [];
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const formatLocation = (location) => {
    if (!location) return "Location not available";
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const handleBack = () => {
    if (selectedItem !== null) {
      setSelectedItem(null);
    } else {
      navigate(-1);
    }
  };

  const handleViewOnMap = () => {
    if (scan.location) {
      sessionStorage.setItem('viewLocation', JSON.stringify({
        lat: scan.location.latitude,
        lng: scan.location.longitude
      }));
      navigate('/map');
    }
  };

  if (!scan) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Scan Not Found</h2>
          <p className="text-gray-600 mb-4">The scan details could not be loaded.</p>
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

  // Individual Item Detail View
  if (selectedItem) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <motion.div 
          className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowBack className="text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {selectedItem.object}
          </h1>
          <div className="ml-auto text-sm text-gray-500">
            Item {selectedItem.index + 1}
          </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto">
          <motion.div
            className="p-6 space-y-6 pb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Item Image */}
            <div className="relative">
              {selectedItem.croppedImageProps && imageAccessible ? (
                // ✅ Method 1: Use img element with object-fit and transform
                <div className="w-full h-64 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
                  <img
                    {...selectedItem.croppedImageProps}
                    alt={selectedItem.object}
                    className="w-full h-full"
                  />
                </div>
              ) : selectedItem.croppedImageStyle && imageAccessible ? (
                // ✅ Method 2: Use CSS background with clip-path
                <div
                  className="w-full h-64 rounded-2xl shadow-lg border border-gray-200"
                  style={selectedItem.croppedImageStyle}
                />
              ) : (
                // Fallback to original image
                <img
                  src={scan.imageUrl}
                  alt={selectedItem.object}
                  className="w-full h-64 rounded-2xl object-cover shadow-lg border border-gray-200"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="%23f3f4f6"/><text x="128" y="140" text-anchor="middle" fill="%236b7280" font-size="24">📦</text></svg>';
                  }}
                />
              )}
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                ✓ Item {selectedItem.index + 1}
              </div>
            </div>

            {/* Item Info - Rest remains the same */}
            <div className="bg-gray-50 rounded-2xl p-5">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedItem.object}</h2>
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Material: {selectedItem.material}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🌱</span>
                  <span className="font-semibold text-green-800">CO₂ Impact</span>
                </div>
                <p className="text-green-900 font-bold text-2xl">{selectedItem.co2Value}</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">⭐</span>
                  <span className="font-semibold text-blue-800">Points</span>
                </div>
                <p className="text-blue-900 font-bold text-2xl">+{selectedItem.pointsEarned}</p>
              </div>
            </div>

            {/* Disposal Instructions */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">♻️</span>
                <h3 className="text-xl font-bold text-gray-900">How to Dispose</h3>
              </div>
              <p className="text-gray-800 leading-relaxed text-base">
                {selectedItem.disposalInstructions}
              </p>
            </div>

            {/* Environmental Impact */}
            <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🌍</span>
                <h3 className="text-xl font-bold text-amber-800">Environmental Impact</h3>
              </div>
              <div className="max-h-none">
                <p className="text-amber-900 leading-relaxed text-base">
                  {selectedItem.description}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main Scan Detail View - Update the thumbnails section
  const formattedItems = formatStoredItems(scan.items);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <motion.div 
        className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowBack className="text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 truncate">
          {scan.type === 'multiple' ? `${scan.totalItems} Items` : scan.object}
        </h1>
      </motion.div>

      <div className="flex-1 overflow-y-auto">
        <motion.div
          className="p-6 space-y-6 pb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Original Image */}
          <div className="relative">
            <img
              src={scan.imageUrl}
              alt="Original scan"
              className="w-full h-64 rounded-2xl object-cover shadow-lg border border-gray-200"
            />
            <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              Original Image
            </div>
            {!imageAccessible && (
              <div className="absolute bottom-4 left-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm text-center">
                ⚠️ Cropping unavailable - using original images
              </div>
            )}
          </div>

          {/* Scan Metadata */}
          <div className="bg-gray-50 rounded-2xl p-5">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-3">
                <CalendarToday className="text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Scanned</p>
                  <p className="font-medium text-gray-900">{formatDate(scan.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <LocationOn className="text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium text-gray-900">{formatLocation(scan.location)}</p>
                </div>
                {scan.location && (
                  <button
                    onClick={handleViewOnMap}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
                  >
                    <Visibility fontSize="small" />
                    View on Map
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">⭐</span>
                <span className="font-semibold text-green-800">Points Earned</span>
              </div>
              <p className="text-green-900 font-bold text-2xl">
                +{scan.type === 'multiple' ? scan.totalPoints : scan.pointsEarned}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📊</span>
                <span className="font-semibold text-blue-800">Items</span>
              </div>
              <p className="text-blue-900 font-bold text-2xl">
                {scan.type === 'multiple' ? scan.totalItems : '1'}
              </p>
            </div>
          </div>

          {/* Items Section */}
          {scan.type === 'multiple' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Detected Items</h3>
                {!imageAccessible && (
                  <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                    ⚠️ Using original images
                  </span>
                )}
              </div>
              
              {checkingImage && (
                <div className="text-center py-4">
                  <div className="text-blue-600">Checking image accessibility...</div>
                </div>
              )}

              <div className="space-y-3">
                {formattedItems.map((item, index) => {
                  const imageProps = item.bbox ? createImageCropStyle(scan.imageUrl, item.bbox) : null;
                  
                  return (
                    <motion.div
                      key={index}
                      className="bg-white border-2 border-gray-100 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200"
                      onClick={() => handleItemClick(item, index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                          {/* ✅ Use improved cropping for thumbnails */}
                          {item.bbox && imageAccessible && imageProps ? (
                            <div className="w-20 h-20 rounded-lg overflow-hidden shadow-md border border-gray-200">
                              <img
                                {...imageProps}
                                alt={item.object}
                                className="w-full h-full"
                              />
                            </div>
                          ) : (
                            <img
                              src={scan.imageUrl}
                              alt={item.object}
                              className="w-20 h-20 rounded-lg object-cover shadow-md border border-gray-200"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f3f4f6"/><text x="40" y="45" text-anchor="middle" fill="%236b7280" font-size="12">📦</text></svg>';
                              }}
                            />
                          )}
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">{index + 1}</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.object}</h4>
                          <p className="text-sm text-gray-600 truncate">{item.material}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              +{item.pointsEarned} pts
                            </span>
                            <span className="text-xs text-gray-500">{item.co2Value}</span>
                          </div>
                        </div>
                        
                        <div className="text-gray-400">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Single Item Details (unchanged)
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg">♻️</span>
                  <h4 className="text-lg font-bold text-gray-900">How to Dispose</h4>
                </div>
                <p className="text-gray-800 leading-relaxed">
                  {scan.disposalInstructions}
                </p>
              </div>

              <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-lg">🌍</span>
                  <h4 className="text-lg font-bold text-amber-800">Environmental Impact</h4>
                </div>
                <div className="max-h-none">
                  <p className="text-amber-900 leading-relaxed">
                    {scan.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ScanDetail;