import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import FlashOffIcon from "@mui/icons-material/FlashOff";

function CameraApp() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          zoom: { ideal: 1.0 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Camera access denied or not available");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const flipCamera = () => {
    setFacingMode((prevMode) => (prevMode === "user" ? "environment" : "user"));
  };

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.getCapabilities().torch) {
        videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled }],
        });
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || isCapturing || isScanning) return;

    setIsCapturing(true);
    setIsScanning(true);

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      // Set canvas dimensions
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      // Draw current frame
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(
        async (blob) => {
          if (blob) {
            const formData = new FormData();
            formData.append("image", blob, "capture.jpg");

            console.log("📸 Captured image, sending to API...");
            console.log("Blob size:", blob.size, "bytes");

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 3000));

            console.log("✅ API call completed!");
          }

          setIsCapturing(false);
          setIsScanning(false);
        },
        "image/jpeg",
        0.8
      );
    } catch (error) {
      console.error("Error capturing photo:", error);
      setIsCapturing(false);
      setIsScanning(false);
    }
  };

  const closeCamera = () => {
    stopCamera();
    navigate("/dashboard");
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
        <div className="text-center text-white p-8">
          <CameraAltIcon className="text-6xl mb-4 opacity-50" />
          <h2 className="text-xl font-bold mb-2">Camera Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={closeCamera}
            className="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors"
          >
            Close Camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video Stream */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black z-0"
        playsInline
        muted
        autoPlay
      />

      {/* Scanning Background Effect */}
      {isScanning && (
        <div className="absolute inset-0 z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/20 to-transparent animate-scan"></div>
        </div>
      )}

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 z-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex justify-between items-center">
          <button
            onClick={closeCamera}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            <CloseIcon className="text-2xl" />
          </button>

          <button
            onClick={toggleFlash}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
          >
            {flashEnabled ? (
              <FlashOnIcon className="text-2xl" />
            ) : (
              <FlashOffIcon className="text-2xl" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-24 p-8 z-20 bg-gradient-to-t from-black/50 to-transparent">
        <div className="relative w-full flex justify-center">
          {/* Capture Button */}
          <button
            onClick={capturePhoto}
            disabled={isCapturing || isScanning}
            className={`w-20 h-20 rounded-full border-4 border-gray-300 transition-colors flex items-center justify-center ${
              isCapturing || isScanning
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-white hover:bg-gray-100 active:scale-95"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full border-2 transition-transform duration-150 ${
                isCapturing || isScanning
                  ? "bg-gray-300 border-gray-400 scale-90"
                  : "bg-white border-gray-400"
              }`}
            ></div>
          </button>

          {/* Flip Camera */}
          <button
            onClick={flipCamera}
            className="absolute right-12 bottom-1/2 translate-y-1/2 w-12 h-12 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors flex items-center justify-center"
            style={{ right: "calc(5%)" }}
          >
            <FlipCameraIosIcon className="text-2xl" />
          </button>
        </div>
      </div>

      {/* Scanning Text */}
      {isScanning && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <p className="text-white text-lg font-semibold animate-pulse">
            Scanning object, please wait…
          </p>
        </div>
      )}
    </div>
  );
}

export default CameraApp;
