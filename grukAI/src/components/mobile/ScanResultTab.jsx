import { useState } from "react";
import { motion } from "framer-motion";

function ScanResultTab({ result, onClose }) {
  const collapsedHeight = 200; // enough to cover capture button
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ height: collapsedHeight }}
      animate={{ height: isExpanded ? "100vh" : collapsedHeight }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      drag="y"
      dragElastic={0.2}
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 100) {
          // dragged down past threshold → close fully
          onClose();
        } else if (info.offset.y < -100) {
          setIsExpanded(true);
        } else {
          setIsExpanded(false);
        }
      }}
      onClick={(e) => e.stopPropagation()} // block clicks from going to camera
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl z-50"
    >
      {/* Drag Handle */}
      <div
        className="w-12 h-1.5 bg-gray-400 rounded-full mx-auto my-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      />

      {/* Content */}
      <div className="p-4 overflow-y-auto h-full">
        {/* Header (always visible) */}
        <div className="flex items-center space-x-4">
          <img
            src={result.image_url}
            alt="Scanned"
            className="w-16 h-16 rounded-md object-cover"
          />
          <div>
            <h2 className="text-lg font-semibold">{result.object}</h2>
            <p className="text-sm text-gray-600">{result.material}</p>
          </div>
        </div>

        {/* Details (only visible when expanded) */}
        {isExpanded && (
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Disposal:</span>{" "}
              {result.disposal_instructions}
            </p>
            <p>
              <span className="font-semibold">CO₂ Value:</span>{" "}
              {result.co2value}
            </p>
            <p>
              <span className="font-semibold">Points Earned:</span>{" "}
              {result.points_earned}
            </p>
            <p>
              <span className="font-semibold">Description:</span>{" "}
              {result.description}
            </p>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="mt-6 w-full py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ScanResultTab;
