import React, { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Loader2, Save, User, FileText } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const glass = {
  base:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
};
const accent = {
  blue:   "#4F9FFF",
  cyan:   "#00E5FF",
  purple: "#B47FFF",
};

// ── Floating label input ──────────────────────────────────────────────────────
function CrystalInput({ label, value, onChange, required, type = "text", icon: Icon }) {
  const [focused, setFocused] = useState(false);
  const active = focused || value;
  return (
    <div style={{
      borderRadius:"14px",
      border:`1px solid ${active ? accent.blue + "99" : glass.border}`,
      background: active ? "rgba(79,159,255,0.06)" : glass.base,
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      boxShadow: active ? `0 0 0 3px rgba(79,159,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08)` : "inset 0 1px 0 rgba(255,255,255,0.04)",
      transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)",
      position:"relative",
    }}>
      {Icon && <Icon size={13} style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)", color: active ? accent.blue : "#555", transition:"color 0.3s", zIndex:1 }} />}
      <label style={{
        position:"absolute", left: Icon ? "36px" : "14px",
        top: active ? "8px" : "50%", transform: active ? "none" : "translateY(-50%)",
        fontSize: active ? "9px" : "13px", fontWeight: active ? 700 : 400,
        color: active ? accent.blue : "#555",
        textTransform: active ? "uppercase" : "none",
        letterSpacing: active ? "0.1em" : 0,
        transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)", pointerEvents:"none", zIndex:1,
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ display:"block", width:"100%", background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"Inter,sans-serif", fontSize:"13px", padding: Icon ? "24px 14px 10px 36px" : "24px 14px 10px", borderRadius:"14px" }}
      />
    </div>
  );
}

// ── Floating label textarea ───────────────────────────────────────────────────
function CrystalTextarea({ label, value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  const active = focused || value;
  return (
    <div style={{
      borderRadius:"14px",
      border:`1px solid ${active ? accent.cyan + "88" : glass.border}`,
      background: active ? "rgba(0,229,255,0.04)" : glass.base,
      backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)",
      boxShadow: active ? `0 0 0 3px rgba(0,229,255,0.10), inset 0 1px 0 rgba(255,255,255,0.08)` : "inset 0 1px 0 rgba(255,255,255,0.04)",
      transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)", position:"relative",
    }}>
      <label style={{
        position:"absolute", left:"14px",
        top: active ? "10px" : "18px", fontSize: active ? "9px" : "13px",
        fontWeight: active ? 700 : 400, color: active ? accent.cyan : "#555",
        textTransform: active ? "uppercase" : "none", letterSpacing: active ? "0.1em" : 0,
        transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)", pointerEvents:"none",
      }}>{label}</label>
      <textarea
        value={value} onChange={onChange} rows={3}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={focused ? placeholder : ""}
        style={{ display:"block", width:"100%", background:"transparent", border:"none", outline:"none", color:"#fff", fontFamily:"Inter,sans-serif", fontSize:"13px", padding:"28px 14px 12px", resize:"vertical", minHeight:"90px", borderRadius:"14px", lineHeight:1.5 }}
      />
    </div>
  );
}

// ── Avatar ring ───────────────────────────────────────────────────────────────
function AvatarPicker({ profilePicPreview, onChange }) {
  const [hovering, setHovering] = useState(false);
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
      <label
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{ position:"relative", cursor:"pointer", borderRadius:"50%", width:"88px", height:"88px", flexShrink:0 }}
      >
        {/* Glow ring */}
        <div style={{
          position:"absolute", inset:"-4px", borderRadius:"50%",
          background:`linear-gradient(135deg,${accent.blue},${accent.purple},${accent.cyan})`,
          padding:"2px", transition:"opacity 0.3s",
          opacity: hovering ? 1 : 0.6,
          boxShadow: hovering ? `0 0 24px rgba(79,159,255,0.5)` : `0 0 16px rgba(79,159,255,0.25)`,
        }}>
          <div style={{ borderRadius:"50%", width:"100%", height:"100%", background:"#0a0a0a", overflow:"hidden" }}>
            <img
              src={profilePicPreview || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"}
              alt="Avatar"
              style={{ width:"100%", height:"100%", objectFit:"cover", transition:"filter 0.2s", filter: hovering ? "brightness(0.65)" : "none" }}
            />
          </div>
        </div>
        {/* Camera overlay */}
        <div style={{
          position:"absolute", inset:0, borderRadius:"50%",
          display:"flex", alignItems:"center", justifyContent:"center",
          opacity: hovering ? 1 : 0, transition:"opacity 0.2s",
        }}>
          <Camera size={22} style={{ color:"#fff", filter:"drop-shadow(0 0 4px rgba(0,0,0,0.8))" }} />
        </div>
        <input type="file" accept="image/*" onChange={onChange} style={{ display:"none" }} />
      </label>
      <span style={{ fontSize:"10px", color:"#555" }}>Click avatar to change photo</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProfilePanel({
  profile, editUsername, setEditUsername,
  editBio, setEditBio,
  profilePicPreview, setProfilePicPreview,
  profileFile, setProfileFile,
  savingProfile, handleSaveProfile,
}) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}
      style={{ display:"flex", flexDirection:"column", gap:"18px" }}
    >
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily:"Space Grotesk,sans-serif", fontSize:"17px", fontWeight:800, margin:"0 0 3px",
          background:`linear-gradient(135deg,#fff,${accent.purple})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>Edit Profile</h3>
        <p style={{ color:"#555", fontSize:"11px", margin:0 }}>Update your identity on the geospatial grid.</p>
      </div>

      <form onSubmit={handleSaveProfile} style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
        {/* Avatar */}
        <AvatarPicker
          profilePicPreview={profilePicPreview}
          onChange={e => {
            const file = e.target.files[0];
            if (file) { setProfileFile(file); setProfilePicPreview(URL.createObjectURL(file)); }
          }}
        />

        {/* Fields */}
        <CrystalInput
          label="Username"
          value={editUsername}
          onChange={e => setEditUsername(e.target.value.replace(/\s+/g, "_"))}
          required
          icon={User}
        />

        <CrystalTextarea
          label="Bio"
          value={editBio}
          onChange={e => setEditBio(e.target.value)}
          placeholder="Write a brief bio about yourself…"
        />

        {/* Save button */}
        <button
          type="submit" disabled={savingProfile}
          style={{
            width:"100%", padding:"14px", borderRadius:"14px",
            border: savingProfile ? "1px solid rgba(180,127,255,0.2)" : `1px solid ${accent.purple}66`,
            background: savingProfile
              ? "rgba(180,127,255,0.06)"
              : `linear-gradient(135deg,rgba(180,127,255,0.22) 0%,rgba(79,159,255,0.14) 50%,rgba(0,229,255,0.12) 100%)`,
            color: savingProfile ? "#555" : "#fff",
            fontSize:"14px", fontWeight:700, fontFamily:"Space Grotesk,sans-serif",
            cursor: savingProfile ? "not-allowed" : "pointer",
            display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
            backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
            boxShadow: savingProfile ? "none" : `0 0 28px rgba(180,127,255,0.2), inset 0 1px 0 rgba(255,255,255,0.10)`,
            transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)",
            letterSpacing:"0.04em",
          }}
          onMouseEnter={e => { if(!savingProfile){ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow=`0 0 40px rgba(180,127,255,0.32),inset 0 1px 0 rgba(255,255,255,0.14)`; }}}
          onMouseLeave={e => { if(!savingProfile){ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=`0 0 28px rgba(180,127,255,0.2),inset 0 1px 0 rgba(255,255,255,0.10)`; }}}
        >
          {savingProfile
            ? <><Loader2 size={15} style={{ animation:"spin 0.8s linear infinite" }}/> Saving…</>
            : <><Save size={15}/> Save Changes</>
          }
        </button>
      </form>
    </motion.div>
  );
}
