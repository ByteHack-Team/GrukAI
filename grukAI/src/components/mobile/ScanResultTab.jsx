import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { CircularProgress, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";

function ScanResultTab({ result, onClose }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const [viewingItemDetail, setViewingItemDetail] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const y = useMotionValue(0);
  const constraintsRef = useRef(null);
  const dragHandleRef = useRef(null);
  const navigate = useNavigate();
  
  const minHeight = 280;
  const maxHeight = window.innerHeight * 0.9;
  const dismissThreshold = 100;
  
  const initialPosition = window.innerHeight - minHeight;
  const fullyExpandedPosition = window.innerHeight - maxHeight;
  
  const opacity = useTransform(y, [initialPosition, initialPosition + dismissThreshold], [1, 0.5]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const unsubscribe = y.onChange((currentY) => {
      const isAtFullHeight = currentY <= fullyExpandedPosition + 20;
      setIsFullyExpanded(isAtFullHeight);
    });

    return unsubscribe;
  }, [fullyExpandedPosition]);

  const handleDragStart = (event) => {
    // COMPLETELY disable drag if fully expanded
    if (isFullyExpanded) {
      return false;
    }
    
    // Only allow drag if it's from the handle area when not fully expanded
    if (!isPointerOverHandle(event)) {
      return false;
    }
    setIsDragging(true);
  };

  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    
    const currentY = y.get();
    const dragDistance = info.offset.y;
    const velocity = info.velocity.y;
    
    // If dragged down past dismiss threshold or with high downward velocity
    if (currentY > initialPosition + dismissThreshold || velocity > 1000) {
      animate(y, window.innerHeight, {
        type: "spring",
        stiffness: 300,
        damping: 30,
        onComplete: onClose
      });
      return;
    }
    
    let targetY = initialPosition;
    
    // If dragged up significantly, expand more
    if (dragDistance < -80 || velocity < -400) {
      targetY = fullyExpandedPosition;
    }
    // If dragged up a bit, partial expand  
    else if (dragDistance < -40) {
      targetY = window.innerHeight - (maxHeight * 0.7);
    }
    // If currently expanded and dragged down a bit, collapse
    else if (currentY < initialPosition - 50 && dragDistance > 30) {
      targetY = initialPosition;
    }
    
    animate(y, targetY, {
      type: "spring",
      stiffness: 400,
      damping: 40
    });
  };

  const handleContentClick = (e) => {
    // Always prevent event propagation on content clicks
    e.stopPropagation();
  };

  const handleBackdropClick = (e) => {
    // Only close if clicking outside the sheet area AND not fully expanded
    const sheetElement = constraintsRef.current;
    if (sheetElement && !sheetElement.contains(e.target) && !isFullyExpanded) {
      onClose();
    }
  };

  const handleDragHandleClick = (e) => {
    e.stopPropagation();
    
    const currentY = y.get();
    
    if (isFullyExpanded) {
      // If fully expanded, collapse to initial position
      animate(y, initialPosition, {
        type: "spring",
        stiffness: 400,
        damping: 40
      });
    } else {
      // If not fully expanded, expand to full or close based on current state
      const isExpanded = currentY < initialPosition - 50;
      
      if (isExpanded) {
        // If partially expanded, close completely
        animate(y, window.innerHeight, {
          type: "spring",
          stiffness: 300,
          damping: 30,
          onComplete: onClose
        });
      } else {
        // If collapsed, expand to full
        animate(y, fullyExpandedPosition, {
          type: "spring",
          stiffness: 400,
          damping: 40
        });
      }
    }
  };

  const isPointerOverHandle = (event) => {
    if (!dragHandleRef.current) return false;
    
    const rect = dragHandleRef.current.getBoundingClientRect();
    const { clientX, clientY } = event;
    
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  };

  const handleItemClick = (item) => {
    setCurrentItem(item);
    setViewingItemDetail(true);
  };

  const handleBackToList = () => {
    setViewingItemDetail(false);
    setCurrentItem(null);
  };

  if (!result) {
    return null;
  }

  const isLoading = result.isLoading;
  const isMultipleItems = result.isMultipleItems;

  return (
    <>
      <motion.div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ opacity }}
      />

      <motion.div
        ref={constraintsRef}
        initial={{ y: window.innerHeight }}
        animate={{ y: initialPosition }}
        exit={{ y: window.innerHeight }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          delay: 0.1
        }}
        // CONDITIONALLY enable drag based on expanded state
        drag={!isFullyExpanded ? "y" : false}
        dragConstraints={{ 
          top: window.innerHeight - maxHeight, 
          bottom: window.innerHeight + 150
        }}
        dragElastic={{ top: 0.1, bottom: 0.3 }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        dragMomentum={false}
        style={{
          y,
          opacity,
          height: `${maxHeight}px`,
          top: 0,
          touchAction: isFullyExpanded ? 'auto' : 'none' // Allow touch when fully expanded
        }}
        className="fixed left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
        onClick={handleContentClick}
      >
        {/* Drag Handle */}
        <div 
          ref={dragHandleRef}
          className={`flex-shrink-0 w-full flex justify-center py-4 bg-gray-50/50 relative z-10 ${
            isFullyExpanded ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
          }`}
          onClick={handleDragHandleClick}
          style={{ touchAction: 'manipulation' }}
        >
          <motion.div
            className={`w-12 h-1.5 rounded-full transition-colors ${
              isFullyExpanded ? 'bg-blue-400 hover:bg-blue-500' : 'bg-gray-400 hover:bg-gray-500'
            }`}
            whileTap={{ scale: 1.1 }}
          />
        </div>

        {/* Content Container */}
        <div 
          className="flex-1 overflow-hidden flex flex-col"
          style={{ touchAction: 'auto' }}
        >
          {/* Item Detail View */}
          {viewingItemDetail && currentItem ? (
            <>
              {/* Header with Back Button */}
              <div className="flex-shrink-0 px-6 pb-4">
                <div className="flex items-center gap-3 mb-4">
                  <button
                    onClick={handleBackToList}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {currentItem.object}
                  </h2>
                </div>
              </div>

              {/* Item Detail Content */}
              <div 
                className={`flex-1 px-6 ${
                  isFullyExpanded 
                    ? 'overflow-y-auto pb-12' 
                    : 'overflow-hidden'
                }`}
                style={{
                  transition: 'overflow 0.3s ease-in-out',
                  touchAction: 'pan-y',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                <div className="space-y-6">
                  {/* Item Image */}
                  <div className="relative">
                    <img
                      src={currentItem.croppedImage || result.image_url}
                      alt={currentItem.object}
                      className="w-full h-48 rounded-2xl object-cover shadow-lg border border-gray-200"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="192" viewBox="0 0 256 192"><rect width="256" height="192" fill="%23f3f4f6"/><text x="128" y="100" text-anchor="middle" fill="%236b7280" font-size="16">📦</text></svg>';
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      ✓ Detected
                    </div>
                  </div>

                  {/* Item Info */}
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{currentItem.object}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Material: {currentItem.material}
                      </span>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🌱</span>
                        <span className="font-semibold text-green-800 text-sm">CO₂ Impact</span>
                      </div>
                      <p className="text-green-900 font-bold text-lg">{currentItem.co2value}</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">⭐</span>
                        <span className="font-semibold text-blue-800 text-sm">Points</span>
                      </div>
                      <p className="text-blue-900 font-bold text-lg">+{currentItem.points_earned}</p>
                    </div>
                  </div>

                  {/* Disposal Instructions */}
                  <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg">♻️</span>
                      <h4 className="text-lg font-bold text-gray-900">How to Dispose</h4>
                    </div>
                    <p className="text-gray-800 leading-relaxed">
                      {currentItem.disposal_instructions}
                    </p>
                  </div>

                  {/* Environmental Impact */}
                  <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-lg">🌍</span>
                      <h4 className="text-lg font-bold text-amber-800">Environmental Impact</h4>
                    </div>
                    <p className="text-amber-900 leading-relaxed">
                      {currentItem.description || currentItem.description_info}
                    </p>
                  </div>

                  {/* Back Button */}
                  <div className="flex justify-center pt-4 pb-16">
                    <button
                      onClick={handleBackToList}
                      className="px-8 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors active:scale-95"
                      style={{ touchAction: 'manipulation' }}
                    >
                      Back to Results
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Multiple Items View or Single Item View */
            <>
              {isMultipleItems ? (
                <>
                  {/* Header for Multiple Items */}
                  <div className="flex-shrink-0 px-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {isLoading ? (
                            <Skeleton variant="text" width="200px" height={32} />
                          ) : (
                            `${result.totalItems} Items Found`
                          )}
                        </h2>
                        {!isLoading && (
                          <p className="text-sm text-gray-600">
                            Total: +{result.totalPoints} points
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {isLoading ? (
                            <CircularProgress size={20} />
                          ) : (
                            `+${result.totalPoints}`
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Points</div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <span>👆</span>
                      {isFullyExpanded ? "Tap items for details" : "Drag up to see all items"}
                    </p>
                  </div>

                  {/* Scrollable Items Grid */}
                  <div 
                    className={`flex-1 px-6 ${
                      isFullyExpanded 
                        ? 'overflow-y-auto pb-16' 
                        : 'overflow-hidden pb-6'
                    }`}
                    style={{
                      transition: 'overflow 0.3s ease-in-out',
                      touchAction: 'pan-y',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    <div className="space-y-3">
                      {isLoading ? (
                        // Loading skeletons for multiple items
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="bg-gray-50 rounded-xl p-4">
                            <div className="flex items-center gap-4">
                              <Skeleton variant="rectangular" width={80} height={80} className="rounded-lg" />
                              <div className="flex-1">
                                <Skeleton variant="text" width="60%" height={24} />
                                <Skeleton variant="text" width="40%" height={20} className="mt-2" />
                                <Skeleton variant="text" width="50%" height={16} className="mt-2" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        result.items?.map((item, index) => (
                          <motion.div
                            key={index}
                            className="bg-white border-2 border-gray-100 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 active:scale-[0.98]"
                            onClick={() => handleItemClick(item)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            style={{ touchAction: 'manipulation' }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative flex-shrink-0">
                                <img
                                  src={item.croppedImage || result.image_url}
                                  alt={item.object}
                                  className="w-20 h-20 rounded-lg object-cover shadow-md border border-gray-200"
                                  onError={(e) => {
                                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f3f4f6"/><text x="40" y="45" text-anchor="middle" fill="%236b7280" font-size="12">📦</text></svg>';
                                  }}
                                />
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">{index + 1}</span>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">{item.object}</h3>
                                <p className="text-sm text-gray-600 truncate">{item.material}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    +{item.points_earned} pts
                                  </span>
                                  <span className="text-xs text-gray-500">{item.co2value}</span>
                                </div>
                              </div>
                              <div className="text-gray-400">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}

                      {/* Done Button */}
                      <div className="flex justify-center pt-6 pb-16">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                          }}
                          className="px-8 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors active:scale-95"
                          disabled={isLoading}
                          style={{ touchAction: 'manipulation' }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Single Item View
                <>
                  <div className="flex-shrink-0 px-6 pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <img
                          src={result.image_url}
                          alt="Scanned"
                          className="w-24 h-24 rounded-xl object-cover shadow-lg border-2 border-gray-100"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" fill="%23f3f4f6"/><text x="48" y="52" text-anchor="middle" fill="%236b7280" font-size="14">📸</text></svg>';
                          }}
                        />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        {isLoading ? (
                          <>
                            <Skeleton variant="text" width="70%" height={28} />
                            <Skeleton variant="text" width="50%" height={20} className="mt-2" />
                            <Skeleton variant="text" width="60%" height={16} className="mt-2" />
                          </>
                        ) : (
                          <>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">{result.object}</h2>
                            <p className="text-sm text-gray-600 mb-2">Material: {result.material}</p>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                +{result.points_earned} points
                              </span>
                              <span className="text-xs text-gray-500">{result.co2value} CO₂</span>
                            </div>
                          </>
                        )}
                        <p className="text-xs text-blue-600 mt-3 font-medium flex items-center gap-1">
                          <span>↑</span>
                          {isFullyExpanded ? "Scroll for details" : "Drag up for details"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={`flex-1 px-6 ${
                      isFullyExpanded 
                        ? 'overflow-y-auto pb-16' 
                        : 'overflow-hidden pb-6'
                    }`}
                    style={{
                      transition: 'overflow 0.3s ease-in-out',
                      touchAction: 'pan-y',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🌱</span>
                            <span className="font-semibold text-green-800">Environmental Impact</span>
                          </div>
                          {isLoading ? (
                            <div className="flex items-center justify-center py-2">
                              <CircularProgress size={20} sx={{ color: '#059669' }} />
                            </div>
                          ) : (
                            <p className="text-green-900 font-bold text-lg">{result.co2value}</p>
                          )}
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">⭐</span>
                            <span className="font-semibold text-blue-800">Points Earned</span>
                          </div>
                          {isLoading ? (
                            <div className="flex items-center justify-center py-2">
                              <CircularProgress size={20} sx={{ color: '#2563eb' }} />
                            </div>
                          ) : (
                            <p className="text-blue-900 font-bold text-lg">+{result.points_earned}</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">♻️</span>
                          <span className="font-semibold text-gray-800">How to Dispose</span>
                        </div>
                        {isLoading ? (
                          <div className="space-y-2">
                            <Skeleton variant="text" width="100%" height={20} />
                            <Skeleton variant="text" width="85%" height={20} />
                            <Skeleton variant="text" width="70%" height={20} />
                          </div>
                        ) : (
                          <div className="max-h-32 overflow-y-auto">
                            <p className="text-gray-900 leading-relaxed">{result.disposal_instructions}</p>
                          </div>
                        )}
                      </div>

                      <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🌍</span>
                          <span className="font-semibold text-amber-800">Environmental Impact</span>
                        </div>
                        {isLoading ? (
                          <div className="space-y-2">
                            <Skeleton variant="text" width="100%" height={20} />
                            <Skeleton variant="text" width="90%" height={20} />
                            <Skeleton variant="text" width="75%" height={20} />
                            <Skeleton variant="text" width="80%" height={20} />
                          </div>
                        ) : (
                          <div className="max-h-40 overflow-y-auto">
                            <p className="text-amber-900 leading-relaxed">{result.description}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center pt-4 pb-16">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                          }}
                          className="px-8 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors active:scale-95"
                          disabled={isLoading}
                          style={{ touchAction: 'manipulation' }}
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

export default ScanResultTab;