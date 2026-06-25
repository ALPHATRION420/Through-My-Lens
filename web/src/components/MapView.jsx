import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import L from "leaflet";
import { landmarks } from "../data/landmarks";

// Custom Leaflet DivIcons styled with custom HTML and CSS
const userIcon = L.divIcon({
  className: "custom-leaflet-marker user-marker",
  html: `<div style="
    width: 12px;
    height: 12px;
    background-color: #39ff14;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 10px #39ff14;
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const targetIcon = L.divIcon({
  className: "custom-leaflet-marker target-marker",
  html: `<div style="
    width: 18px;
    height: 18px;
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 8px #ffffff;
    position: relative;
  ">
    <div style="
      position: absolute;
      top: 50%;
      left: 50%;
      width: 6px;
      height: 6px;
      background-color: #0070f3;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    "></div>
  </div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const pinIcon = L.divIcon({
  className: "custom-leaflet-marker db-pin-marker",
  html: `<div style="
    width: 14px;
    height: 14px;
    background-color: #0070f3;
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 10px #0070f3;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

const landmarkIcon = L.divIcon({
  className: "custom-leaflet-marker landmark-marker",
  html: `<div style="
    width: 18px;
    height: 18px;
    background-color: #ffcc00;
    border: 2px solid #ffffff;
    border-radius: 50%;
    box-shadow: 0 0 8px #ffcc00;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: #000;
    font-weight: bold;
  ">★</div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

const MapView = forwardRef(function MapView(
  { pins, userCoords, selectedCoords, onSelectCoords, targetCoords },
  ref
) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef(null);

  // Expose recenterToUser() to parent via ref
  useImperativeHandle(ref, () => ({
    recenterToUser() {
      if (!mapInstanceRef.current || !userCoords) return;
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 15, {
        animate: true,
        duration: 1.2
      });
    }
  }));

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double-initialization in React 19

    // Default to user coords if available, else London fallback
    const initialLat = userCoords?.lat ?? 51.5074;
    const initialLng = userCoords?.lng ?? -0.1278;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: userCoords ? 15 : 12,
      zoomControl: false,
      attributionControl: false
    });

    // Add zoom control at bottom-right position
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Premium CartoDB Voyager tile layer for a colorful map
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 20,
      attribution: '&copy; <a href="https://carto.com/">CartoDB</a>'
    }).addTo(map);

    // Initialize Marker Layer Group
    const markerLayer = L.layerGroup().addTo(map);
    layersRef.current = markerLayer;

    // Handle Map click to update selection coordinates
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      onSelectCoords({ lat, lng });
    });

    mapInstanceRef.current = map;

    // Force map relayout
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 150);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // When user GPS coords become available for the first time, fly the map to them
  const hasAutocentered = useRef(false);
  useEffect(() => {
    if (!mapInstanceRef.current || !userCoords || hasAutocentered.current) return;
    hasAutocentered.current = true;
    mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 15, {
      animate: true,
      duration: 1.5
    });
  }, [userCoords]);

  // Update Markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layersRef.current) return;

    // Clear previous markers
    layersRef.current.clearLayers();

    // 1. Plot User Coordinates (Neon Green)
    if (userCoords) {
      L.marker([userCoords.lat, userCoords.lng], { icon: userIcon })
        .bindPopup("<b style='color:#000;'>My Current Location</b>")
        .addTo(layersRef.current);
    }

    // 2. Plot Current Target Coordinates (White Reticle)
    if (selectedCoords) {
      L.marker([selectedCoords.lat, selectedCoords.lng], { icon: targetIcon })
        .bindPopup(`<div style='color:#000;'><b>Selected Drop Target</b><br/>Lat: ${selectedCoords.lat.toFixed(6)}<br/>Lng: ${selectedCoords.lng.toFixed(6)}</div>`)
        .addTo(layersRef.current);
    }

    // 3. Plot Landmark Points (Yellow/Gold Star)
    landmarks.forEach((landmark) => {
      L.marker([landmark.latitude, landmark.longitude], { icon: landmarkIcon })
        .bindPopup(`
          <div style='color:#000; font-family: sans-serif; max-width: 200px;'>
            <b>${landmark.name}</b> (${landmark.country})<br/>
            <span style='font-size:11px; color:#555;'>${landmark.description}</span>
          </div>
        `)
        .addTo(layersRef.current);
    });

    // 4. Plot Database Pins (Neon Blue with proximity circles)
    pins.forEach((pin) => {
      // Pin Dot
      L.marker([pin.latitude, pin.longitude], { icon: pinIcon })
        .bindPopup(`
          <div style='color:#000; font-family: sans-serif;'>
            <b>${pin.title}</b><br/>
            <span>Author: @${pin.author}</span><br/>
            <span style='font-size:11px; color:#555;'>Radius: ${pin.radius}m</span>
          </div>
        `)
        .addTo(layersRef.current);

      // Gating Radius
      L.circle([pin.latitude, pin.longitude], {
        radius: pin.radius,
        color: "#0070f3",
        weight: 1,
        fillColor: "#0070f3",
        fillOpacity: 0.06
      }).addTo(layersRef.current);
    });
  }, [pins, userCoords, selectedCoords]);

  // Handle Fly-To animation when target changes (e.g., geocoding or landmark quick-access)
  useEffect(() => {
    if (!mapInstanceRef.current || !targetCoords) return;

    mapInstanceRef.current.setView([targetCoords.lat, targetCoords.lng], 14, {
      animate: true,
      duration: 1.5
    });
  }, [targetCoords]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        backgroundColor: "#050505"
      }}
    />
  );
});

export default MapView;
