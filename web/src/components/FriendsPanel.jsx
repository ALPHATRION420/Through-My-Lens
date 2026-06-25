import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Search, UserPlus, UserMinus, Users, Loader2 } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const glass = {
  base:   "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  deep:   "rgba(0,0,0,0.35)",
};
const accent = {
  blue:   "#4F9FFF",
  cyan:   "#00E5FF",
  purple: "#B47FFF",
  red:    "#FF4C6A",
  green:  "#39FF14",
};

// ── Crystal input ─────────────────────────────────────────────────────────────
function CrystalInput({ value, onChange, placeholder, icon: Icon }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      position:"relative", flex:1, borderRadius:"12px",
      border:`1px solid ${focused ? accent.blue + "77" : glass.border}`,
      background: focused ? "rgba(79,159,255,0.05)" : glass.base,
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      boxShadow: focused ? `0 0 0 3px rgba(79,159,255,0.10)` : "none",
      transition:"all 0.2s",
    }}>
      {Icon && <Icon size={13} style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", color: focused ? accent.blue : "#444", transition:"color 0.2s" }} />}
      <input
        type="text" value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"#ccc", fontSize:"12px", padding: Icon ? "9px 10px 9px 30px" : "9px 12px", fontFamily:"Inter,sans-serif", borderRadius:"12px" }}
      />
    </div>
  );
}

// ── Crystal action button ─────────────────────────────────────────────────────
function CrystalButton({ onClick, disabled, children, accentColor = accent.blue, type = "button" }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{
        padding:"9px 14px", borderRadius:"12px", border:`1px solid ${accentColor}55`,
        background:`linear-gradient(135deg,${accentColor}20,${accentColor}10)`,
        color: disabled ? "#444" : "#fff", fontSize:"12px", fontWeight:700,
        cursor: disabled ? "not-allowed" : "pointer",
        display:"flex", alignItems:"center", gap:"6px",
        backdropFilter:"blur(8px)", transition:"all 0.2s",
        boxShadow: disabled ? "none" : `0 0 12px ${accentColor}22`,
        fontFamily:"Inter,sans-serif",
        flexShrink:0,
      }}
      onMouseEnter={e => { if(!disabled) { e.currentTarget.style.boxShadow=`0 0 20px ${accentColor}44`; e.currentTarget.style.transform="translateY(-1px)"; }}}
      onMouseLeave={e => { if(!disabled) { e.currentTarget.style.boxShadow=`0 0 12px ${accentColor}22`; e.currentTarget.style.transform="none"; }}}
    >
      {children}
    </button>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyFriends = () => (
  <div style={{ background:glass.base, border:`1px dashed ${glass.border}`, borderRadius:"16px", padding:"28px 20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
    <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:"rgba(180,127,255,0.06)", border:"1px solid rgba(180,127,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Users size={18} style={{ color:"#444" }} />
    </div>
    <p style={{ fontSize:"12px", color:"#555", margin:0, lineHeight:1.5 }}>No friends yet.<br/>Search by UID or username to connect.</p>
  </div>
);

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children, color = "#444" }) => (
  <div style={{ fontSize:"9px", fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.12em", display:"flex", alignItems:"center", gap:"6px" }}>
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function FriendsPanel({
  profile, user,
  friendSearchQuery, setFriendSearchQuery,
  friendSearchResult, friendSearchLoading, friendSearchError,
  handleSearchFriend, handleAddFriend, handleRemoveFriend,
  friendsList, copiedUid, handleCopyUid,
}) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}
      style={{ display:"flex", flexDirection:"column", gap:"16px" }}
    >
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily:"Space Grotesk,sans-serif", fontSize:"17px", fontWeight:800, margin:"0 0 3px",
          background:`linear-gradient(135deg,#fff,${accent.purple})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>Friends</h3>
        <p style={{ color:"#555", fontSize:"11px", margin:0 }}>Add friends to share private posts with each other.</p>
      </div>

      {/* UID card */}
      {profile && (
        <div style={{
          padding:"14px 16px", borderRadius:"16px",
          background:"rgba(79,159,255,0.05)", border:"1px solid rgba(79,159,255,0.18)",
          backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
          boxShadow:"0 0 20px rgba(79,159,255,0.06)",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
            <SectionLabel color={accent.blue}>
              <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:accent.blue, boxShadow:`0 0 6px ${accent.blue}` }} />
              My Unique UID
            </SectionLabel>
            <button onClick={handleCopyUid} style={{ display:"flex", alignItems:"center", gap:"4px", background:"none", border:"none", cursor:"pointer", color: copiedUid ? accent.green : accent.blue, fontSize:"10px", fontWeight:700, transition:"color 0.2s" }}>
              {copiedUid ? <Check size={11}/> : <Copy size={11}/>}
              {copiedUid ? "Copied!" : "Copy"}
            </button>
          </div>
          <div style={{
            fontFamily:"Space Mono,monospace", fontSize:"10px", color:"#ccc",
            wordBreak:"break-all", background:"rgba(0,0,0,0.35)",
            padding:"8px 10px", borderRadius:"8px", border:"1px solid rgba(255,255,255,0.04)",
            lineHeight:1.6,
          }}>
            {profile.uid}
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
        <SectionLabel>Find a friend</SectionLabel>
        <form onSubmit={handleSearchFriend} style={{ display:"flex", gap:"8px" }}>
          <CrystalInput value={friendSearchQuery} onChange={e => setFriendSearchQuery(e.target.value)} placeholder="Enter username or UID…" icon={Search} />
          <CrystalButton type="submit" disabled={friendSearchLoading} accentColor={accent.blue}>
            {friendSearchLoading ? <Loader2 size={13} style={{ animation:"spin 0.8s linear infinite" }}/> : <Search size={13}/>}
          </CrystalButton>
        </form>
      </div>

      {/* Error */}
      <AnimatePresence>
        {friendSearchError && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
            style={{ fontSize:"11px", color:accent.red, background:"rgba(255,76,106,0.08)", border:"1px solid rgba(255,76,106,0.2)", borderRadius:"10px", padding:"9px 12px" }}
          >
            ⚠️ {friendSearchError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search result */}
      <AnimatePresence>
        {friendSearchResult && (
          <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            style={{
              display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px",
              background:"rgba(255,255,255,0.03)", border:`1px solid ${glass.border}`,
              borderRadius:"14px", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)",
              boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            <img src={friendSearchResult.profilePic} alt="" style={{ width:"38px", height:"38px", borderRadius:"50%", objectFit:"cover", border:`2px solid ${accent.blue}55` }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"12px", fontWeight:700, color:"#ddd" }}>@{friendSearchResult.username}</div>
              <div style={{ fontSize:"10px", color:"#555", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{friendSearchResult.bio}</div>
            </div>
            {profile?.friends?.includes(friendSearchResult.uid)
              ? (
                <CrystalButton onClick={() => handleRemoveFriend(friendSearchResult.uid)} accentColor={accent.red}>
                  <UserMinus size={13}/> Remove
                </CrystalButton>
              ) : (
                <CrystalButton onClick={() => handleAddFriend(friendSearchResult.uid)} accentColor={accent.blue}>
                  <UserPlus size={13}/> Add
                </CrystalButton>
              )
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends list */}
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        <SectionLabel>
          <div style={{ width:"5px", height:"5px", borderRadius:"50%", background:accent.purple, boxShadow:`0 0 6px ${accent.purple}` }} />
          My Friends ({friendsList.length})
        </SectionLabel>

        {friendsList.length === 0
          ? <EmptyFriends />
          : friendsList.map(f => (
              <motion.div key={f.uid} layout
                style={{
                  display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px",
                  background:"rgba(255,255,255,0.025)", border:`1px solid ${glass.border}`,
                  borderRadius:"12px", backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
                  transition:"border-color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}
                onMouseLeave={e => e.currentTarget.style.borderColor=glass.border}
              >
                <img src={f.profilePic} alt="" style={{ width:"32px", height:"32px", borderRadius:"50%", objectFit:"cover", border:`2px solid rgba(180,127,255,0.3)`, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:"12px", fontWeight:700, color:"#ddd" }}>@{f.username}</div>
                  <div style={{ fontSize:"9px", color:"#555", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.bio}</div>
                </div>
                <button
                  onClick={() => handleRemoveFriend(f.uid)}
                  style={{ background:"none", border:"none", cursor:"pointer", color:"#444", fontSize:"10px", fontWeight:600, padding:"4px 6px", borderRadius:"6px", transition:"all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.color = accent.red; e.currentTarget.style.background = "rgba(255,76,106,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "#444"; e.currentTarget.style.background = "none"; }}
                >
                  Remove
                </button>
              </motion.div>
            ))
        }
      </div>
    </motion.div>
  );
}
