import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

function ScanResultTab({ result, onClose }) {
  console.log("🎯 ScanResultTab rendered with result:", result);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isFullyExpanded, setIsFullyExpanded] = useState(false);
  const y = useMotionValue(0);
  const constraintsRef = useRef(null);
  const dragHandleRef = useRef(null);
  
  // Height constraints
  const minHeight = 200;
  const maxHeight = window.innerHeight * 0.75;
  const dismissThreshold = 120;
  
  // Calculate initial position - start with most content below viewport
  const initialPosition = window.innerHeight - minHeight;
  const fullyExpandedPosition = window.innerHeight - maxHeight;
  
  // Transform for opacity during dismiss
  const opacity = useTransform(y, [initialPosition, initialPosition + dismissThreshold], [1, 0.7]);

  useEffect(() => {
    console.log("✅ ScanResultTab mounted!");
    
    document.body.style.overflow = 'hidden';
    return () => {
      console.log("❌ ScanResultTab unmounted!");
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Track if fully expanded for scrolling
  useEffect(() => {
    const unsubscribe = y.onChange((currentY) => {
      const isAtFullHeight = currentY <= fullyExpandedPosition + 20; // Small tolerance
      setIsFullyExpanded(isAtFullHeight);
    });

    return unsubscribe;
  }, [fullyExpandedPosition]);

  const handleDragStart = () => {
    console.log("🔄 Drag started");
    setIsDragging(true);
  };

  const handleDragEnd = (_, info) => {
    console.log("🛑 Drag ended", info);
    setIsDragging(false);
    
    const currentY = y.get();
    const dragDistance = info.offset.y;
    const velocity = info.velocity.y;
    
    // If dragged down past dismiss threshold or with high downward velocity
    if (currentY > initialPosition + dismissThreshold || velocity > 800) {
      console.log("👋 Dismissing bottom sheet");
      animate(y, window.innerHeight, {
        type: "spring",
        stiffness: 300,
        damping: 30,
        onComplete: onClose
      });
      return;
    }
    
    // Determine target position based on drag
    let targetY = initialPosition; // Default to collapsed
    
    // If dragged up significantly, expand more
    if (dragDistance < -100 || velocity < -500) {
      targetY = fullyExpandedPosition; // Fully expanded
    }
    // If dragged up a bit, partial expand  
    else if (dragDistance < -50) {
      targetY = window.innerHeight - (maxHeight * 0.6); // Partially expanded
    }
    // If currently expanded and dragged down a bit, collapse
    else if (currentY < initialPosition - 50 && dragDistance > 30) {
      targetY = initialPosition; // Collapse
    }
    
    animate(y, targetY, {
      type: "spring",
      stiffness: 400,
      damping: 40
    });
  };

  const handleContentClick = (e) => {
    e.stopPropagation();
    // Don't do anything - clicking content shouldn't minimize
  };

  const handleDragHandleClick = (e) => {
    e.stopPropagation();
    console.log("👆 Drag handle clicked");
    
    const currentY = y.get();
    const isExpanded = currentY < initialPosition - 50;
    
    const targetY = isExpanded 
      ? initialPosition 
      : fullyExpandedPosition; // Go to fully expanded when expanding
    
    animate(y, targetY, {
      type: "spring",
      stiffness: 400,
      damping: 40
    });
  };

  // Check if pointer is over drag handle OR if sheet is not fully expanded
  const shouldAllowDrag = (event, info) => {
    // If fully expanded, only allow drag from handle
    if (isFullyExpanded) {
      if (!dragHandleRef.current) return false;
      
      const rect = dragHandleRef.current.getBoundingClientRect();
      const { clientX, clientY } = event;
      
      return (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    }
    
    // If not fully expanded, allow drag from anywhere
    return true;
  };

  // Simple fallback if Framer Motion is causing issues
  if (!result) {
    console.log("⚠️ No result provided to ScanResultTab");
    return null;
  }

  return (
    <>
      <motion.div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{ opacity }}
      />

      <motion.div
        ref={constraintsRef}
        // Start from below screen, animate smoothly to collapsed position
        initial={{ y: window.innerHeight }}
        animate={{ y: initialPosition }}
        exit={{ y: window.innerHeight }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          delay: 0.1
        }}
        // Conditionally enable drag based on expansion state
        drag={!isFullyExpanded ? "y" : false}
        dragConstraints={{ 
          top: window.innerHeight - maxHeight, 
          bottom: window.innerHeight + 100
        }}
        dragElastic={{ top: 0.1, bottom: 0.2 }}
        onDragStart={(event, info) => {
          // Only allow drag based on expansion state and handle position
          if (shouldAllowDrag(event, info)) {
            handleDragStart();
          } else {
            // Prevent drag if not allowed
            return false;
          }
        }}
        onDragEnd={handleDragEnd}
        // Custom drag logic - prevent drag when fully expanded (except handle)
        onPointerDown={(event) => {
          if (!shouldAllowDrag(event)) {
            event.preventDefault();
          }
        }}
        style={{
          y,
          opacity,
          height: `${maxHeight}px`,
          top: 0
        }}
        className="fixed left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
        onClick={handleContentClick}
      >
        {/* Drag Handle - Always draggable */}
        <motion.div 
          ref={dragHandleRef}
          className="flex-shrink-0 w-full flex justify-center py-4 cursor-grab active:cursor-grabbing"
          onClick={handleDragHandleClick}
          // Handle is always draggable regardless of expansion state
          drag="y"
          dragConstraints={{ 
            top: window.innerHeight - maxHeight, 
            bottom: window.innerHeight + 100
          }}
          dragElastic={{ top: 0.1, bottom: 0.2 }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          // Sync handle drag with parent container
          onDrag={(_, info) => {
            y.set(initialPosition + info.offset.y);
          }}
        >
          <motion.div
            className="w-12 h-1.5 bg-gray-400 rounded-full hover:bg-gray-500 transition-colors"
            whileTap={{ scale: 1.1 }}
          />
        </motion.div>

        {/* Content Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Always Visible Content - Object Image & Name */}
          <div className="flex-shrink-0 px-6 pb-4">
            <div className="flex items-center space-x-4">
              <img
                src={result.image_url}
                alt="Scanned"
                className="w-20 h-20 rounded-xl object-cover shadow-md"
                onError={(e) => {
                  console.log("🖼️ Image failed to load:", result.image_url);
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23f3f4f6"/><text x="40" y="45" text-anchor="middle" fill="%236b7280" font-size="12">No Image</text></svg>';
                }}
              />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{result.object}</h2>
                <p className="text-sm text-gray-600 mt-1">{result.material}</p>
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  {isFullyExpanded ? "Scroll to see more details" : "Drag to explore details"}
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Content - Detailed Information */}
          <div 
            className={`flex-1 px-6 ${
              isFullyExpanded 
                ? 'overflow-y-auto pb-6' 
                : 'overflow-hidden pb-6'
            }`}
            style={{
              transition: 'overflow 0.3s ease-in-out',
              // Prevent drag events from bubbling when scrolling
              touchAction: isFullyExpanded ? 'pan-y' : 'none'
            }}
          >
            <div className="space-y-4">
              {/* Key Information Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <span className="font-semibold text-green-700">CO₂ Impact:</span>
                  <p className="text-green-900 font-bold">{result.co2value}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="font-semibold text-blue-700">Points Earned:</span>
                  <p className="text-blue-900 font-bold">+{result.points_earned}</p>
                </div>
              </div>

              {/* Disposal Instructions */}
              <div className="bg-gray-50 rounded-xl p-4">
                <span className="font-semibold text-gray-700">Disposal Instructions:</span>
                <p className="text-gray-900 mt-2">{result.disposal_instructions}</p>
              </div>

              {/* Description */}
              <div>
                <span className="font-semibold text-gray-700">Description:</span>
                <p className="text-gray-900 mt-2 leading-relaxed">{result.description}</p>
              </div>

              {/* Done Button - With proper bottom spacing */}
              <div className="flex justify-center pt-6 pb-12">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="px-8 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors active:scale-95"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default ScanResultTab;