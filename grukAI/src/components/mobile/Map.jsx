import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import grukBg from "../assets/GRUK_AI_LOGO-Photoroom.png";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import ReactDOMServer from "react-dom/server";


function Map() {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [center] = useState({ lat: 40.7128, lng: -74.006 });
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Markers
  const [garbageCanMarkers, setGarbageCanMarkers] = useState([]);
  const [showingGarbageCans, setShowingGarbageCans] = useState(false);

  // Dataset
  const [allGarbageCans, setAllGarbageCans] = useState(null);
  const [loadingAllCans, setLoadingAllCans] = useState(false);
  const [searchingGarbageCans, setSearchingGarbageCans] = useState(false);

  // ✅ Track popup with a ref (not state)
  const activePopupRef = useRef(null);

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

      // ✅ Clicking on the map closes popup
      mapInstance.addListener("click", () => {
        if (activePopupRef.current) {
          activePopupRef.current.close();
          activePopupRef.current = null;
        }
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

          const userMarker = new window.google.maps.Marker({
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

          const userInfo = new window.google.maps.InfoWindow({
            content: `<div style="font-size:14px; display:flex; align-items:center; gap:6px;">
                        ${ReactDOMServer.renderToString(<LocationOnIcon style={{ color: "#4285F4" }} />)}
                        <strong>You are here</strong>
                      </div>`,
          });

          userMarker.addListener("click", () => {
            if (activePopupRef.current) activePopupRef.current.close();
            userInfo.open(map, userMarker);
            activePopupRef.current = userInfo;
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
        return (
          calculateDistance(userLocation.lat, userLocation.lng, lat, lng) <= 200
        );
      });
      displayGarbageCanMarkers(nearby);
    } finally {
      setSearchingGarbageCans(false);
    }
  };

  // ✅ Display markers + popup logic
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

      const description =
        feature.properties?.location_description || "No description available";

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="font-size:14px; line-height:1.4; display:flex; flex-direction:column; gap:4px;">
                    <div style="display:flex; align-items:center; gap:6px;">
                      ${ReactDOMServer.renderToString(<DeleteIcon style={{ color: "#2D5A27" }} />)}
                      <strong>Trash Can</strong>
                    </div>
                    <span>${description}</span>
                  </div>`,
      });

      marker.addListener("click", () => {
        if (activePopupRef.current) activePopupRef.current.close();
        infoWindow.open(map, marker);
        activePopupRef.current = infoWindow;
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
    if (activePopupRef.current) activePopupRef.current.close();
    activePopupRef.current = null;
    setShowingGarbageCans(false);
  };

  return (
    <div className="h-screen w-full relative">
      <div ref={mapRef} className="w-full h-full" />

      {/* UI */}
      {map && !isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col gap-2 items-center">
          <button
            onClick={
              showingGarbageCans ? clearGarbageCanMarkers : searchNearbyGarbageCans
            }
            disabled={searchingGarbageCans || loadingAllCans}
            className={`px-4 py-2 rounded-full text-white shadow-lg flex items-center gap-2 ${
              showingGarbageCans ? "bg-red-500" : "bg-green-600"
            }`}
          >
            {searchingGarbageCans ? (
              <>
                <SearchIcon /> Searching...
              </>
            ) : showingGarbageCans ? (
              <>
                <CloseIcon /> Hide Cans
              </>
            ) : (
              <>
                <DeleteIcon /> Show Nearby Cans
              </>
            )}
          </button>
        </div>
      )}

      {/* Loader */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 z-10">
          <img
            src={grukBg}
            alt="Loading"
            className="animate-spin w-16 h-16 mb-4 rounded-full"
          />
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