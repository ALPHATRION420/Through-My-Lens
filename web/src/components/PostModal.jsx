import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, MessageSquare, Compass, Send, MapPin } from "lucide-react";
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

// Design tokens
const glass = {
  base:   "rgba(10, 10, 10, 0.75)",
  border: "rgba(255,255,255,0.08)",
  deep:   "rgba(0,0,0,0.85)",
};
const accent = {
  blue:   "#4F9FFF",
  cyan:   "#00E5FF",
  purple: "#B47FFF",
  red:    "#FF4C6A",
};

export default function PostModal({ 
  isOpen, 
  onClose, 
  pin, 
  user, 
  db, 
  handleToggleLike,
  onLocate // function to close modal and switch to globe view pointing at the post
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !pin || !db) return;
    const fetchComments = async () => {
      try {
        const q = query(
          collection(db, "comments"),
          where("pinId", "==", pin.id),
          orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setComments(data);
      } catch (err) {
        console.error("Failed to fetch comments for modal", err);
      }
    };
    fetchComments();
  }, [isOpen, pin, db]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || !pin || !db) return;
    setIsSubmitting(true);
    try {
      const newDoc = {
        pinId: pin.id,
        authorUid: user.uid,
        authorUsername: user.displayName || user.email.split("@")[0],
        text: newComment.trim(),
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, "comments"), newDoc);
      setComments(prev => [...prev, { ...newDoc, id: docRef.id, createdAt: new Date() }]);
      setNewComment("");
    } catch (err) {
      console.error("Add comment error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isVideo = pin?.mediaUrl && (pin.mediaUrl.includes("/video/upload/") || /\.(mp4|webm|ogv|mov|avi|mkv)$/i.test(pin.mediaUrl));
  const hasLiked = pin?.likes?.includes(user?.uid);

  return (
    <AnimatePresence>
      {isOpen && pin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            padding: "40px"
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "1200px",
              height: "90vh",
              background: glass.base,
              border: `1px solid ${glass.border}`,
              borderRadius: "24px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "row",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)"
            }}
          >
            {/* Left: Media Area */}
            <div style={{ flex: 6, background: "#000", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {pin.mediaUrl ? (
                isVideo ? (
                  <video src={pin.mediaUrl} controls autoPlay loop style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img src={pin.mediaUrl} alt={pin.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )
              ) : (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"16px", color:"#555" }}>
                  <Compass size={64} style={{ opacity: 0.2 }} />
                  <span style={{ fontSize:"14px", fontWeight:500, letterSpacing:"0.1em", textTransform:"uppercase" }}>No Media Attached</span>
                </div>
              )}
            </div>

            {/* Right: Content & Comments Area */}
            <div style={{ flex: 4, display: "flex", flexDirection: "column", background: "rgba(10, 10, 10, 0.9)", borderLeft: `1px solid ${glass.border}` }}>
              
              {/* Header */}
              <div style={{ padding: "24px", borderBottom: `1px solid ${glass.border}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <img 
                    src={pin.authorProfilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80"} 
                    alt="avatar" 
                    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: `2px solid ${accent.blue}` }}
                  />
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "#fff" }}>@{pin.authorUsername}</h3>
                    <span style={{ fontSize: "11px", color: accent.blue, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {pin.isPublic ? "Public Post" : "Private Post"}
                    </span>
                  </div>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: "4px" }}>
                  <X size={24} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Title & Body */}
                <div>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, margin: "0 0 12px", color: "#fff", fontFamily: "Space Grotesk, sans-serif" }}>
                    {pin.title}
                  </h2>
                  <p style={{ fontSize: "15px", color: "#ccc", lineHeight: 1.6, margin: 0 }}>
                    {pin.content}
                  </p>
                </div>

                {/* Engagement Bar */}
                <div style={{ display: "flex", gap: "16px", borderTop: `1px solid ${glass.border}`, borderBottom: `1px solid ${glass.border}`, padding: "16px 0" }}>
                  <button 
                    onClick={() => handleToggleLike(pin.id)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: hasLiked ? accent.red : "#888", fontSize: "14px", fontWeight: 600, transition: "color 0.2s" }}
                  >
                    <Heart size={20} fill={hasLiked ? accent.red : "none"} />
                    {pin.likes?.length || 0}
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#888", fontSize: "14px", fontWeight: 600 }}>
                    <MessageSquare size={20} />
                    {comments.length}
                  </div>
                  {pin.allowLocate && onLocate && (
                    <button 
                      onClick={() => onLocate(pin)}
                      style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", color: accent.cyan, fontSize: "14px", fontWeight: 600, marginLeft: "auto" }}
                    >
                      <MapPin size={20} />
                      View on Globe
                    </button>
                  )}
                </div>

                {/* Comments List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Comments</h4>
                  {comments.length === 0 ? (
                    <div style={{ fontSize: "13px", color: "#555", fontStyle: "italic" }}>No comments yet. Be the first to share your thoughts.</div>
                  ) : (
                    comments.map(comment => (
                      <div key={comment.id} style={{ display: "flex", gap: "12px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "#aaa", flexShrink: 0 }}>
                          {comment.authorUsername?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "0 12px 12px 12px" }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginBottom: "4px" }}>@{comment.authorUsername}</div>
                          <div style={{ fontSize: "13px", color: "#ccc", lineHeight: 1.5 }}>{comment.text}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>

              {/* Comment Input */}
              <div style={{ padding: "20px 24px", borderTop: `1px solid ${glass.border}`, background: "rgba(0,0,0,0.5)" }}>
                <form onSubmit={handleAddComment} style={{ display: "flex", gap: "12px", position: "relative" }}>
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "24px",
                      padding: "12px 48px 12px 16px",
                      color: "#fff",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={!newComment.trim() || isSubmitting}
                    style={{
                      position: "absolute",
                      right: "6px",
                      top: "6px",
                      bottom: "6px",
                      background: newComment.trim() ? accent.blue : "rgba(255,255,255,0.1)",
                      border: "none",
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      cursor: newComment.trim() ? "pointer" : "not-allowed",
                      transition: "all 0.2s"
                    }}
                  >
                    <Send size={14} style={{ marginLeft: "-2px" }} />
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
