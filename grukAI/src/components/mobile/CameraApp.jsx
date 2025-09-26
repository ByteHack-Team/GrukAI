import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CloseIcon from '@mui/icons-material/Close'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos'
import FlashOnIcon from '@mui/icons-material/FlashOn'
import FlashOffIcon from '@mui/icons-material/FlashOff'

function CameraApp() {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment')
  const [flashEnabled, setFlashEnabled] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const videoRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    startCamera()
    return () => {
      stopCamera()
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: window.screen.width },
          height: { ideal: window.screen.height }
        },
        audio: false
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play()
      }
      setError(null)
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Camera access denied or not available')
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const flipCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user')
  }

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled)
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack && videoTrack.getCapabilities().torch) {
        videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled }]
        })
      }
    }
  }

  const capturePhoto = async () => {
    if (!videoRef.current || isCapturing) return
    
    setIsCapturing(true)
    
    try {
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      // Set canvas dimensions to match video
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      
      // Draw the current frame
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      
      // Convert to base64 string
      const base64Image = canvas.toDataURL('image/jpeg', 0.8)
      
      // Convert to blob for API sending
      canvas.toBlob(async (blob) => {
        if (blob) {
          // Create FormData for API (ready for backend)
          const formData = new FormData()
          formData.append('image', blob, 'capture.jpg')
          
          // Log image data to console
          console.log('📸 Photo Captured!')
          console.log('Image size:', blob.size, 'bytes')
          console.log('Image type:', blob.type)
          console.log('Base64 preview:', base64Image.substring(0, 100) + '...')
          console.log('FormData ready for API:', formData)
          console.log('Blob object:', blob)
          
          // TODO: Send to backend API
          // const response = await fetch('/api/upload-image', {
          //   method: 'POST',
          //   body: formData
          // })
          
          // Show success feedback (optional)
          console.log('✅ Image ready to send to backend!')
        }
        
        setIsCapturing(false)
      }, 'image/jpeg', 0.8)
      
    } catch (error) {
      console.error('Error capturing photo:', error)
      setIsCapturing(false)
    }
  }

  const closeCamera = () => {
    stopCamera()
    navigate('/dashboard')
  }

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
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Video Stream */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
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
            {flashEnabled ? <FlashOnIcon className="text-2xl" /> : <FlashOffIcon className="text-2xl" />}
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 pb-24 bg-gradient-to-t from-black/50 to-transparent">
        <div className="flex justify-between items-center">
          {/* Gallery Button (placeholder) */}
          <div className="w-12 h-12 rounded-lg bg-gray-600/50 border-2 border-white/30"></div>

          {/* Capture Button */}
          <button
            onClick={capturePhoto}
            disabled={isCapturing}
            className={`w-20 h-20 rounded-full border-4 border-gray-300 transition-colors flex items-center justify-center ${
              isCapturing 
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-white hover:bg-gray-100'
            }`}
          >
            <div className={`w-16 h-16 rounded-full border-2 transition-colors ${
              isCapturing 
                ? 'bg-gray-300 border-gray-400' 
                : 'bg-white border-gray-400'
            }`}></div>
          </button>

          {/* Flip Camera Button */}
          <button
            onClick={flipCamera}
            className="w-12 h-12 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors flex items-center justify-center"
          >
            <FlipCameraIosIcon className="text-2xl" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CameraApp