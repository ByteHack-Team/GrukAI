import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import FlashOffIcon from "@mui/icons-material/FlashOff";
import ScanResultTab from "./ScanResultTab";
import { auth, uploadScanImage, addPointsToUser } from "../../lib/firestore";
import { analyzeImageFrontend } from "../../lib/langgraph";
import { cropMultipleItems } from "../../lib/cropUtils";

function CameraApp() {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [showResultTab, setShowResultTab] = useState(false);

  const videoRef = useRef(null);
  const startingRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [facingMode]);

  const startCamera = async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    try {
      if (stream) stream.getTracks().forEach((t) => t.stop());

      const constraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        const playPromise = videoRef.current.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch((err) => {
            if (err.name !== "AbortError") {
              console.warn("Video play issue:", err);
            }
          });
        }
      }
      setError(null);
    } catch (e) {
      console.error("Camera error:", e);
      setError("Camera access denied or unavailable");
    } finally {
      startingRef.current = false;
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const flipCamera = () =>
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));

  const toggleFlash = () => {
    setFlashEnabled((f) => !f);
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track?.getCapabilities().torch) {
        track
          .applyConstraints({ advanced: [{ torch: !flashEnabled }] })
          .catch(() => {});
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || isCapturing || isScanning) return;
    const user = auth.currentUser;
    if (!user) {
      setError("You must be logged in to scan.");
      return;
    }

    setIsCapturing(true);
    setIsScanning(true);
    setUploadStatus("Capturing...");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      if (!canvas.width || !canvas.height) throw new Error("Video not ready");

      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);

      setUploadStatus("Converting image...");
      canvas.toBlob(
        async (blob) => {
          try {
            if (!blob) throw new Error("Blob conversion failed");

            setUploadStatus("Analyzing & uploading...");
            
            const prompt = "Identify all waste items and provide proper disposal instructions with bounding boxes.";
            
            const [aiResult, uploadResult] = await Promise.all([
              analyzeImageFrontend({ imageBlob: blob, prompt }),
              uploadScanImage(user.uid, blob, { source: "camera", status: "raw" })
            ]);

            let finalResult;
            let totalPointsToAdd = 0;

            if (typeof aiResult === "string") {
              if (aiResult === "No garbage found") {
                finalResult = {
                  image_url: uploadResult.url,
                  object: "No garbage detected",
                  material: "Unknown",
                  disposal_instructions: "No waste item detected in image",
                  description: "Try capturing a clearer image of waste item",
                  points_earned: 0,
                  co2value: "—",
                  isLoading: false,
                  isMultipleItems: false
                };
              } else {
                try {
                  const cleaned = aiResult.replace(/^```json\s*/, "").replace(/```$/, "").trim();
                  const parsed = JSON.parse(cleaned);
                  totalPointsToAdd = parsed.points_earned ?? 0;
                  finalResult = {
                    image_url: uploadResult.url,
                    object: parsed.object || "Unknown",
                    material: parsed.material || "Unknown", 
                    disposal_instructions: parsed.disposal_instructions || "No instructions",
                    description: parsed.description || parsed.description_info || "No description",
                    points_earned: totalPointsToAdd,
                    co2value: parsed.co2value || parsed.co2 || "—",
                    isLoading: false,
                    isMultipleItems: false
                  };
                } catch {
                  finalResult = {
                    image_url: uploadResult.url,
                    object: "Parse Error",
                    material: "Unknown",
                    disposal_instructions: "Failed to parse AI response",
                    description: aiResult.slice(0, 200),
                    points_earned: 0,
                    co2value: "—",
                    isLoading: false,
                    isMultipleItems: false
                  };
                }
              }
            } else if (aiResult.isMultipleItems) {
              // Multiple items detected - crop them
              setUploadStatus("Cropping detected items...");
              
              const croppedItems = await cropMultipleItems(blob, aiResult.items);
              totalPointsToAdd = aiResult.totalPoints;
              
              finalResult = {
                isMultipleItems: true,
                items: croppedItems,
                totalItems: aiResult.totalItems,
                totalPoints: aiResult.totalPoints,
                image_url: uploadResult.url,
                originalImageBlob: blob,
                isLoading: false
              };
            } else {
              // Single item
              totalPointsToAdd = aiResult.points_earned ?? 0;
              finalResult = {
                image_url: uploadResult.url,
                object: aiResult.object || "Unknown",
                material: aiResult.material || "Unknown",
                disposal_instructions: aiResult.disposal_instructions || "No instructions",
                description: aiResult.description || aiResult.description_info || "No description",
                points_earned: totalPointsToAdd,
                co2value: aiResult.co2value || aiResult.co2 || "—",
                bbox: aiResult.bbox || [0, 0, 100, 100],
                isLoading: false,
                isMultipleItems: false
              };
            }

            // Add points to user database
            if (totalPointsToAdd > 0) {
              try {
                await addPointsToUser(user.uid, totalPointsToAdd);
                console.log(`Successfully added ${totalPointsToAdd} points to user`);
              } catch (pointsError) {
                console.error("Failed to add points to user:", pointsError);
              }
            }

            setScanResult(finalResult);
            setUploadStatus("Analysis complete.");

            // Wait for scan animation to complete
            setTimeout(() => {
              setIsScanning(false);
              setShowResultTab(true);
            }, 3000);

          } catch (err) {
            console.error("Scan flow error:", err);
            setError("Scan failed");
            const errorResult = {
              image_url: imageDataUrl,
              object: "Error",
              material: "Unknown", 
              disposal_instructions: "Analysis failed",
              description: err.message,
              points_earned: 0,
              co2value: "—",
              isLoading: false,
              isMultipleItems: false
            };
            setScanResult(errorResult);
            
            setTimeout(() => {
              setIsScanning(false);
              setShowResultTab(true);
            }, 3000);
          } finally {
            setIsCapturing(false);
            setTimeout(() => setUploadStatus(""), 2000);
          }
        },
        "image/jpeg",
        0.9
      );
    } catch (e) {
      console.error("Capture error:", e);
      setError("Failed to capture image");
      setIsCapturing(false);
      setIsScanning(false);
      setUploadStatus("");
    }
  };

  const closeCamera = () => {
    stopCamera();
    navigate("/dashboard");
  };

  const handleCloseScanResult = () => {
    setShowResultTab(false);
    setScanResult(null);
  };


  return (
    <div className="fixed inset-0 bg-black z-50 w-screen h-screen">
      <video
        ref={videoRef}
        className="w-full h-full object-cover bg-black z-0"
        playsInline
        muted
        autoPlay
      />

      {isScanning && (
        <div className="absolute inset-0 z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/20 to-transparent animate-scan-slow" />
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 p-4 z-20 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex justify-between items-center">
          <button
            onClick={closeCamera}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50"
          >
            <CloseIcon className="text-2xl" />
          </button>

          <button
            onClick={toggleFlash}
            className="p-2 rounded-full bg-black/30 text-white hover:bg-black/50"
          >
            {flashEnabled ? (
              <FlashOnIcon className="text-2xl" />
            ) : (
              <FlashOffIcon className="text-2xl" />
            )}
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pb-40 p-8 z-20 bg-gradient-to-t from-black/50 to-transparent">
        <div className="relative w-full flex justify-center">
          <button
            onClick={capturePhoto}
            disabled={isCapturing || isScanning}
            className={`w-20 h-20 rounded-full border-4 border-gray-300 flex items-center justify-center ${
              isCapturing || isScanning
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-white hover:bg-gray-100 active:scale-95"
            }`}
          >
            <div
              className={`w-16 h-16 rounded-full border-2 ${
                isCapturing || isScanning
                  ? "bg-gray-300 border-gray-400 scale-90"
                  : "bg-white border-gray-400"
              }`}
            />
          </button>

          <button
            onClick={flipCamera}
            className="absolute right-12 bottom-1/2 translate-y-1/2 w-12 h-12 rounded-full bg-black/30 text-white hover:bg-black/50 flex items-center justify-center"
            style={{ right: "calc(5%)" }}
          >
            <FlipCameraIosIcon className="text-2xl" />
          </button>
        </div>
      </div>

      {(isScanning || uploadStatus) && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <p className="text-white text-lg font-semibold animate-pulse">
            {uploadStatus || "Processing..."}
          </p>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded text-sm z-30">
          {error}
        </div>
      )}

      {showResultTab && scanResult && (
        <ScanResultTab result={scanResult} onClose={handleCloseScanResult} />
      )}
    </div>
  );
}

export default CameraApp;