import React from "react";
import { motion } from "framer-motion";
import { MapPin, RefreshCw, Compass, Radio } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const glass = {
  base:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  deep:   "rgba(0,0,0,0.35)",
};
const accent = {
  blue:   "#4F9FFF",
  cyan:   "#00E5FF",
  green:  "#39FF14",
};

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{ fontSize:"9px", fontWeight:700, color:"#444", textTransform:"uppercase", letterSpacing:"0.12em", display:"flex", alignItems:"center", gap:"6px" }}>
    {children}
  </div>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ message }) => (
  <div style={{ background:glass.base, border:`1px dashed ${glass.border}`, borderRadius:"16px", padding:"28px 20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:"12px" }}>
    {/* Animated sonar ring */}
    <div style={{ position:"relative", width:"44px", height:"44px", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <style>{`
        @keyframes sonar {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
      <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`1px solid ${accent.cyan}55`, animation:"sonar 2s ease-out infinite" }} />
      <Radio size={18} style={{ color:"#444", position:"relative", zIndex:1 }} />
    </div>
    <p style={{ fontSize:"12px", color:"#555", margin:0, lineHeight:1.5 }}>{message}</p>
  </div>
);

// ── Custom range track ────────────────────────────────────────────────────────
function CrystalRangeSlider({ min, max, step, value, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ position:"relative", userSelect:"none" }}>
      {/* Visual track */}
      <div style={{ height:"4px", borderRadius:"2px", background:"rgba(255,255,255,0.08)", position:"relative", overflow:"visible" }}>
        <div style={{
          position:"absolute", left:0, top:0, height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg,${accent.cyan},${accent.blue})`,
          borderRadius:"2px",
          boxShadow:`0 0 10px rgba(0,229,255,0.4)`,
          transition:"width 0.08s",
        }} />
        {/* Thumb visual */}
        <div style={{
          position:"absolute", top:"50%", left:`${pct}%`,
          transform:"translate(-50%,-50%)",
          width:"16px", height:"16px", borderRadius:"50%",
          background:`linear-gradient(135deg,${accent.cyan},${accent.blue})`,
          border:"2px solid rgba(255,255,255,0.3)",
          boxShadow:`0 0 12px rgba(79,159,255,0.5)`,
          pointerEvents:"none",
          transition:"left 0.08s",
        }} />
      </div>
      {/* Native range (invisible, on top for interaction) */}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{
          position:"absolute", left:0, right:0, top:"-8px",
          width:"100%", height:"20px", opacity:0.01,
          cursor:"pointer", margin:0, zIndex:2,
        }}
      />
    </div>
  );
}

// ── GPS display ───────────────────────────────────────────────────────────────
function GPSDisplay({ userCoords, updateLocation, isRefreshingLocation }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:"10px", padding:"12px 16px",
      borderRadius:"14px", background:"rgba(57,255,20,0.05)",
      border:"1px solid rgba(57,255,20,0.18)", backdropFilter:"blur(10px)",
      WebkitBackdropFilter:"blur(10px)", boxShadow:"0 0 20px rgba(57,255,20,0.06)",
    }}>
      <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:accent.green, boxShadow:`0 0 8px ${accent.green}`, animation:"markerPulse 2s infinite ease-in-out", flexShrink:0 }} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize:"9px", color:accent.green, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em" }}>Your GPS</div>
        <div style={{ fontSize:"11px", color:"#ccc", fontFamily:"Space Mono,monospace", marginTop:"1px" }}>
          {userCoords ? `${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}` : "Detecting location…"}
        </div>
      </div>
      <button
        type="button" onClick={updateLocation} disabled={isRefreshingLocation}
        style={{ display:"flex", alignItems:"center", gap:"4px", padding:"6px 10px", borderRadius:"8px", background:"rgba(57,255,20,0.08)", border:"1px solid rgba(57,255,20,0.25)", color:accent.green, fontSize:"10px", fontWeight:700, cursor: isRefreshingLocation ? "not-allowed" : "pointer", opacity: isRefreshingLocation ? 0.5 : 1, transition:"all 0.2s", whiteSpace:"nowrap" }}
      >
        <RefreshCw size={10} style={{ animation: isRefreshingLocation ? "spin 1s linear infinite" : "none" }} />
        {isRefreshingLocation ? "Syncing" : "Refresh"}
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SearchPanel({
  userCoords, nearbyPins, searchNearRadius, setSearchNearRadius,
  updateLocation, isRefreshingLocation,
  setSelectedCoords, setGlobeTarget,
}) {
  const formatRadius = (r) => r >= 1000 ? `${(r / 1000).toFixed(1)} km` : `${r} m`;

  function calcDist(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180, φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180, Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}
      style={{ display:"flex", flexDirection:"column", gap:"16px" }}
    >
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily:"Space Grotesk,sans-serif", fontSize:"17px", fontWeight:800, margin:"0 0 3px",
          background:`linear-gradient(135deg,#fff,${accent.cyan})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>Search Around You</h3>
        <p style={{ color:"#555", fontSize:"11px", margin:0 }}>Discover posts within your proximity.</p>
      </div>

      {/* GPS display */}
      <GPSDisplay userCoords={userCoords} updateLocation={updateLocation} isRefreshingLocation={isRefreshingLocation} />

      {/* Radius control */}
      <div style={{ display:"flex", flexDirection:"column", gap:"12px", padding:"16px", borderRadius:"16px", background:glass.base, border:`1px solid ${glass.border}`, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:"12px", fontWeight:700, color:"#bbb" }}>Discovery Radius</span>
          <span style={{
            fontSize:"13px", fontWeight:800, fontFamily:"Space Mono,monospace",
            color: accent.cyan, textShadow:`0 0 12px ${accent.cyan}88`,
          }}>
            {formatRadius(searchNearRadius)}
          </span>
        </div>
        <CrystalRangeSlider min={50} max={50000} step={50} value={searchNearRadius} onChange={setSearchNearRadius} />
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"9px", color:"#444", marginTop:"4px" }}>
          <span>50 m</span><span>50 km</span>
        </div>
      </div>

      {/* Results */}
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        <SectionLabel>
          <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:accent.cyan, boxShadow:`0 0 6px ${accent.cyan}` }} />
          {nearbyPins.length} in range
        </SectionLabel>

        {nearbyPins.length === 0
          ? <EmptyState message="No posts found in this range. Try increasing the discovery radius." />
          : nearbyPins.map(pin => {
              const dist = userCoords ? calcDist(userCoords.lat, userCoords.lng, pin.latitude, pin.longitude) : 0;
              const distStr = dist < 1000 ? `${Math.round(dist)}m` : `${(dist/1000).toFixed(1)}km`;
              return (
                <motion.div key={pin.id} layout
                  style={{
                    background:"rgba(255,255,255,0.025)", border:`1px solid ${glass.border}`,
                    borderRadius:"14px", padding:"14px",
                    backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
                    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)",
                    transition:"border-color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.14)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor=glass.border}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                    <span style={{ fontWeight:700, fontSize:"13px", color:"#fff" }}>{pin.title}</span>
                    {/* Distance badge */}
                    <span style={{
                      fontSize:"10px", fontWeight:800, fontFamily:"Space Mono,monospace",
                      color:accent.cyan, background:"rgba(0,229,255,0.08)",
                      border:`1px solid rgba(0,229,255,0.2)`, padding:"2px 8px", borderRadius:"20px",
                      boxShadow:`0 0 8px rgba(0,229,255,0.2)`,
                    }}>{distStr}</span>
                  </div>
                  <p style={{ fontSize:"11px", color:"#888", margin:"0 0 10px", lineHeight:1.5 }}>{pin.content}</p>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:"10px", color:"#555" }}>@{pin.authorUsername}</span>
                    <button
                      onClick={() => { setSelectedCoords({ lat:pin.latitude, lng:pin.longitude }); setGlobeTarget({ lat:pin.latitude, lng:pin.longitude }); }}
                      style={{ display:"flex", alignItems:"center", gap:"4px", background:"none", border:"none", cursor:"pointer", color:accent.blue, fontSize:"11px", fontWeight:700, padding:0, transition:"color 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = accent.cyan}
                      onMouseLeave={e => e.currentTarget.style.color = accent.blue}
                    >
                      <Compass size={12} /> Focus
                    </button>
                  </div>
                </motion.div>
              );
            })
        }
      </div>
    </motion.div>
  );
}
