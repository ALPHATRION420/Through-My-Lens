import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import Globe from "globe.gl";
import { landmarks } from "../data/landmarks";

// Helper to create a 1x1 solid color data URL
const getSolidColorDataUri = (hex) => {
  if (typeof document === "undefined") return "";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = hex;
      ctx.fillRect(0, 0, 1, 1);
      return canvas.toDataURL("image/png");
    }
  } catch (e) {
    console.error("Failed to create color data URI:", e);
  }
  // Fallback to transparent 1x1 pixel PNG data URI
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
};

// Helper to calculate centroid of polygon/multipolygon for text label placement
const getCentroid = (feature) => {
  try {
    const geom = feature.geometry;
    if (!geom) return null;
    let latSum = 0, lngSum = 0, count = 0;
    
    const traverse = (arr) => {
      if (arr.length === 2 && typeof arr[0] === "number" && typeof arr[1] === "number") {
        lngSum += arr[0];
        latSum += arr[1];
        count++;
      } else {
        for (let i = 0; i < arr.length; i++) {
          traverse(arr[i]);
        }
      }
    };
    
    traverse(geom.coordinates);
    if (count > 0) {
      return { lat: latSum / count, lng: lngSum / count };
    }
  } catch (e) {
    console.error("Centroid calculation error:", e);
  }
  return null;
};

const GlobeView = forwardRef(function GlobeView(
  { pins, userCoords, selectedCoords, onSelectCoords, onPostClick, targetCoords, theme },
  ref
) {
  const globeContainerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const [countriesData, setCountriesData] = useState([]);

  // Expose recenterToUser() to parent via ref
  useImperativeHandle(ref, () => ({
    recenterToUser() {
      if (!globeInstanceRef.current || !userCoords) return;
      globeInstanceRef.current.pointOfView({
        lat: userCoords.lat,
        lng: userCoords.lng,
        altitude: 1.5
      }, 1500); // 1.5s fly-to animation
    }
  }));

  // Initialize Globe
  useEffect(() => {
    if (!globeContainerRef.current) return;
    if (globeInstanceRef.current) return; // Prevent double-initialization in React 19

    const initialLat = userCoords?.lat ?? 51.5074;
    const initialLng = userCoords?.lng ?? -0.1278;

    const globe = Globe()(globeContainerRef.current)
      .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
      .backgroundImageUrl("//unpkg.com/three-globe/example/img/night-sky.png")
      .showAtmosphere(true)
      .atmosphereColor("#6ca5ff")
      .atmosphereAltitude(0.18)
      .onGlobeClick(({ lat, lng }) => {
        onSelectCoords({ lat, lng });
      })
      .onPointClick((point) => {
        if (point && point.lat !== undefined && point.lng !== undefined) {
          onSelectCoords({ lat: point.lat, lng: point.lng });
        }
      });

    // Custom controls settings (zoom speed, etc)
    const controls = globe.controls();
    if (controls) {
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 180; // Min zoom in
      controls.maxDistance = 500; // Max zoom out
    }

    globeInstanceRef.current = globe;

    // Set initial viewpoint
    globe.pointOfView({
      lat: initialLat,
      lng: initialLng,
      altitude: userCoords ? 1.5 : 2.5
    }, 0);

    // Handle resizing
    const handleResize = () => {
      if (globeContainerRef.current) {
        const width = globeContainerRef.current.clientWidth;
        const height = globeContainerRef.current.clientHeight;
        globe.width(width).height(height);
      }
    };

    window.addEventListener("resize", handleResize);
    // Initial size correction
    setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (globeInstanceRef.current) {
        globeInstanceRef.current.pointsData([]);
        globeInstanceRef.current.ringsData([]);
      }
    };
  }, []);

  // When user GPS coords become available for the first time, fly the globe camera to them
  const hasAutocentered = useRef(false);
  useEffect(() => {
    if (!globeInstanceRef.current || !userCoords || hasAutocentered.current) return;
    hasAutocentered.current = true;
    globeInstanceRef.current.pointOfView({
      lat: userCoords.lat,
      lng: userCoords.lng,
      altitude: 1.5
    }, 1800);
  }, [userCoords]);

  // 1. Setup Theme Base, Polygons, and Static Country Labels (runs only on theme or countriesData change; avoids lag)
  useEffect(() => {
    if (!globeInstanceRef.current) return;

    if (theme === "vector") {
      const darkPixel = getSolidColorDataUri("#0b0e14");
      const transparentPixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      
      globeInstanceRef.current
        .globeImageUrl(darkPixel)
        .bumpImageUrl(transparentPixel)
        .showAtmosphere(false);

      const applyPolygonsAndLabels = (features) => {
        // Draw country boundaries (polygons)
        globeInstanceRef.current
          .polygonsData(features)
          .polygonCapColor(() => "rgba(20, 24, 33, 0.95)")
          .polygonSideColor(() => "rgba(255, 255, 255, 0.05)")
          .polygonStrokeColor(() => "rgba(255, 255, 255, 0.12)")
          .polygonAltitude(0.001) // Render slightly above globe surface
          .polygonLabel(({ properties: d }) => d ? `<b>${d.ADMIN || "Unknown"}</b>` : "");

        // Generate static labels for major countries (LABELRANK <= 3) to put names on top of them
        const labelList = features
          .filter(f => f.properties && f.properties.LABELRANK <= 3)
          .map(f => {
            const centroid = getCentroid(f);
            if (!centroid) return null;
            return {
              lat: centroid.lat,
              lng: centroid.lng,
              text: f.properties.NAME || f.properties.ADMIN
            };
          })
          .filter(Boolean);

        globeInstanceRef.current
          .labelsData(labelList)
          .labelLat(d => d.lat)
          .labelLng(d => d.lng)
          .labelText(d => d.text)
          .labelSize(0.65)
          .labelColor(() => "rgba(255, 255, 255, 0.45)")
          .labelDotRadius(0) // Hide individual dots, show text directly
          .labelResolution(2)
          .labelAltitude(0.004); // Render labels slightly above polygon caps to prevent clipping
      };

      if (countriesData.length === 0) {
        fetch("https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson")
          .then(res => res.json())
          .then(countries => {
            setCountriesData(countries.features);
            applyPolygonsAndLabels(countries.features);
          })
          .catch(err => console.error("Failed to load country polygons:", err));
      } else {
        applyPolygonsAndLabels(countriesData);
      }
    } else {
      // Realistic Theme - Reset to default earth texture & clear polygon/labels layer
      globeInstanceRef.current
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .showAtmosphere(true)
        .atmosphereColor("#6ca5ff")
        .atmosphereAltitude(0.18)
        .polygonsData([])
        .labelsData([]);
    }
  }, [theme, countriesData]);

  // 2. Setup Arcs (only when theme, pins, or user location changes; highly optimized/lightweight)
  useEffect(() => {
    if (!globeInstanceRef.current) return;

    if (theme === "vector") {
      const arcs = [];
      if (userCoords) {
        const targets = [...pins, ...landmarks].slice(0, 15);
        targets.forEach((target, index) => {
          const targetLat = target.latitude ?? target.lat;
          const targetLng = target.longitude ?? target.lng;
          if (targetLat && targetLng) {
            arcs.push({
              startLat: userCoords.lat,
              startLng: userCoords.lng,
              endLat: targetLat,
              endLng: targetLng,
              color: index % 2 === 0 ? "rgba(0, 112, 243, 0.6)" : "rgba(57, 255, 20, 0.6)"
            });
          }
        });
      } else {
        for (let i = 0; i < landmarks.length - 1; i++) {
          arcs.push({
            startLat: landmarks[i].latitude,
            startLng: landmarks[i].longitude,
            endLat: landmarks[i + 1].latitude,
            endLng: landmarks[i + 1].longitude,
            color: "rgba(0, 112, 243, 0.5)"
          });
        }
      }

      globeInstanceRef.current
        .arcsData(arcs)
        .arcStartLat(d => d.startLat)
        .arcStartLng(d => d.startLng)
        .arcEndLat(d => d.endLat)
        .arcEndLng(d => d.endLng)
        .arcColor(d => d.color)
        .arcAltitude(0.2)
        .arcStroke(0.4)
        .arcDashLength(0.3)
        .arcDashGap(3)
        .arcDashAnimateTime(2000);
    } else {
      globeInstanceRef.current.arcsData([]);
    }
  }, [theme, pins, userCoords]);

  // Update Globe data when pins, selectedCoords, or userCoords change
  useEffect(() => {
    if (!globeInstanceRef.current) return;

    const allPoints = [];

    // 1. Historic Tourist Landmarks (yellow points/short cylinders)
    landmarks.forEach((landmark) => {
      // Visible core
      allPoints.push({
        lat: landmark.latitude,
        lng: landmark.longitude,
        color: "#ffc107",
        radius: 0.15,
        altitude: 0.04,
        label: `<b>★ Landmark: ${landmark.name}</b><br>${landmark.country}<br>${landmark.description}`
      });
      // Invisible hot space
      allPoints.push({
        lat: landmark.latitude,
        lng: landmark.longitude,
        color: "rgba(0, 0, 0, 0)",
        radius: 0.65,
        altitude: 0.04,
        label: `<b>★ Landmark: ${landmark.name}</b><br>${landmark.country}<br>${landmark.description}`
      });
    });

    // 2. Current User Location (Neon Green Bar)
    if (userCoords) {
      // Visible core
      allPoints.push({
        lat: userCoords.lat,
        lng: userCoords.lng,
        color: "#39ff14",
        radius: 0.25,
        altitude: 0.1,
        label: "<b>My Current Location</b>"
      });
      // Invisible hot space
      allPoints.push({
        lat: userCoords.lat,
        lng: userCoords.lng,
        color: "rgba(0, 0, 0, 0)",
        radius: 0.85,
        altitude: 0.1,
        label: "<b>My Current Location</b>"
      });
    }

    // 3. Currently Selected Target Coordinates (White Bar)
    if (selectedCoords) {
      // Visible core
      allPoints.push({
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        color: "#ffffff",
        radius: 0.18,
        altitude: 0.08,
        label: `<b>Drop Target Coordinates</b><br>Latitude: ${selectedCoords.lat.toFixed(4)}<br>Longitude: ${selectedCoords.lng.toFixed(4)}`
      });
      // Invisible hot space
      allPoints.push({
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        color: "rgba(0, 0, 0, 0)",
        radius: 0.70,
        altitude: 0.08,
        label: `<b>Drop Target Coordinates</b><br>Latitude: ${selectedCoords.lat.toFixed(4)}<br>Longitude: ${selectedCoords.lng.toFixed(4)}`
      });
    }

    // 4. Public Posts (Yellow Bar) & Private Posts (Red Bar)
    pins.forEach((pin) => {
      // If it is public, only render on the globe if the author opted in to location sharing
      if (pin.isPublic && !pin.allowLocate) return;

      const isPublicPost = pin.isPublic;
      const color = isPublicPost ? "#ffcc00" : "#ff3333";
      const privacyLabel = isPublicPost ? "Public Interaction" : "Private Interaction (Friends Only)";
      const labelText = `
        <div class="hover-card-content">
          <b>${pin.title}</b>
          <i>${privacyLabel}</i>
          <div class="hover-card-author">
            <img src="${pin.authorProfilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40'}" alt=""/>
            <span>@${pin.authorUsername}</span>
          </div>
          <p>${pin.content.substring(0, 100)}${pin.content.length > 100 ? '...' : ''}</p>
          <span class="hover-card-hint">Click to expand</span>
        </div>
      `;

      // Visible core
      allPoints.push({
        lat: pin.latitude,
        lng: pin.longitude,
        color: color,
        radius: 0.2,
        altitude: 0.15,
        label: labelText,
        pin: pin
      });
      // Invisible hot space
      allPoints.push({
        lat: pin.latitude,
        lng: pin.longitude,
        color: "rgba(0, 0, 0, 0)",
        radius: 0.75,
        altitude: 0.15,
        label: labelText,
        pin: pin
      });
    });

    globeInstanceRef.current
      .pointsData(allPoints)
      .pointLat(d => d.lat)
      .pointLng(d => d.lng)
      .pointColor(d => d.color)
      .pointRadius(d => d.radius)
      .pointAltitude(d => d.altitude)
      .pointLabel(d => d.label)
      .onPointClick((point) => {
        if (point && point.pin && onPostClick) {
          onPostClick(point.pin);
        } else if (point && point.lat !== undefined && point.lng !== undefined) {
          onSelectCoords({ lat: point.lat, lng: point.lng });
        }
      });

    // Ripple concentric rings for active posts
    globeInstanceRef.current
      .ringsData(pins.filter(p => !p.isPublic || p.allowLocate).map(pin => ({
        lat: pin.latitude,
        lng: pin.longitude,
        maxR: Math.min(6, pin.radius / 15),
        color: pin.isPublic ? "#ffcc00" : "#ff3333"
      })))
      .ringColor(d => d.color)
      .ringMaxRadius(d => d.maxR)
      .ringPropagationSpeed(1.2)
      .ringRepeatPeriod(1800);

  }, [pins, userCoords, selectedCoords]);

  // Smooth camera relocation when targetCoords change (e.g. on geocode search)
  useEffect(() => {
    if (!globeInstanceRef.current || !targetCoords) return;

    globeInstanceRef.current.pointOfView({
      lat: targetCoords.lat,
      lng: targetCoords.lng,
      altitude: 1.5
    }, 1800); // 1.8s fly-to animation

  }, [targetCoords]);

  return (
    <div
      ref={globeContainerRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        overflow: "hidden"
      }}
    />
  );
});

export default GlobeView;
