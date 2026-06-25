import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Search, UserPlus, UserMinus, Users, Loader2, UserCheck, X } from "lucide-react";

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

// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children, color = "#444" }) => (
  <div style={{ fontSize:"11px", fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.12em", display:"flex", alignItems:"center", gap:"6px", marginBottom: "8px" }}>
    {children}
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function FriendsPanel({ profile, user, db, friendsList }) {
  const [copiedUid, setCopiedUid] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [friendSearchResult, setFriendSearchResult] = useState(null);
  const [friendSearchLoading, setFriendSearchLoading] = useState(false);
  const [friendSearchError, setFriendSearchError] = useState("");
  
  const [pendingRequests, setPendingRequests] = useState([]);

  // Fetch pending requests profiles
  useEffect(() => {
    if (!profile || !profile.friendRequestsReceived || profile.friendRequestsReceived.length === 0) {
      setPendingRequests([]);
      return;
    }
    
    // Create query to fetch profiles of all uids in friendRequestsReceived
    // Firestore 'in' query supports max 10, so if there are more we'd need to chunk, but we assume <10 for now
    const chunk = profile.friendRequestsReceived.slice(0, 10);
    if (chunk.length === 0) return;
    
    const q = query(collection(db, "users"), where("uid", "in", chunk));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach(d => list.push(d.data()));
      setPendingRequests(list);
    });
    return () => unsubscribe();
  }, [profile?.friendRequestsReceived, db]);

  const handleCopyUid = () => {
    if (!profile?.uid) return;
    navigator.clipboard.writeText(profile.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleSearchFriend = async (e) => {
    e.preventDefault();
    if (!friendSearchQuery.trim()) return;
    setFriendSearchLoading(true);
    setFriendSearchResult(null);
    setFriendSearchError("");

    const targetQuery = friendSearchQuery.trim();

    try {
      let foundUser = null;
      // 1. UID search
      const userRef = doc(db, "users", targetQuery);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        foundUser = userSnap.data();
      } else {
        // 2. Username search
        const q = query(collection(db, "users"), where("username", "==", targetQuery));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          foundUser = querySnap.docs[0].data();
        }
      }

      if (foundUser) {
        if (foundUser.uid === user.uid) {
          setFriendSearchError("You cannot add yourself.");
        } else {
          setFriendSearchResult(foundUser);
        }
      } else {
        setFriendSearchError("User not found by UID or Username.");
      }
    } catch (err) {
      setFriendSearchError("Failed to search user.");
    } finally {
      setFriendSearchLoading(false);
    }
  };

  const handleSendRequest = async (targetUid) => {
    if (!user) return;
    try {
      const myRef = doc(db, "users", user.uid);
      const targetRef = doc(db, "users", targetUid);
      
      await updateDoc(myRef, {
        friendRequestsSent: arrayUnion(targetUid)
      });
      await updateDoc(targetRef, {
        friendRequestsReceived: arrayUnion(user.uid)
      });
      
      // Update local result state optimistically
      setFriendSearchResult(prev => ({ ...prev, _requestSent: true }));
    } catch (err) {
      alert("Failed to send friend request.");
    }
  };

  const handleAcceptRequest = async (targetUid) => {
    if (!user) return;
    try {
      const myRef = doc(db, "users", user.uid);
      const targetRef = doc(db, "users", targetUid);
      
      await updateDoc(myRef, {
        friendRequestsReceived: arrayRemove(targetUid),
        friends: arrayUnion(targetUid)
      });
      await updateDoc(targetRef, {
        friendRequestsSent: arrayRemove(user.uid),
        friends: arrayUnion(user.uid)
      });
    } catch (err) {
      alert("Failed to accept request.");
    }
  };

  const handleDeclineRequest = async (targetUid) => {
    if (!user) return;
    try {
      const myRef = doc(db, "users", user.uid);
      const targetRef = doc(db, "users", targetUid);
      
      await updateDoc(myRef, {
        friendRequestsReceived: arrayRemove(targetUid)
      });
      await updateDoc(targetRef, {
        friendRequestsSent: arrayRemove(user.uid)
      });
    } catch (err) {
      alert("Failed to decline request.");
    }
  };

  const handleRemoveFriend = async (targetUid) => {
    if (!user) return;
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      const myRef = doc(db, "users", user.uid);
      const targetRef = doc(db, "users", targetUid);
      await updateDoc(myRef, { friends: arrayRemove(targetUid) });
      await updateDoc(targetRef, { friends: arrayRemove(user.uid) });
    } catch (err) {
      alert("Failed to remove friend.");
    }
  };

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ duration:0.3 }}
      style={{ display:"flex", flexDirection:"column", gap:"32px", padding: "20px 0" }}
    >
      {/* Header */}
      <div>
        <h3 style={{
          fontFamily:"Space Grotesk,sans-serif", fontSize:"28px", fontWeight:800, margin:"0 0 8px",
          background:`linear-gradient(135deg,#fff,${accent.purple})`,
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>Friends & Connections</h3>
        <p style={{ color:"#888", fontSize:"14px", margin:0 }}>Manage your network. Friends can view your private pins on the globe.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Left Column: Search & Add */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ background: glass.base, border: `1px solid ${glass.border}`, borderRadius: "16px", padding: "20px" }}>
            <SectionLabel color={accent.cyan}>Find a Friend</SectionLabel>
            <form onSubmit={handleSearchFriend} style={{ display:"flex", gap:"10px", marginTop: "12px" }}>
              <CrystalInput value={friendSearchQuery} onChange={e => setFriendSearchQuery(e.target.value)} placeholder="Search by username or UID" icon={Search} />
              <CrystalButton type="submit" disabled={friendSearchLoading} accentColor={accent.cyan}>
                {friendSearchLoading ? <Loader2 size={14} style={{ animation:"spin 0.8s linear infinite" }}/> : <Search size={14}/>}
              </CrystalButton>
            </form>

            <AnimatePresence>
              {friendSearchError && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
                  style={{ fontSize:"12px", color:accent.red, background:"rgba(255,76,106,0.08)", border:"1px solid rgba(255,76,106,0.2)", borderRadius:"10px", padding:"10px 14px", marginTop: "12px" }}
                >
                  ⚠️ {friendSearchError}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {friendSearchResult && (
                <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                  style={{
                    display:"flex", alignItems:"center", gap:"12px", padding:"16px", marginTop: "16px",
                    background:"rgba(255,255,255,0.03)", border:`1px solid ${glass.border}`, borderRadius:"14px"
                  }}
                >
                  <img src={friendSearchResult.profilePic} alt="" style={{ width:"46px", height:"46px", borderRadius:"50%", objectFit:"cover", border:`2px solid ${accent.cyan}55` }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"15px", fontWeight:700, color:"#eee" }}>@{friendSearchResult.username}</div>
                    <div style={{ fontSize:"12px", color:"#888" }}>{friendSearchResult.bio?.substring(0,40)}</div>
                  </div>
                  
                  {profile?.friends?.includes(friendSearchResult.uid) ? (
                    <div style={{ color: accent.green, fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}><Check size={14}/> Friends</div>
                  ) : profile?.friendRequestsSent?.includes(friendSearchResult.uid) || friendSearchResult._requestSent ? (
                    <div style={{ color: "#888", fontSize: "12px", fontWeight: 600 }}>Request Sent</div>
                  ) : profile?.friendRequestsReceived?.includes(friendSearchResult.uid) ? (
                    <CrystalButton onClick={() => handleAcceptRequest(friendSearchResult.uid)} accentColor={accent.green}>Accept</CrystalButton>
                  ) : (
                    <CrystalButton onClick={() => handleSendRequest(friendSearchResult.uid)} accentColor={accent.cyan}>
                      <UserPlus size={14}/> Request
                    </CrystalButton>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div style={{ background: glass.base, border: `1px solid ${glass.border}`, borderRadius: "16px", padding: "20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
              <SectionLabel color={accent.blue}>My UID</SectionLabel>
              <button onClick={handleCopyUid} style={{ display:"flex", alignItems:"center", gap:"6px", background:"none", border:"none", cursor:"pointer", color: copiedUid ? accent.green : accent.blue, fontSize:"12px", fontWeight:700, transition:"color 0.2s" }}>
                {copiedUid ? <Check size={14}/> : <Copy size={14}/>}
                {copiedUid ? "Copied!" : "Copy UID"}
              </button>
            </div>
            <div style={{
              fontFamily:"Space Mono,monospace", fontSize:"12px", color:"#ccc", wordBreak:"break-all",
              background:"rgba(0,0,0,0.5)", padding:"12px", borderRadius:"8px", border:"1px dashed rgba(255,255,255,0.1)"
            }}>
              {profile?.uid || "Loading..."}
            </div>
          </div>
        </div>

        {/* Right Column: Pending & Friends List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div style={{ background: "rgba(255, 193, 7, 0.03)", border: "1px solid rgba(255, 193, 7, 0.15)", borderRadius: "16px", padding: "20px" }}>
              <SectionLabel color="#FFc107">Pending Requests ({pendingRequests.length})</SectionLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginTop: "12px" }}>
                {pendingRequests.map(req => (
                  <div key={req.uid} style={{
                    display:"flex", alignItems:"center", gap:"12px", padding:"12px",
                    background:"rgba(0,0,0,0.4)", borderRadius:"12px", border:"1px solid rgba(255, 193, 7, 0.1)"
                  }}>
                    <img src={req.profilePic} alt="" style={{ width:"40px", height:"40px", borderRadius:"50%", objectFit:"cover" }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"14px", fontWeight:700, color:"#fff" }}>@{req.username}</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => handleAcceptRequest(req.uid)} style={{ background: "rgba(57, 255, 20, 0.15)", color: accent.green, border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
                        <Check size={16} />
                      </button>
                      <button onClick={() => handleDeclineRequest(req.uid)} style={{ background: "rgba(255, 76, 106, 0.15)", color: accent.red, border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div style={{ background: glass.base, border: `1px solid ${glass.border}`, borderRadius: "16px", padding: "20px", flex: 1 }}>
            <SectionLabel color={accent.purple}>My Friends ({friendsList.length})</SectionLabel>
            
            <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginTop: "16px" }}>
              {friendsList.length === 0 ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                  <Users size={32} style={{ opacity: 0.5, margin: "0 auto 12px" }} />
                  You have no connections yet.
                </div>
              ) : (
                friendsList.map(f => (
                  <div key={f.uid} style={{
                    display:"flex", alignItems:"center", gap:"12px", padding:"12px",
                    background:"rgba(255,255,255,0.02)", borderRadius:"12px", border:`1px solid ${glass.border}`
                  }}>
                    <img src={f.profilePic} alt="" style={{ width:"40px", height:"40px", borderRadius:"50%", objectFit:"cover", border:`1px solid ${accent.purple}55` }} />
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"14px", fontWeight:700, color:"#eee" }}>@{f.username}</div>
                    </div>
                    <button onClick={() => handleRemoveFriend(f.uid)} style={{
                      background:"none", border:"none", color:"#888", fontSize:"12px", cursor:"pointer", padding: "6px"
                    }} onMouseEnter={e => e.currentTarget.style.color = accent.red} onMouseLeave={e => e.currentTarget.style.color = "#888"}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
