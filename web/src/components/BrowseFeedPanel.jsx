import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Heart, MessageSquare, Compass, Send, Globe, Eye } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────
const glass = {
  base:    "rgba(255,255,255,0.03)",
  hover:   "rgba(255,255,255,0.06)",
  border:  "rgba(255,255,255,0.08)",
  border2: "rgba(255,255,255,0.05)",
};
const accent = {
  blue:   "#4F9FFF",
  cyan:   "#00E5FF",
  purple: "#B47FFF",
  red:    "#FF4C6A",
};

function isVideoUrl(url) {
  if (!url) return false;
  return url.includes("/video/upload/") || /\.(mp4|webm|ogv|mov|avi|mkv)$/i.test(url);
}

// ── Primitive components ──────────────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <div style={{ fontSize:"9px", fontWeight:700, color:"#444", textTransform:"uppercase", letterSpacing:"0.12em", display:"flex", alignItems:"center", gap:"6px" }}>
    {children}
  </div>
);

const GlowDot = ({ color = accent.blue }) => (
  <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:color, boxShadow:`0 0 6px ${color}`, flexShrink:0 }} />
);

const PrivacyBadge = ({ isPublic }) => (
  <span style={{
    fontSize:"9px", fontWeight:700,
    color: isPublic ? accent.blue : accent.red,
    background: isPublic ? "rgba(79,159,255,0.10)" : "rgba(255,76,106,0.10)",
    border: `1px solid ${isPublic ? "rgba(79,159,255,0.25)" : "rgba(255,76,106,0.25)"}`,
    padding:"2px 8px", borderRadius:"20px", whiteSpace:"nowrap",
  }}>
    {isPublic ? "Public" : "Private"}
  </span>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div style={{ background:glass.base, border:`1px dashed ${glass.border}`, borderRadius:"16px", padding:"28px 20px", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:"10px" }}>
    <div style={{ width:"42px", height:"42px", borderRadius:"50%", background:"rgba(79,159,255,0.06)", border:"1px solid rgba(79,159,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <Icon size={18} style={{ color:"#444" }} />
    </div>
    <p style={{ fontSize:"12px", color:"#555", margin:0, lineHeight:1.5 }}>{message}</p>
  </div>
);

// ── Glass search bar ──────────────────────────────────────────────────────────
function GlassSearchBar({ value, onChange, placeholder }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{
      position:"relative", borderRadius:"12px",
      border:`1px solid ${focused ? accent.blue + "66" : glass.border}`,
      background: focused ? "rgba(79,159,255,0.05)" : glass.base,
      backdropFilter:"blur(10px)", WebkitBackdropFilter:"blur(10px)",
      boxShadow: focused ? `0 0 0 3px rgba(79,159,255,0.10)` : "none",
      transition:"all 0.2s",
    }}>
      <Search size={13} style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", color: focused ? accent.blue : "#444", transition:"color 0.2s" }} />
      <input
        type="text" value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"#ccc", fontSize:"12px", padding:"10px 12px 10px 32px", fontFamily:"Inter, sans-serif", borderRadius:"12px" }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function BrowseFeedPanel({
  visiblePins, searchQuery, setSearchQuery,
  user, handleToggleLike,
  activeCommentsPostId, setActiveCommentsPostId,
  commentsList, newCommentText, setNewCommentText,
  handleAddComment, setGlobeTarget, onPostClick,
}) {
  const filteredPins = visiblePins.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}
      style={{ display:"flex", flexDirection:"column", gap:"16px" }}
    >
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily:"Space Grotesk, sans-serif", fontSize:"17px", fontWeight:800, margin:"0 0 3px",
          background:`linear-gradient(135deg,#fff,${accent.cyan})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>Browse Feed</h3>
        <p style={{ color:"#555", fontSize:"11px", margin:0 }}>Explore memories anchored across the globe.</p>
      </div>

      {/* Search */}
      <GlassSearchBar value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Filter posts by title…" />

      {/* Feed */}
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        <SectionLabel>
          <GlowDot />
          {filteredPins.length} Interaction{filteredPins.length !== 1 ? "s" : ""}
        </SectionLabel>

        {filteredPins.length === 0
          ? <EmptyState icon={Globe} message="No posts match your search. Try a different keyword." />
          : filteredPins.map(pin => {
              const liked = pin.likes?.includes(user.uid);
              const isCommentOpen = activeCommentsPostId === pin.id;
              return (
                <motion.div key={pin.id} layout
                  style={{
                    background:"rgba(255,255,255,0.025)", border:`1px solid ${glass.border}`,
                    borderRadius:"16px", overflow:"hidden",
                    backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
                    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.3)",
                    transition:"border-color 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.14)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor=glass.border}
                >
                  {/* Media */}
                  {pin.mediaUrl && (
                    <div style={{ height:"140px", overflow:"hidden", background:"#000" }}>
                      {isVideoUrl(pin.mediaUrl)
                        ? <video src={pin.mediaUrl} controls playsInline style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : <img src={pin.mediaUrl} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      }
                    </div>
                  )}

                  <div style={{ padding:"14px 14px 0" }}>
                    {/* Author row */}
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                      <img
                        src={pin.authorProfilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"}
                        alt="" style={{ width:"30px", height:"30px", borderRadius:"50%", objectFit:"cover", border:`2px solid ${pin.isPublic ? "rgba(79,159,255,0.4)" : "rgba(255,76,106,0.4)"}` }}
                      />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:"11px", fontWeight:700, color:"#ddd" }}>@{pin.authorUsername}</div>
                        <div style={{ fontSize:"9px", color:"#444" }}>
                          {pin.timestamp?.toDate ? pin.timestamp.toDate().toLocaleDateString() : "Just now"}
                        </div>
                      </div>
                      <PrivacyBadge isPublic={pin.isPublic} />
                    </div>

                    {/* Content */}
                    <h4 style={{ fontWeight:700, fontSize:"13px", color:"#fff", margin:"0 0 4px" }}>{pin.title}</h4>
                    <p style={{ fontSize:"11px", color:"#888", lineHeight:1.5, margin:0 }}>{pin.content}</p>
                  </div>

                  {/* Interaction bar */}
                  <div style={{ display:"flex", alignItems:"center", gap:"14px", padding:"10px 14px", borderTop:`1px solid ${glass.border2}`, marginTop:"12px" }}>
                    {/* Like */}
                    <button
                      onClick={() => handleToggleLike(pin.id, pin.likes)}
                      style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"5px", color: liked ? accent.red : "#666", fontSize:"11px", fontWeight:600, padding:0, transition:"all 0.2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = accent.red}
                      onMouseLeave={e => e.currentTarget.style.color = liked ? accent.red : "#666"}
                    >
                      <Heart size={14} fill={liked ? accent.red : "none"} style={{ filter: liked ? `drop-shadow(0 0 4px ${accent.red})` : "none", transition:"all 0.2s" }} />
                      {pin.likes?.length || 0}
                    </button>

                    {/* Comments */}
                    <button
                      onClick={() => setActiveCommentsPostId(isCommentOpen ? null : pin.id)}
                      style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"5px", color: isCommentOpen ? accent.cyan : "#666", fontSize:"11px", fontWeight:600, padding:0, transition:"color 0.2s" }}
                    >
                      <MessageSquare size={13} /> Comments
                    </button>

                    {/* Open PostModal */}
                    <button
                      onClick={() => onPostClick && onPostClick(pin)}
                      style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"5px", color: accent.purple, fontSize:"11px", fontWeight:600, padding:0, transition:"color 0.2s", marginLeft: "10px" }}
                    >
                      <Eye size={13} /> View
                    </button>

                    {/* Locate */}
                    {(pin.allowLocate || !pin.isPublic) && (
                      <button
                        onClick={() => setGlobeTarget({ lat:pin.latitude, lng:pin.longitude })}
                        style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:"4px", color:accent.blue, fontSize:"10px", fontWeight:700, padding:0 }}
                      >
                        <Compass size={12} /> Locate
                      </button>
                    )}
                  </div>

                  {/* Comments drawer */}
                  <AnimatePresence>
                    {isCommentOpen && (
                      <motion.div
                        initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                        style={{ background:"rgba(0,0,0,0.32)", borderTop:`1px solid ${glass.border2}`, overflow:"hidden" }}
                      >
                        <div style={{ padding:"10px 14px", display:"flex", flexDirection:"column", gap:"8px" }}>
                          {/* List */}
                          <div style={{ maxHeight:"120px", overflowY:"auto", display:"flex", flexDirection:"column", gap:"6px" }}>
                            {commentsList.length === 0
                              ? <div style={{ fontSize:"11px", color:"#444", textAlign:"center", padding:"8px 0" }}>No comments yet. Be the first!</div>
                              : commentsList.map(c => (
                                  <div key={c.id} style={{ display:"flex", gap:"8px", fontSize:"11px" }}>
                                    <img src={c.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"} alt="" style={{ width:"20px", height:"20px", borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />
                                    <div>
                                      <span style={{ fontWeight:700, color:"#ddd", marginRight:"4px" }}>@{c.username}</span>
                                      <span style={{ color:"#aaa" }}>{c.text}</span>
                                      <div style={{ fontSize:"8px", color:"#444", marginTop:"1px" }}>
                                        {c.timestamp?.toDate ? c.timestamp.toDate().toLocaleTimeString() : "Just now"}
                                      </div>
                                    </div>
                                  </div>
                                ))
                            }
                          </div>
                          {/* Input */}
                          <form onSubmit={e => handleAddComment(e, pin.id)} style={{ display:"flex", gap:"6px" }}>
                            <input
                              type="text" placeholder="Add a comment…"
                              value={newCommentText} onChange={e => setNewCommentText(e.target.value)}
                              style={{ flex:1, fontSize:"11px", padding:"7px 10px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"8px", color:"#fff", fontFamily:"Inter,sans-serif", outline:"none" }}
                            />
                            <button type="submit" style={{ padding:"7px 12px", background:`linear-gradient(135deg,rgba(0,229,255,0.18),rgba(79,159,255,0.18))`, border:`1px solid ${accent.cyan}55`, borderRadius:"8px", cursor:"pointer", display:"flex", alignItems:"center" }}>
                              <Send size={11} style={{ color:accent.cyan }} />
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
        }
      </div>
    </motion.div>
  );
}
