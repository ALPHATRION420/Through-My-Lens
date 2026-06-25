import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, RefreshCw, UploadCloud, X, Plus, Globe, Lock, Unlock,
  Crosshair, Compass, ChevronDown, Sparkles, Image, Video,
  Radio, AlertCircle, CheckCircle2, Loader2
} from "lucide-react";
import { landmarks } from "../data/landmarks";

// ─── Crystal Glass Design Tokens ────────────────────────────────────────────
const glass = {
  base:    "rgba(255,255,255,0.04)",
  hover:   "rgba(255,255,255,0.07)",
  border:  "rgba(255,255,255,0.10)",
  border2: "rgba(255,255,255,0.06)",
  deep:    "rgba(0,0,0,0.35)",
};

const accent = {
  blue:    "#4F9FFF",
  cyan:    "#00E5FF",
  purple:  "#B47FFF",
  green:   "#39FF14",
  red:     "#FF4C6A",
  glow:    "rgba(79,159,255,0.25)",
  glowCy:  "rgba(0,229,255,0.18)",
  glowPu:  "rgba(180,127,255,0.2)",
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Glowing divider line */
const GlowDivider = ({ color = accent.blue }) => (
  <div style={{
    height: "1px",
    background: `linear-gradient(90deg, transparent, ${color}55, transparent)`,
    margin: "4px 0"
  }} />
);

/** Animated floating label input */
const CrystalInput = ({ label, value, onChange, placeholder, required, type = "text", icon: Icon }) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value;
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        position: "relative",
        borderRadius: "14px",
        border: `1px solid ${active ? accent.blue + "99" : glass.border}`,
        background: active ? `rgba(79,159,255,0.06)` : glass.base,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: active ? `0 0 0 3px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.08)` : `inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}>
        {Icon && (
          <Icon size={14} style={{
            position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
            color: active ? accent.blue : "#555", transition: "color 0.3s", zIndex: 1
          }} />
        )}
        <label style={{
          position: "absolute",
          left: Icon ? "36px" : "14px",
          top: active ? "8px" : "50%",
          transform: active ? "none" : "translateY(-50%)",
          fontSize: active ? "9px" : "13px",
          fontWeight: active ? 700 : 400,
          color: active ? accent.blue : "#555",
          textTransform: active ? "uppercase" : "none",
          letterSpacing: active ? "0.1em" : 0,
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: "none",
          zIndex: 1,
        }}>
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={focused ? placeholder : ""}
          style={{
            display: "block",
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontSize: "13px",
            padding: Icon ? "24px 14px 10px 36px" : "24px 14px 10px",
            borderRadius: "14px",
          }}
        />
      </div>
    </div>
  );
};

/** Crystal textarea */
const CrystalTextarea = ({ label, value, onChange, placeholder, required }) => {
  const [focused, setFocused] = useState(false);
  const active = focused || value;
  return (
    <div style={{
      position: "relative",
      borderRadius: "14px",
      border: `1px solid ${active ? accent.cyan + "88" : glass.border}`,
      background: active ? "rgba(0,229,255,0.04)" : glass.base,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: active ? `0 0 0 3px ${accent.glowCy}, inset 0 1px 0 rgba(255,255,255,0.08)` : `inset 0 1px 0 rgba(255,255,255,0.04)`,
    }}>
      <label style={{
        position: "absolute",
        left: "14px",
        top: active ? "10px" : "16px",
        fontSize: active ? "9px" : "13px",
        fontWeight: active ? 700 : 400,
        color: active ? accent.cyan : "#555",
        textTransform: active ? "uppercase" : "none",
        letterSpacing: active ? "0.1em" : 0,
        transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
        pointerEvents: "none",
      }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={focused ? placeholder : ""}
        rows={3}
        style={{
          display: "block",
          width: "100%",
          background: "transparent",
          border: "none",
          outline: "none",
          color: "#fff",
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          padding: "28px 14px 12px",
          resize: "vertical",
          minHeight: "90px",
          borderRadius: "14px",
          lineHeight: 1.5,
        }}
      />
    </div>
  );
};

/** Crystal pill toggle button */
const PillToggle = ({ options, value, onChange }) => (
  <div style={{
    display: "flex",
    gap: "6px",
    background: glass.deep,
    borderRadius: "12px",
    padding: "4px",
    border: `1px solid ${glass.border2}`,
  }}>
    {options.map(opt => {
      const active = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: "9px",
            border: active ? `1px solid ${opt.color}66` : "1px solid transparent",
            background: active
              ? `linear-gradient(135deg, ${opt.color}22, ${opt.color}11)`
              : "transparent",
            color: active ? opt.color : "#555",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
            boxShadow: active ? `0 0 12px ${opt.color}33` : "none",
          }}
        >
          {opt.icon && <opt.icon size={13} />}
          {opt.label}
        </button>
      );
    })}
  </div>
);

/** Crystal toggle switch */
const GlassToggle = ({ checked, onChange, label, sub, accentColor = accent.blue }) => (
  <div
    onClick={() => onChange(!checked)}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      borderRadius: "14px",
      background: checked ? `${accentColor}10` : glass.base,
      border: `1px solid ${checked ? accentColor + "44" : glass.border2}`,
      cursor: "pointer",
      transition: "all 0.25s",
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      boxShadow: checked ? `0 0 16px ${accentColor}22` : "none",
    }}
  >
    <div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: checked ? "#fff" : "#aaa", transition: "color 0.2s" }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: "10px", color: "#555", marginTop: "2px" }}>{sub}</div>}
    </div>
    {/* Track */}
    <div style={{
      width: "40px",
      height: "22px",
      borderRadius: "11px",
      background: checked ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` : "rgba(255,255,255,0.08)",
      border: `1px solid ${checked ? accentColor + "66" : "rgba(255,255,255,0.1)"}`,
      position: "relative",
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: checked ? `0 0 10px ${accentColor}55` : "none",
      flexShrink: 0,
    }}>
      {/* Thumb */}
      <div style={{
        position: "absolute",
        top: "3px",
        left: checked ? "20px" : "3px",
        width: "14px",
        height: "14px",
        borderRadius: "50%",
        background: "#fff",
        transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
      }} />
    </div>
  </div>
);

/** Crystal landmark selector */
const LandmarkSelector = ({ selectedCoords, setSelectedCoords, setGlobeTarget, setTitle }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? landmarks.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.country.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : landmarks.slice(0, 8);

  const handleSelect = (lm) => {
    setSelectedCoords({ lat: lm.latitude, lng: lm.longitude });
    setGlobeTarget({ lat: lm.latitude, lng: lm.longitude });
    setTitle(lm.name);
    setOpen(false);
    setSearch("");
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "11px 14px",
          borderRadius: "12px",
          background: open ? "rgba(79,159,255,0.08)" : glass.base,
          border: `1px solid ${open ? accent.blue + "77" : glass.border}`,
          color: "#ccc",
          fontSize: "13px",
          cursor: "pointer",
          transition: "all 0.2s",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Compass size={14} style={{ color: accent.blue }} />
          <span>Jump to Landmark</span>
        </span>
        <ChevronDown size={14} style={{
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
          color: "#555"
        }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 200,
              borderRadius: "14px",
              background: "rgba(8,8,18,0.92)",
              border: `1px solid ${glass.border}`,
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              overflow: "hidden",
              boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset`,
            }}
          >
            {/* Search inside dropdown */}
            <div style={{ padding: "10px", borderBottom: `1px solid ${glass.border2}` }}>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search landmarks..."
                style={{
                  width: "100%",
                  background: glass.base,
                  border: `1px solid ${glass.border2}`,
                  borderRadius: "8px",
                  padding: "7px 10px",
                  color: "#fff",
                  fontSize: "12px",
                  outline: "none",
                  fontFamily: "Inter, sans-serif",
                }}
              />
            </div>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {filtered.map(lm => (
                <button
                  key={lm.id}
                  type="button"
                  onClick={() => handleSelect(lm)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    color: "#ccc",
                    cursor: "pointer",
                    fontSize: "12px",
                    textAlign: "left",
                    transition: "background 0.15s",
                    borderBottom: `1px solid ${glass.border2}`,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = glass.hover}
                  onMouseLeave={e => e.currentTarget.style.background = "none"}
                >
                  <MapPin size={12} style={{ color: accent.blue, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#fff" }}>{lm.name}</div>
                    <div style={{ fontSize: "10px", color: "#555" }}>{lm.country}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Media drop-zone */
const MediaDropzone = ({ imageFile, imagePreview, isCloudinaryConfigured, mediaUrl, setMediaUrl, onFileChange, onClear }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileChange(file);
  }, [onFileChange]);

  if (imagePreview) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: `1px solid ${glass.border}`, background: "#000" }}
      >
        <div style={{ height: "150px", overflow: "hidden" }}>
          {imageFile?.type?.startsWith("video/") ? (
            <video src={imagePreview} muted loop autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        {/* Glass overlay bar */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "8px 12px",
          background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <span style={{ fontSize: "10px", color: "#aaa", display: "flex", alignItems: "center", gap: "4px" }}>
            {imageFile?.type?.startsWith("video/") ? <Video size={10} /> : <Image size={10} />}
            {imageFile?.name || "Media selected"}
          </span>
          <button
            type="button"
            onClick={onClear}
            style={{
              width: "22px", height: "22px", borderRadius: "50%",
              background: "rgba(255,255,255,0.12)", border: `1px solid ${glass.border}`,
              color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <X size={10} />
          </button>
        </div>
        {/* Success shimmer badge */}
        <div style={{
          position: "absolute", top: "10px", right: "10px",
          background: "rgba(57,255,20,0.15)", border: "1px solid rgba(57,255,20,0.4)",
          borderRadius: "20px", padding: "3px 8px", fontSize: "9px", color: "#39FF14",
          fontWeight: 700, display: "flex", alignItems: "center", gap: "3px"
        }}>
          <CheckCircle2 size={9} /> Ready
        </div>
      </motion.div>
    );
  }

  if (!isCloudinaryConfigured) {
    return (
      <div style={{
        borderRadius: "14px", border: `1px dashed ${glass.border}`,
        background: glass.base, padding: "12px",
      }}>
        <input
          type="url"
          value={mediaUrl}
          onChange={e => setMediaUrl(e.target.value)}
          placeholder="Paste image/video URL..."
          style={{
            background: "transparent", border: "none", outline: "none",
            color: "#ccc", fontSize: "12px", width: "100%", fontFamily: "Inter, sans-serif"
          }}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        borderRadius: "14px",
        border: `1px dashed ${dragging ? accent.cyan : glass.border}`,
        background: dragging ? "rgba(0,229,255,0.04)" : glass.base,
        padding: "28px 20px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.25s",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        boxShadow: dragging ? `0 0 20px ${accent.glowCy}` : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Shimmer sweep on drag */}
      {dragging && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, transparent 30%, rgba(0,229,255,0.06) 50%, transparent 70%)",
          animation: "sweep 1.5s linear infinite",
          pointerEvents: "none"
        }} />
      )}
      <UploadCloud size={28} style={{ color: dragging ? accent.cyan : "#444", marginBottom: "8px", transition: "color 0.2s" }} />
      <div style={{ fontSize: "12px", color: dragging ? accent.cyan : "#777", fontWeight: 600, transition: "color 0.2s" }}>
        {dragging ? "Drop it!" : "Drag & drop or click to upload"}
      </div>
      <div style={{ fontSize: "10px", color: "#444", marginTop: "4px" }}>
        Images & Videos — powered by Cloudinary
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        onChange={e => { const f = e.target.files[0]; if (f) onFileChange(f); }}
        style={{ display: "none" }}
      />
    </div>
  );
};

/** Radius ring selector */
const RadiusSelector = ({ value, onChange }) => {
  const opts = [
    { value: "15",  label: "15m",  desc: "Hyper-local", color: accent.red },
    { value: "50",  label: "50m",  desc: "Standard",    color: accent.blue },
    { value: "150", label: "150m", desc: "Wide range",   color: accent.purple },
  ];
  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {opts.map(opt => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              padding: "10px 8px",
              borderRadius: "12px",
              border: `1px solid ${active ? opt.color + "77" : glass.border2}`,
              background: active ? `${opt.color}14` : glass.base,
              color: active ? opt.color : "#555",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.2s",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              boxShadow: active ? `0 0 14px ${opt.color}33` : "none",
            }}
          >
            <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "Space Mono, monospace" }}>{opt.label}</div>
            <div style={{ fontSize: "9px", marginTop: "2px", opacity: 0.7 }}>{opt.desc}</div>
          </button>
        );
      })}
    </div>
  );
};

// ─── Coordinate Display ───────────────────────────────────────────────────────
const CoordDisplay = ({ selectedCoords, updateLocation, isRefreshingLocation }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px 16px",
    borderRadius: "14px",
    background: "rgba(57,255,20,0.05)",
    border: "1px solid rgba(57,255,20,0.18)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    boxShadow: "0 0 20px rgba(57,255,20,0.07)",
  }}>
    <div style={{
      width: "8px", height: "8px", borderRadius: "50%",
      background: accent.green,
      boxShadow: `0 0 8px ${accent.green}`,
      animation: "markerPulse 2s infinite ease-in-out",
      flexShrink: 0,
    }} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: "9px", color: "#39FF14", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        Drop Target
      </div>
      <div style={{ fontSize: "12px", color: "#ccc", fontFamily: "Space Mono, monospace", marginTop: "1px" }}>
        {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
      </div>
    </div>
    <button
      type="button"
      onClick={updateLocation}
      disabled={isRefreshingLocation}
      style={{
        display: "flex", alignItems: "center", gap: "4px",
        padding: "6px 10px", borderRadius: "8px",
        background: "rgba(57,255,20,0.08)", border: "1px solid rgba(57,255,20,0.25)",
        color: "#39FF14", fontSize: "10px", fontWeight: 700,
        cursor: isRefreshingLocation ? "not-allowed" : "pointer",
        opacity: isRefreshingLocation ? 0.5 : 1,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      <RefreshCw size={10} style={{ animation: isRefreshingLocation ? "spin 1s linear infinite" : "none" }} />
      {isRefreshingLocation ? "Syncing" : "Sync GPS"}
    </button>
  </div>
);

// ─── Submit Button ────────────────────────────────────────────────────────────
const CrystalSubmitButton = ({ uploading }) => (
  <button
    type="submit"
    disabled={uploading}
    style={{
      width: "100%",
      padding: "15px",
      borderRadius: "16px",
      border: uploading ? `1px solid rgba(79,159,255,0.2)` : `1px solid ${accent.blue}66`,
      background: uploading
        ? "rgba(79,159,255,0.08)"
        : `linear-gradient(135deg, rgba(79,159,255,0.25) 0%, rgba(180,127,255,0.15) 50%, rgba(0,229,255,0.15) 100%)`,
      color: uploading ? "#555" : "#fff",
      fontSize: "14px",
      fontWeight: 700,
      fontFamily: "Space Grotesk, sans-serif",
      cursor: uploading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "10px",
      transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      boxShadow: uploading
        ? "none"
        : `0 0 30px rgba(79,159,255,0.2), 0 0 60px rgba(79,159,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)`,
      letterSpacing: "0.04em",
      position: "relative",
      overflow: "hidden",
    }}
    onMouseEnter={e => {
      if (!uploading) {
        e.currentTarget.style.boxShadow = `0 0 40px rgba(79,159,255,0.35), 0 0 80px rgba(79,159,255,0.12), inset 0 1px 0 rgba(255,255,255,0.15)`;
        e.currentTarget.style.transform = "translateY(-1px)";
      }
    }}
    onMouseLeave={e => {
      if (!uploading) {
        e.currentTarget.style.boxShadow = `0 0 30px rgba(79,159,255,0.2), 0 0 60px rgba(79,159,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12)`;
        e.currentTarget.style.transform = "translateY(0)";
      }
    }}
  >
    {uploading ? (
      <>
        <Loader2 size={16} style={{ animation: "spin 0.8s linear infinite" }} />
        Uploading & Dropping Pin…
      </>
    ) : (
      <>
        <Sparkles size={16} style={{ color: accent.cyan }} />
        Drop Pin on Globe
        <MapPin size={16} style={{ color: accent.purple }} />
      </>
    )}
  </button>
);

// ─── Step Progress Indicator ──────────────────────────────────────────────────
const StepIndicator = ({ step }) => {
  const steps = ["Location", "Content", "Media", "Settings"];
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
      {steps.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <React.Fragment key={s}>
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: "4px"
            }}>
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: done ? accent.green : active ? accent.blue : "#333",
                boxShadow: active ? `0 0 8px ${accent.blue}` : done ? `0 0 6px ${accent.green}66` : "none",
                transition: "all 0.3s",
                flexShrink: 0,
              }} />
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: "1px",
                background: done
                  ? `linear-gradient(90deg, ${accent.green}88, ${accent.blue}55)`
                  : `rgba(255,255,255,0.07)`,
                transition: "background 0.4s",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function CreatePostPanel({
  // State (from Dashboard)
  title, setTitle,
  content, setContent,
  mediaUrl, setMediaUrl,
  radius, setRadius,
  isPublic, setIsPublic,
  allowLocate, setAllowLocate,
  selectedCoords, setSelectedCoords,
  setGlobeTarget,
  imageFile, setImageFile,
  imagePreview, setImagePreview,
  uploading,
  isCloudinaryConfigured,
  isRefreshingLocation,
  updateLocation,
  handleDropPin,
}) {
  // Determine current step for progress indicator
  const step = (() => {
    if (!title && !content) return 0;
    if (title && !content) return 1;
    if (title && content && !imageFile && !imagePreview && !mediaUrl) return 2;
    return 3;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: "0" }}
    >
      {/* ── Hero Header ───────────────────────────────────── */}
      <div style={{
        padding: "20px 20px 16px",
        background: `linear-gradient(180deg, rgba(79,159,255,0.06) 0%, transparent 100%)`,
        borderBottom: `1px solid ${glass.border2}`,
      }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: `linear-gradient(135deg, ${accent.blue}33, ${accent.purple}22)`,
                border: `1px solid ${accent.blue}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <MapPin size={14} style={{ color: accent.blue }} />
              </div>
              <h3 style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "17px", fontWeight: 800,
                background: `linear-gradient(135deg, #fff 0%, ${accent.cyan} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                margin: 0,
              }}>
                Drop a Pin
              </h3>
            </div>
            <p style={{ fontSize: "11px", color: "#555", margin: 0, paddingLeft: "36px" }}>
              Anchor your memory to a point in 3D space
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} />
      </div>

      {/* ── Scrollable Form Body ─────────────────────────── */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px 20px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}>
        <form onSubmit={handleDropPin} style={{ display: "contents" }}>

          {/* SECTION 1 — Location ─────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              📍 Location
            </div>

            <LandmarkSelector
              selectedCoords={selectedCoords}
              setSelectedCoords={setSelectedCoords}
              setGlobeTarget={setGlobeTarget}
              setTitle={setTitle}
            />

            <CoordDisplay
              selectedCoords={selectedCoords}
              updateLocation={updateLocation}
              isRefreshingLocation={isRefreshingLocation}
            />
          </div>

          <GlowDivider color={accent.blue} />

          {/* SECTION 2 — Content ─────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              ✏️ Content
            </div>

            <CrystalInput
              label="Post Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="E.g., Sunrise over the Alps"
              required
              icon={Sparkles}
            />

            <CrystalTextarea
              label="Description"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What did you capture through your lens?"
              required
            />
          </div>

          <GlowDivider color={accent.cyan} />

          {/* SECTION 3 — Media ─────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              🎨 Media
            </div>
            <MediaDropzone
              imageFile={imageFile}
              imagePreview={imagePreview}
              isCloudinaryConfigured={isCloudinaryConfigured}
              mediaUrl={mediaUrl}
              setMediaUrl={setMediaUrl}
              onFileChange={file => {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
              }}
              onClear={() => { setImageFile(null); setImagePreview(null); }}
            />
          </div>

          <GlowDivider color={accent.purple} />

          {/* SECTION 4 — Settings ─────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: "#444", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              ⚙️ Settings
            </div>

            {/* Privacy toggle */}
            <PillToggle
              value={isPublic ? "public" : "private"}
              onChange={v => {
                setIsPublic(v === "public");
                if (v === "private") setAllowLocate(false);
              }}
              options={[
                { value: "public",  label: "Public",  icon: Globe,  color: accent.blue },
                { value: "private", label: "Private", icon: Lock,   color: accent.red  },
              ]}
            />

            {/* Allow locate toggle (public only) */}
            <AnimatePresence>
              {isPublic && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <GlassToggle
                    checked={allowLocate}
                    onChange={setAllowLocate}
                    label="Allow Globe Locate"
                    sub="Let others fly the camera to this pin"
                    accentColor={accent.cyan}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Proximity radius */}
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                marginBottom: "8px", fontSize: "11px", color: "#666"
              }}>
                <Radio size={11} style={{ color: accent.purple }} />
                <span style={{ fontWeight: 600 }}>Proximity Activation Radius</span>
              </div>
              <RadiusSelector value={radius} onChange={setRadius} />
            </div>
          </div>

          {/* ── Submit ─────────── */}
          <div style={{ marginTop: "4px" }}>
            <CrystalSubmitButton uploading={uploading} />
          </div>

        </form>
      </div>
    </motion.div>
  );
}
