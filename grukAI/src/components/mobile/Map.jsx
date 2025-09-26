import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete"; // 🗑️ Garbage can
import FactoryIcon from "@mui/icons-material/Factory"; // 🏭 Facility
import RoomIcon from "@mui/icons-material/Room"; // 📍 User location
import grukBg from "../assets/GRUK_AI_LOGO-Photoroom.png";

function Map() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState({ lat: 40.7128, lng: -74.006 });
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Markers
  const [garbageCanMarkers, setGarbageCanMarkers] = useState([]);
  const [facilityMarkers, setFacilityMarkers] = useState([]);
  const [showingGarbageCans, setShowingGarbageCans] = useState(false);
  const [showingFacilities, setShowingFacilities] = useState(false);

  // Dataset
  const [allGarbageCans, setAllGarbageCans] = useState(null);
  const [loadingAllCans, setLoadingAllCans] = useState(false);
  const [searchingGarbageCans, setSearchingGarbageCans] = useState(false);
  const [searchingFacilities, setSearchingFacilities] = useState(false);

  // ✅ Load Google Maps script once
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Google Maps API key not found. Check .env");
      setIsLoading(false);
      return;
    }
    if (window.google?.maps) {
      setGoogleMapsLoaded(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleMapsLoaded(true);
    script.onerror = () => {
      setError("Failed to load Google Maps script");
      setIsLoading(false);
    };
    document.head.appendChild(script);
  }, []);

  // ✅ Initialize map
  useEffect(() => {
    if (!googleMapsLoaded) return;
    if (!mapRef.current) return;

    try {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        gestureHandling: "greedy",
      });
      setMap(mapInstance);
      setIsLoading(false);
    } catch (e) {
      setError(`Failed to initialize map: ${e.message}`);
      setIsLoading(false);
    }
  }, [googleMapsLoaded]);

  // ✅ Get user location
  useEffect(() => {
    if (!map) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          map.setCenter(loc);
          new window.google.maps.Marker({
            position: loc,
            map,
            title: "You are here",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });
        },
        () => setUserLocation(center),
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setUserLocation(center);
    }
  }, [map]);

  // ✅ Distance function (Haversine)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ✅ Fetch garbage cans once (cached)
  const fetchAllGarbageCans = async () => {
    if (allGarbageCans) return allGarbageCans;
    setLoadingAllCans(true);
    try {
      const url =
        "https://data.cityofnewyork.us/resource/8znf-7b2c.geojson?$limit=50000";
      const { data } = await axios.get(url);
      const feats = data.features || [];
      setAllGarbageCans(feats);
      return feats;
    } catch (e) {
      console.error("Dataset fetch failed:", e);
      alert("Failed to load garbage can dataset.");
      throw e;
    } finally {
      setLoadingAllCans(false);
    }
  };

  // ✅ Search garbage cans near user
  const searchNearbyGarbageCans = async () => {
    if (!map || !userLocation) return;
    setSearchingGarbageCans(true);
    try {
      const all = await fetchAllGarbageCans();
      const nearby = all.filter((f) => {
        if (!f.geometry?.coordinates) return false;
        const [lng, lat] = f.geometry.coordinates;
        return calculateDistance(userLocation.lat, userLocation.lng, lat, lng) <= 200;
      });
      displayGarbageCanMarkers(nearby);
    } finally {
      setSearchingGarbageCans(false);
    }
  };

  // ✅ Display markers
  const displayGarbageCanMarkers = (garbageCans) => {
    garbageCanMarkers.forEach((m) => m.setMap(null));
    const newMarkers = garbageCans.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: "Trash Can",
        icon: {
          url: `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" fill="#2D5A27" width="32" height="32"><path d="M3 6h18l-2 12H5L3 6z"/></svg>`
          )}`,
          scaledSize: new window.google.maps.Size(28, 28),
        },
      });
      return marker;
    });
    setGarbageCanMarkers(newMarkers);
    setShowingGarbageCans(true);
    if (newMarkers.length === 0) alert("No garbage cans within 200m.");
  };

  // ✅ Clear markers
  const clearGarbageCanMarkers = () => {
    garbageCanMarkers.forEach((m) => m.setMap(null));
    setGarbageCanMarkers([]);
    setShowingGarbageCans(false);
  };

  return (
    <div className="h-screen w-full relative">
      <div ref={mapRef} className="w-full h-full" />

      {/* UI */}
      {map && !isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2 items-center">
          <button
            onClick={showingGarbageCans ? clearGarbageCanMarkers : searchNearbyGarbageCans}
            disabled={searchingGarbageCans || loadingAllCans}
            className={`px-4 py-2 rounded-full text-white shadow-lg ${
              showingGarbageCans ? "bg-red-500" : "bg-green-600"
            }`}
          >
            {searchingGarbageCans
              ? "Searching..."
              : showingGarbageCans
              ? "❌ Hide Cans"
              : "🗑️ Show Nearby Cans"}
          </button>
        </div>
      )}

      {/* Loader */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <img src={grukBg} alt="Loading" className="animate-spin w-16 h-16 mb-4 rounded-full" />
          <p>Loading map...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

export default Map;
