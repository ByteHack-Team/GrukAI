import React, { useEffect, useRef, useState } from 'react';

function Map() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState({ lat: 37.7749, lng: -122.4194 }); // San Francisco default
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    // Debug: Check if API key is loaded
    console.log('🔑 API Key loaded:', apiKey ? 'Yes' : 'No');
    
    if (!apiKey) {
      setError('Google Maps API key not found. Please check your .env file.');
      setIsLoading(false);
      return;
    }

    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('✅ Google Maps already loaded');
        setGoogleMapsLoaded(true);
        return;
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('⏳ Google Maps script already exists, waiting...');
        // Wait for it to load
        const checkGoogle = setInterval(() => {
          if (window.google && window.google.maps) {
            console.log('✅ Google Maps loaded from existing script');
            clearInterval(checkGoogle);
            setGoogleMapsLoaded(true);
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkGoogle);
          if (!window.google || !window.google.maps) {
            setError('Timeout loading Google Maps');
            setIsLoading(false);
          }
        }, 10000);
        return;
      }

      // Create and load the script - Updated to include marker library
      console.log('📦 Loading Google Maps script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log('✅ Google Maps script loaded successfully');
        setGoogleMapsLoaded(true);
      };
      
      script.onerror = (err) => {
        console.error('❌ Failed to load Google Maps script:', err);
        setError('Failed to load Google Maps script');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!googleMapsLoaded) {
      console.log('⏳ Waiting for Google Maps to load...');
      return;
    }

    // Wait a bit for the DOM element to be rendered
    const initTimer = setTimeout(() => {
      console.log('🗺️ Attempting to initialize map...');
      console.log('MapRef exists:', !!mapRef.current);
      
      if (!mapRef.current) {
        console.error('❌ Map container still not found after timeout');
        setError('Map container not available');
        setIsLoading(false);
        return;
      }

      if (!window.google || !window.google.maps) {
        console.error('❌ Google Maps API not available');
        setError('Google Maps API not available');
        setIsLoading(false);
        return;
      }

      try {
        const mapInstance = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: 12,
          // Remove mapId and styles conflict
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy'
        });

        console.log('✅ Map initialized successfully');
        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error('❌ Failed to initialize map:', err);
        setError(`Failed to initialize map: ${err.message}`);
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(initTimer);
  }, [googleMapsLoaded, center]);

  // Get user's current location
  useEffect(() => {
    if (!map) return;

    console.log('📍 Getting user location...');
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCenter = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          console.log('✅ Location found:', newCenter);
          
          // Update map center
          map.setCenter(newCenter);
          
          // Use old marker since we removed mapId (required for AdvancedMarkerElement)
          new window.google.maps.Marker({
            position: newCenter,
            map: map,
            title: 'Your Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });
          
          console.log('✅ Marker created');
        },
        (error) => {
          console.log('⚠️ Error getting location:', error.message);
          // Keep default location if geolocation fails
        },
        {
          timeout: 10000,
          enableHighAccuracy: true
        }
      );
    } else {
      console.log('⚠️ Geolocation not supported');
    }
  }, [map]);

  // Always render the map container with explicit dimensions
  return (
    <div className="h-screen w-full relative" style={{ height: '100vh', width: '100%' }}>
      <div 
        ref={mapRef} 
        className="w-full h-full" 
        style={{ 
          height: '100%', 
          width: '100%',
          minHeight: '400px' // Ensure minimum height
        }} 
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">🗺️</div>
            <p className="text-gray-600">Loading map...</p>
            <p className="text-xs text-gray-400 mt-2">
              Google Maps: {googleMapsLoaded ? '✅' : '⏳'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4 z-10">
          <div className="text-center text-red-600">
            <div className="text-4xl mb-4">❌</div>
            <p className="font-semibold mb-2">Failed to load Google Maps</p>
            <p className="text-sm bg-red-100 p-2 rounded">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Map;