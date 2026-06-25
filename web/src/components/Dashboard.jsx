import React, { useState, useEffect, useRef } from "react";
import { signOut } from "firebase/auth";
import { collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, where, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Plus, MapPin, RefreshCw, LogOut, Radio, Search, Image, Lock, Unlock, Compass, Crosshair, X, UploadCloud, Globe, Users, User, Heart, MessageSquare, Copy, Check, Send, Settings, Eye, Layers } from "lucide-react";
import GlobeView from "./GlobeView";
import MapView from "./MapView";
import { landmarks } from "../data/landmarks";

// Helper to calculate distance in meters (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Helper to check if a URL points to a video resource
function isVideoUrl(url) {
  if (!url) return false;
  return url.includes("/video/upload/") || /\.(mp4|webm|ogv|mov|avi|mkv)$/i.test(url);
}

export default function Dashboard({ auth, user, db }) {
  const [userCoords, setUserCoords] = useState(null); // GPS coordinates
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState({ lat: 0, lng: 0 }); // Current coordinates selected for dropping a pin
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [radius, setRadius] = useState(50);
  const [isPublic, setIsPublic] = useState(true);
  const [allowLocate, setAllowLocate] = useState(false);
  const [pins, setPins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [globeTarget, setGlobeTarget] = useState(null); // Triggers camera relocation
  const [viewMode, setViewMode] = useState("globe"); // "globe" or "map"
  const [globeTheme, setGlobeTheme] = useState("realistic"); // "realistic" or "vector"
  const [landmarkSearch, setLandmarkSearch] = useState("");
  const mapViewRef = useRef(null);
  const globeViewRef = useRef(null);

  // Cloudinary direct upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const isCloudinaryConfigured = cloudinaryCloudName && 
    cloudinaryCloudName !== "your_cloud_name_here" && 
    cloudinaryCloudName.trim() !== "" &&
    cloudinaryUploadPreset && 
    cloudinaryUploadPreset !== "your_unsigned_preset_here" &&
    cloudinaryUploadPreset.trim() !== "";

  // Profile and Friends State
  const [profile, setProfile] = useState(null);
  const [friendsList, setFriendsList] = useState([]);

  // Subscribe to Current User Profile Doc in Firestore
  useEffect(() => {
    if (!user) return;
    const profileRef = doc(db, "users", user.uid);
    
    const unsubscribe = onSnapshot(profileRef, async (snapshot) => {
      if (!snapshot.exists()) {
        // Create default profile
        const defaultProfile = {
          uid: user.uid,
          username: user.displayName || user.email.split("@")[0],
          bio: "Explore the world through my lens.",
          profilePic: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
          friends: []
        };
        try {
          await setDoc(profileRef, defaultProfile);
        } catch (err) {
          console.error("Failed to create default user profile:", err);
        }
      } else {
        setProfile(snapshot.data());
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Subscribe to Friends List Profiles
  useEffect(() => {
    if (!profile || !profile.friends || profile.friends.length === 0) {
      setFriendsList([]);
      return;
    }
    const q = query(collection(db, "users"), where("uid", "in", profile.friends));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => {
        list.push(d.data());
      });
      setFriendsList(list);
    }, (err) => {
      console.error("Error subscribing to friends list:", err);
    });

    return () => unsubscribe();
  }, [profile?.friends]);

  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState("browse"); // "browse", "create", "search", "friends", "profile"

  // Edit Profile States
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Friends Management States
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  const [friendSearchResult, setFriendSearchResult] = useState(null);
  const [friendSearchLoading, setFriendSearchLoading] = useState(false);
  const [friendSearchError, setFriendSearchError] = useState("");

  // Search Around You States
  const [searchNearRadius, setSearchNearRadius] = useState(1000); // 1km default

  // Populate Edit Profile fields when profile loads
  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || "");
      setEditBio(profile.bio || "");
      setProfilePicPreview(profile.profilePic || "");
    }
  }, [profile]);

  // Handle Edit Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editUsername.trim()) return;
    setSavingProfile(true);

    let updatedPicUrl = profilePicPreview;

    if (profileFile && isCloudinaryConfigured) {
      const formData = new FormData();
      formData.append("file", profileFile);
      formData.append("upload_preset", cloudinaryUploadPreset);
      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
          { method: "POST", body: formData }
        );
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        updatedPicUrl = data.secure_url;
      } catch (err) {
        console.error("Cloudinary profile pic upload error:", err);
        alert("Failed to upload new profile picture.");
        setSavingProfile(false);
        return;
      }
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        username: editUsername.trim(),
        bio: editBio.trim(),
        profilePic: updatedPicUrl
      });
      setProfileFile(null);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Error updating profile: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Friends Search
  const handleSearchFriend = async (e) => {
    e.preventDefault();
    if (!friendSearchQuery.trim()) return;
    setFriendSearchLoading(true);
    setFriendSearchResult(null);
    setFriendSearchError("");

    const targetQuery = friendSearchQuery.trim();

    try {
      // 1. Try searching by direct UID (document ID)
      const userRef = doc(db, "users", targetQuery);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setFriendSearchResult(userSnap.data());
        setFriendSearchLoading(false);
        return;
      }

      // 2. Try searching by username
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", targetQuery));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        setFriendSearchResult(querySnap.docs[0].data());
        setFriendSearchLoading(false);
        return;
      }

      setFriendSearchError("User not found by UID or Username.");
    } catch (err) {
      console.error("Search friend failed:", err);
      setFriendSearchError("Failed to search user. " + err.message);
    } finally {
      setFriendSearchLoading(false);
    }
  };

  // Add a friend (Mutual)
  const handleAddFriend = async (friendUid) => {
    if (!profile || !user) return;
    if (friendUid === user.uid) {
      alert("You cannot add yourself as a friend!");
      return;
    }
    try {
      const myRef = doc(db, "users", user.uid);
      const friendRef = doc(db, "users", friendUid);

      await updateDoc(myRef, {
        friends: arrayUnion(friendUid)
      });
      await updateDoc(friendRef, {
        friends: arrayUnion(user.uid)
      });

      alert("Friend added successfully!");
      if (friendSearchResult && friendSearchResult.uid === friendUid) {
        setFriendSearchResult(prev => ({
          ...prev,
          friends: [...(prev.friends || []), user.uid]
        }));
      }
    } catch (err) {
      console.error("Add friend error:", err);
      alert("Failed to add friend: " + err.message);
    }
  };

  // Remove a friend (Mutual)
  const handleRemoveFriend = async (friendUid) => {
    if (!profile || !user) return;
    try {
      const myRef = doc(db, "users", user.uid);
      const friendRef = doc(db, "users", friendUid);

      await updateDoc(myRef, {
        friends: arrayRemove(friendUid)
      });
      await updateDoc(friendRef, {
        friends: arrayRemove(user.uid)
      });

      alert("Friend removed successfully.");
      if (friendSearchResult && friendSearchResult.uid === friendUid) {
        setFriendSearchResult(prev => ({
          ...prev,
          friends: (prev.friends || []).filter(id => id !== user.uid)
        }));
      }
    } catch (err) {
      console.error("Remove friend error:", err);
      alert("Failed to remove friend: " + err.message);
    }
  };

  // Engagement: Like & Comment states
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [commentsList, setCommentsList] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");

  // Subscribe to comments for the expanded post
  useEffect(() => {
    if (!activeCommentsPostId) {
      setCommentsList([]);
      return;
    }
    const q = query(
      collection(db, "posts", activeCommentsPostId, "comments"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach((d) => {
        docs.push({ id: d.id, ...d.data() });
      });
      setCommentsList(docs);
    });
    return () => unsubscribe();
  }, [activeCommentsPostId]);

  // Handle Like/Unlike Post
  const handleToggleLike = async (postId, currentLikes = []) => {
    if (!user) return;
    const postRef = doc(db, "posts", postId);
    const liked = currentLikes.includes(user.uid);
    try {
      await updateDoc(postRef, {
        likes: liked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  };

  // Handle Comment Submission
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!newCommentText.trim() || !user || !profile) return;
    try {
      const commentRef = collection(db, "posts", postId, "comments");
      await addDoc(commentRef, {
        uid: user.uid,
        username: profile.username || user.email.split("@")[0],
        profilePic: profile.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
        text: newCommentText.trim(),
        timestamp: serverTimestamp()
      });
      setNewCommentText("");
    } catch (err) {
      console.error("Failed to add comment:", err);
      alert("Error posting comment: " + err.message);
    }
  };




  const postsCollectionRef = collection(db, "posts");

  const filteredLandmarks = landmarkSearch.trim() === ""
    ? []
    : landmarks.filter(l =>
        l.name.toLowerCase().includes(landmarkSearch.toLowerCase()) ||
        l.country.toLowerCase().includes(landmarkSearch.toLowerCase())
      ).slice(0, 5);

  // Get user location
  const updateLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsRefreshingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        setSelectedCoords({ lat: latitude, lng: longitude });
        setGlobeTarget({ lat: latitude, lng: longitude });
        setIsRefreshingLocation(false);
      },
      (err) => {
        console.warn("Location permission denied/failed. Defaulting to London.", err);
        const defaultCoords = { lat: 51.5074, lng: -0.1278 };
        setUserCoords(defaultCoords);
        setSelectedCoords(defaultCoords);
        setGlobeTarget(defaultCoords);
        setIsRefreshingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  useEffect(() => {
    updateLocation();

    // Listen to database posts in real-time
    const q = query(postsCollectionRef, orderBy("timestamp", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = [];
      snapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setPins(docs);
    });

    return () => unsubscribe();
  }, []);

  // Search Address Geocoding (Nominatim API)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setSelectedCoords({ lat, lng });
        setGlobeTarget({ lat, lng });
      } else {
        alert("Location not found. Try search query like 'Paris', 'New York', or zip codes.");
      }
    } catch (err) {
      console.error(err);
      alert("Geocoding failed. Please check internet connection.");
    } finally {
      setSearchLoading(false);
    }
  };

  // Submit drop pin
  const handleDropPin = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setUploading(true);
    let finalMediaUrl = mediaUrl.trim();

    // If Cloudinary is configured and a file was selected, upload it
    if (isCloudinaryConfigured && imageFile) {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("upload_preset", cloudinaryUploadPreset);

      const resourceType = imageFile.type.startsWith("video/") ? "video" : "image";

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/${resourceType}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${resourceType} to Cloudinary`);
        }

        const data = await response.json();
        finalMediaUrl = data.secure_url;
      } catch (err) {
        console.error("Cloudinary upload failed:", err);
        alert("Media upload failed. Please verify your Cloudinary configurations in your .env.local file.\n\nError: " + err.message);
        setUploading(false);
        return;
      }
    }

    const newPost = {
      title,
      content,
      latitude: selectedCoords.lat,
      longitude: selectedCoords.lng,
      radius: parseInt(radius),
      mediaUrl: finalMediaUrl,
      author: user.uid,
      authorUsername: profile?.username || user.email.split("@")[0],
      authorProfilePic: profile?.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150",
      timestamp: serverTimestamp(),
      isPublic: isPublic,
      allowLocate: allowLocate,
      likes: []
    };

    try {
      await addDoc(postsCollectionRef, newPost);
      setTitle("");
      setContent("");
      setMediaUrl("");
      setImageFile(null);
      setImagePreview(null);
      setIsPublic(true);
      setAllowLocate(false);
      alert("Pin successfully dropped on the globe!");
    } catch (err) {
      console.error("Firestore write failed:", err);
      alert("Failed to drop pin. Please check your Firestore Security Rules in Firebase Console.\n\nError: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const [copiedUid, setCopiedUid] = useState(false);
  const handleCopyUid = () => {
    if (!profile?.uid) return;
    navigator.clipboard.writeText(profile.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Filter posts based on visibility/privacy rules
  const visiblePins = pins.filter(pin => {
    if (pin.isPublic) return true; // Public posts visible to all
    if (pin.author === user.uid) return true; // Author can see their own private posts
    return profile?.friends?.includes(pin.author); // Friends can see private posts
  });

  // Location based filtering for "Search Around You"
  const nearbyPins = visiblePins.filter(pin => {
    if (!userCoords) return false;
    const distance = calculateDistance(userCoords.lat, userCoords.lng, pin.latitude, pin.longitude);
    return distance <= searchNearRadius;
  });

  return (
    <div style={{
      backgroundColor: "#050505",
      color: "#fff",
      minHeight: "100vh",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "Inter, sans-serif",
      overflow: "hidden",
      position: "relative"
    }}>
      {/* 3D Globe / 2D Map Canvas (Primary Background Canvas) */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1
      }}>
        {viewMode === "globe" ? (
          <GlobeView
            ref={globeViewRef}
            pins={visiblePins}
            userCoords={userCoords}
            selectedCoords={selectedCoords}
            onSelectCoords={(coords) => setSelectedCoords(coords)}
            targetCoords={globeTarget}
            theme={globeTheme}
          />
        ) : (
          <MapView
            ref={mapViewRef}
            pins={visiblePins}
            userCoords={userCoords}
            selectedCoords={selectedCoords}
            onSelectCoords={(coords) => setSelectedCoords(coords)}
            targetCoords={globeTarget}
          />
        )}

        {/* Floating View Control Tools on Canvas */}
        <div style={{
          position: "absolute",
          bottom: "24px",
          right: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          zIndex: 1000
        }}>
          {/* Refresh GPS Button */}
          <button
            type="button"
            onClick={updateLocation}
            disabled={isRefreshingLocation}
            title="Refresh GPS location from browser"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: "rgba(10, 10, 10, 0.9)",
              border: isRefreshingLocation ? "1px solid rgba(57, 255, 20, 0.3)" : "1px solid #39ff14",
              borderRadius: "8px",
              color: isRefreshingLocation ? "rgba(57, 255, 20, 0.5)" : "#39ff14",
              cursor: isRefreshingLocation ? "not-allowed" : "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
              boxShadow: isRefreshingLocation ? "none" : "0 0 12px rgba(57, 255, 20, 0.25)"
            }}
            onMouseEnter={(e) => {
              if (!isRefreshingLocation) {
                e.currentTarget.style.backgroundColor = "rgba(57, 255, 20, 0.15)";
                e.currentTarget.style.boxShadow = "0 0 20px rgba(57, 255, 20, 0.45)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isRefreshingLocation) {
                e.currentTarget.style.backgroundColor = "rgba(10, 10, 10, 0.9)";
                e.currentTarget.style.boxShadow = "0 0 12px rgba(57, 255, 20, 0.25)";
              }
            }}
          >
            <RefreshCw size={14} className={isRefreshingLocation ? "animate-spin" : ""} />
            {isRefreshingLocation ? "Refreshing..." : "Refresh GPS"}
          </button>

          {/* Recentre Button */}
          <button
            type="button"
            onClick={() => {
              if (viewMode === "globe") {
                globeViewRef.current?.recenterToUser();
              } else {
                mapViewRef.current?.recenterToUser();
              }
            }}
            title="Recentre to my location"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              backgroundColor: "rgba(10, 10, 10, 0.9)",
              border: "1px solid #0070f3",
              borderRadius: "8px",
              color: "#0070f3",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s",
              boxShadow: "0 0 12px rgba(0, 112, 243, 0.25)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 112, 243, 0.15)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(0, 112, 243, 0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(10, 10, 10, 0.9)";
              e.currentTarget.style.boxShadow = "0 0 12px rgba(0, 112, 243, 0.25)";
            }}
          >
            <Crosshair size={14} /> Recentre
          </button>
        </div>

        {/* Floating Theme Toggle (Globe only) */}
        {viewMode === "globe" && (
          <div style={{
            position: "absolute",
            bottom: "24px",
            left: "410px",
            display: "flex",
            gap: "8px",
            backgroundColor: "rgba(10, 10, 10, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "10px",
            padding: "4px",
            backdropFilter: "blur(12px)",
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)"
          }}>
            {/* Realistic Button */}
            <button
              type="button"
              onClick={() => setGlobeTheme("realistic")}
              title="Switch to Realistic Satellite view"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: globeTheme === "realistic" ? "rgba(0, 112, 243, 0.25)" : "transparent",
                border: globeTheme === "realistic" ? "1px solid #0070f3" : "1px solid transparent",
                color: globeTheme === "realistic" ? "#0070f3" : "#888",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (globeTheme !== "realistic") e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                if (globeTheme !== "realistic") e.currentTarget.style.color = "#888";
              }}
            >
              <Globe size={18} />
            </button>

            {/* Vector Button */}
            <button
              type="button"
              onClick={() => setGlobeTheme("vector")}
              title="Switch to Dark Vector view"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: globeTheme === "vector" ? "rgba(0, 112, 243, 0.25)" : "transparent",
                border: globeTheme === "vector" ? "1px solid #0070f3" : "1px solid transparent",
                color: globeTheme === "vector" ? "#0070f3" : "#888",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                if (globeTheme !== "vector") e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                if (globeTheme !== "vector") e.currentTarget.style.color = "#888";
              }}
            >
              <Layers size={18} />
            </button>
          </div>
        )}

        {/* Canvas Instructions */}
        <div style={{
          position: "absolute",
          bottom: "24px",
          left: viewMode === "globe" ? "515px" : "410px",
          backgroundColor: "rgba(10, 10, 10, 0.8)",
          border: "1px solid #1f1f1f",
          borderRadius: "6px",
          padding: "10px 14px",
          fontSize: "12px",
          color: "#888",
          pointerEvents: "none",
          backdropFilter: "blur(6px)",
          zIndex: 1000
        }}>
          {viewMode === "globe"
            ? "🖱️ Drag to rotate | Scroll to zoom | Click to select target coordinates"
            : "🖱️ Drag to pan | Scroll to zoom | Click to select target coordinates"
          }
        </div>
      </div>

      {/* Floating Glassmorphic Top Header Bar */}
      <header style={{
        position: "absolute",
        top: "15px",
        left: "15px",
        right: "15px",
        height: "60px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 24px",
        borderRadius: "12px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backgroundColor: "rgba(10, 10, 10, 0.7)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
        zIndex: 100
      }}>
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Compass size={22} className="animate-pulse" style={{ color: "#0070f3" }} />
          <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: "18px", letterSpacing: "-0.02em" }}>
            Through My Lens
          </span>
        </div>

        {/* 3D Globe / 2D Map Toggle */}
        <div style={{
          display: "flex",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          padding: "3px"
        }}>
          <button
            type="button"
            onClick={() => setViewMode("globe")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              backgroundColor: viewMode === "globe" ? "#0070f3" : "transparent",
              color: viewMode === "globe" ? "#fff" : "#888",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            3D Globe
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "6px",
              border: "none",
              backgroundColor: viewMode === "map" ? "#0070f3" : "transparent",
              color: viewMode === "map" ? "#fff" : "#888",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            2D Map
          </button>
        </div>

        {/* Auth Profile Card */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {profile && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img 
                src={profile.profilePic} 
                alt="Avatar" 
                style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #0070f3", objectFit: "cover" }} 
              />
              <span style={{ fontSize: "13px", fontWeight: 600 }}>@{profile.username}</span>
            </div>
          )}
          <button
            onClick={() => signOut(auth)}
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </header>

      {/* Floating Glassmorphic Hero Control Panel (Left Sidebar Overlay) */}
      <div style={{
        position: "absolute",
        top: "90px",
        left: "15px",
        width: "380px",
        height: "calc(100% - 105px)",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backgroundColor: "rgba(10, 10, 10, 0.75)",
        backdropFilter: "blur(25px)",
        WebkitBackdropFilter: "blur(25px)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 90
      }}>
        {/* Navigation Tabs Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "16px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          backgroundColor: "rgba(255,255,255,0.01)"
        }}>
          <button
            onClick={() => setActiveTab("browse")}
            title="Browse Feed"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: activeTab === "browse" ? "#0070f3" : "#666",
              backgroundColor: activeTab === "browse" ? "rgba(0, 112, 243, 0.1)" : "transparent",
              transition: "all 0.2s"
            }}
          >
            <Globe size={20} />
          </button>
          <button
            onClick={() => setActiveTab("create")}
            title="Create Post"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: activeTab === "create" ? "#0070f3" : "#666",
              backgroundColor: activeTab === "create" ? "rgba(0, 112, 243, 0.1)" : "transparent",
              transition: "all 0.2s"
            }}
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => setActiveTab("search")}
            title="Search Around You"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: activeTab === "search" ? "#0070f3" : "#666",
              backgroundColor: activeTab === "search" ? "rgba(0, 112, 243, 0.1)" : "transparent",
              transition: "all 0.2s"
            }}
          >
            <Radio size={20} />
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            title="Friends Management"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: activeTab === "friends" ? "#0070f3" : "#666",
              backgroundColor: activeTab === "friends" ? "rgba(0, 112, 243, 0.1)" : "transparent",
              transition: "all 0.2s"
            }}
          >
            <Users size={20} />
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            title="Edit Profile"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: activeTab === "profile" ? "#0070f3" : "#666",
              backgroundColor: activeTab === "profile" ? "rgba(0, 112, 243, 0.1)" : "transparent",
              transition: "all 0.2s"
            }}
          >
            <Settings size={20} />
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          {/* TAB 1: BROWSE FEED */}
          {activeTab === "browse" && (
            <>
              <div>
                <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                  Browse Feed
                </h3>
                <p style={{ color: "#888", fontSize: "12px" }}>
                  Explore interactions and memories shared across the globe.
                </p>
              </div>

              {/* Search feed bar */}
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "10px", top: "11px", color: "#666" }} />
                <input
                  type="text"
                  placeholder="Filter posts by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    paddingLeft: "30px",
                    paddingTop: "8px",
                    paddingBottom: "8px",
                    fontSize: "13px",
                    backgroundColor: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    width: "100%"
                  }}
                />
              </div>

              {/* Posts Feed */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {visiblePins
                  .filter(pin => pin.title.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((pin) => {
                    const liked = pin.likes?.includes(user.uid);
                    return (
                      <div
                        key={pin.id}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "10px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          position: "relative"
                        }}
                      >
                        {/* Author Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img 
                            src={pin.authorProfilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"} 
                            alt="" 
                            style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} 
                          />
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600 }}>@{pin.authorUsername}</span>
                            <span style={{ fontSize: "9px", color: "#555" }}>
                              {pin.timestamp?.toDate ? pin.timestamp.toDate().toLocaleDateString() : "Just now"}
                            </span>
                          </div>
                          <span style={{
                            marginLeft: "auto",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: pin.isPublic ? "#ffc107" : "#ff3333",
                            backgroundColor: pin.isPublic ? "rgba(255,193,7,0.1)" : "rgba(255,51,51,0.1)",
                            padding: "2px 6px",
                            borderRadius: "4px"
                          }}>
                            {pin.isPublic ? "Public" : "Private"}
                          </span>
                        </div>

                        {/* Content */}
                        <div>
                          <h4 style={{ fontWeight: 600, fontSize: "14px", marginBottom: "4px" }}>{pin.title}</h4>
                          <p style={{ fontSize: "12px", color: "#ccc", lineHeight: "1.4" }}>{pin.content}</p>
                        </div>

                        {/* Media */}
                        {pin.mediaUrl && (
                          <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", maxHeight: "160px", backgroundColor: "#000" }}>
                            {isVideoUrl(pin.mediaUrl) ? (
                              <video src={pin.mediaUrl} controls playsInline style={{ width: "100%", height: "100%", maxHeight: "160px", objectFit: "cover" }} />
                            ) : (
                              <img src={pin.mediaUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                          </div>
                        )}

                        {/* Interaction Bar */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          borderTop: "1px solid rgba(255,255,255,0.04)",
                          paddingTop: "10px",
                          fontSize: "12px",
                          color: "#666"
                        }}>
                          {/* Likes Button */}
                          <button
                            onClick={() => handleToggleLike(pin.id, pin.likes)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              color: liked ? "#ff3333" : "#888",
                              padding: "0"
                            }}
                          >
                            <Heart size={14} fill={liked ? "#ff3333" : "none"} />
                            <span>{pin.likes?.length || 0}</span>
                          </button>

                          {/* Comments Trigger */}
                          <button
                            onClick={() => setActiveCommentsPostId(activeCommentsPostId === pin.id ? null : pin.id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              color: activeCommentsPostId === pin.id ? "#0070f3" : "#888",
                              padding: "0"
                            }}
                          >
                            <MessageSquare size={14} />
                            <span>Comments</span>
                          </button>

                          {/* Locate Button */}
                          {(pin.allowLocate || !pin.isPublic) && (
                            <button
                              onClick={() => setGlobeTarget({ lat: pin.latitude, lng: pin.longitude })}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#0070f3",
                                marginLeft: "auto",
                                padding: "0"
                              }}
                              title="Locate on Globe"
                            >
                              <Compass size={14} />
                              <span style={{ fontSize: "10px", fontWeight: 600 }}>Locate</span>
                            </button>
                          )}
                        </div>

                        {/* Comments Drawer */}
                        {activeCommentsPostId === pin.id && (
                          <div style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            backgroundColor: "rgba(0,0,0,0.2)",
                            border: "1px solid rgba(255,255,255,0.04)",
                            borderRadius: "6px",
                            padding: "10px",
                            marginTop: "8px"
                          }}>
                            {/* List */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                              {commentsList.length === 0 ? (
                                <div style={{ fontSize: "11px", color: "#555", textAlign: "center" }}>No comments yet. Be the first!</div>
                              ) : (
                                commentsList.map((comment) => (
                                  <div key={comment.id} style={{ display: "flex", gap: "8px", fontSize: "11px" }}>
                                    <img 
                                      src={comment.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"} 
                                      alt="" 
                                      style={{ width: "20px", height: "20px", borderRadius: "50%", objectFit: "cover" }} 
                                    />
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                      <div>
                                        <span style={{ fontWeight: 600, color: "#fff", marginRight: "4px" }}>@{comment.username}</span>
                                        <span style={{ color: "#ccc" }}>{comment.text}</span>
                                      </div>
                                      <span style={{ fontSize: "8px", color: "#444" }}>
                                        {comment.timestamp?.toDate ? comment.timestamp.toDate().toLocaleTimeString() : "Just now"}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Submit Input */}
                            <form onSubmit={(e) => handleAddComment(e, pin.id)} style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                style={{
                                  flex: 1,
                                  fontSize: "11px",
                                  padding: "6px 10px",
                                  backgroundColor: "#050505",
                                  border: "1px solid rgba(255,255,255,0.06)",
                                  borderRadius: "6px"
                                }}
                              />
                              <button type="submit" style={{ padding: "6px 10px", backgroundColor: "#0070f3", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                <Send size={10} style={{ color: "#fff" }} />
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          {/* TAB 2: CREATE POST */}
          {activeTab === "create" && (
            <>
              <div>
                <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                  Create Post
                </h3>
                <p style={{ color: "#888", fontSize: "12px" }}>
                  Drop a pin at coordinates to record your memories in 3D space.
                </p>
              </div>

              {/* Landmark quick access inside Create tab */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>
                  Quick Coordinate Selection
                </span>
                <select
                  value=""
                  onChange={(e) => {
                    const landmarkId = e.target.value;
                    if (!landmarkId) return;
                    const landmark = landmarks.find(l => l.id === landmarkId);
                    if (landmark) {
                      setSelectedCoords({ lat: landmark.latitude, lng: landmark.longitude });
                      setGlobeTarget({ lat: landmark.latitude, lng: landmark.longitude });
                      setTitle(landmark.name);
                    }
                  }}
                  style={{
                    width: "100%",
                    backgroundColor: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    padding: "8px",
                    fontSize: "13px",
                    color: "#fff"
                  }}
                >
                  <option value="">-- Jump to Landmark --</option>
                  {landmarks.map(landmark => (
                    <option key={landmark.id} value={landmark.id}>
                      {landmark.name} ({landmark.country})
                    </option>
                  ))}
                </select>
              </div>

              {/* Coordinates target display */}
              <div style={{
                backgroundColor: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>
                    Selected Target
                  </span>
                  <button 
                    type="button"
                    onClick={updateLocation} 
                    disabled={isRefreshingLocation}
                    className="btn btn-secondary" 
                    style={{ padding: "4px 8px", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <RefreshCw size={10} className={isRefreshingLocation ? "animate-spin" : ""} /> 
                    {isRefreshingLocation ? "Syncing..." : "Sync GPS"}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={16} style={{ color: "#0070f3" }} />
                  <div style={{ fontFamily: "Space Mono, monospace", fontSize: "12px" }}>
                    {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <form onSubmit={handleDropPin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px" }}>Post Title</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g., Grand Canyon Visit" />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px" }}>Description</label>
                  <textarea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="What did you capture through your lens?" style={{ minHeight: "80px" }} />
                </div>

                {/* File Uploader */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}>
                    <Image size={14} style={{ color: "#0070f3" }} /> Media Attachment
                  </label>

                  {isCloudinaryConfigured ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {!imagePreview ? (
                        <label style={{
                          border: "1px dashed #333",
                          borderRadius: "8px",
                          padding: "20px 10px",
                          textAlign: "center",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: "rgba(255,255,255,0.01)",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#0070f3";
                          e.currentTarget.style.backgroundColor = "rgba(0,112,243,0.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#333";
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.01)";
                        }}
                        >
                          <UploadCloud size={24} style={{ color: "#666" }} />
                          <div style={{ fontSize: "11px", color: "#ccc" }}>Select Image/Video to Upload</div>
                          <input 
                            type="file" 
                            accept="image/*,video/*" 
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                setImageFile(file);
                                setImagePreview(URL.createObjectURL(file));
                              }
                            }}
                            style={{ display: "none" }}
                          />
                        </label>
                      ) : (
                        <div style={{
                          position: "relative",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: "1px solid #333",
                          height: "120px",
                          backgroundColor: "#050505"
                        }}>
                          {imageFile && imageFile.type.startsWith("video/") ? (
                            <video src={imagePreview} muted loop autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <img src={imagePreview} alt="Upload preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            style={{
                              position: "absolute",
                              top: "8px",
                              right: "8px",
                              backgroundColor: "rgba(0,0,0,0.75)",
                              border: "1px solid rgba(255,255,255,0.2)",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              cursor: "pointer"
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <input type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Fallback: enter direct photo URL..." />
                    </div>
                  )}
                </div>

                {/* Privacy Visibility Selector */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px" }}>Post Privacy</label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setIsPublic(true)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: "1px solid",
                        borderColor: isPublic ? "#0070f3" : "rgba(255,255,255,0.08)",
                        backgroundColor: isPublic ? "rgba(0, 112, 243, 0.1)" : "transparent",
                        color: isPublic ? "#fff" : "#666",
                        cursor: "pointer"
                      }}
                    >
                      Public
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPublic(false);
                        setAllowLocate(false); // Can't locate private posts on globe for public
                      }}
                      style={{
                        flex: 1,
                        padding: "8px",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "6px",
                        border: "1px solid",
                        borderColor: !isPublic ? "#0070f3" : "rgba(255,255,255,0.08)",
                        backgroundColor: !isPublic ? "rgba(0, 112, 243, 0.1)" : "transparent",
                        color: !isPublic ? "#fff" : "#666",
                        cursor: "pointer"
                      }}
                    >
                      Private
                    </button>
                  </div>
                </div>

                {/* Locate Opt-In Toggle (Public only) */}
                {isPublic && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    marginTop: "4px"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>Allow others to locate on Globe</span>
                      <span style={{ fontSize: "10px", color: "#666" }}>Let viewers focus globe target camera</span>
                    </div>
                    <input 
                      type="checkbox"
                      checked={allowLocate}
                      onChange={(e) => setAllowLocate(e.target.checked)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px" }}>Proximity Activation Radius</label>
                  <select value={radius} onChange={(e) => setRadius(e.target.value)}>
                    <option value="15">15m (Highly restricted)</option>
                    <option value="50">50m (Standard proximity)</option>
                    <option value="150">150m (Wide range)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={uploading} 
                  className="btn btn-primary" 
                  style={{ 
                    width: "100%", 
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {uploading ? (
                    <>
                      <div style={{
                        border: "2px solid rgba(255,255,255,0.2)",
                        borderTop: "2px solid #fff",
                        borderRadius: "50%",
                        width: "14px",
                        height: "14px",
                        animation: "spin 0.8s linear infinite"
                      }}></div>
                      <span>Uploading Media...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} /> Drop Pin
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* TAB 3: SEARCH AROUND YOU */}
          {activeTab === "search" && (
            <>
              <div>
                <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                  Search Around You
                </h3>
                <p style={{ color: "#888", fontSize: "12px" }}>
                  Locate public and private memories nearby.
                </p>
              </div>

              {/* Current Location Display & Refresh */}
              <div style={{
                backgroundColor: "#0a0a0a",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>
                    Your GPS Location
                  </span>
                  <button 
                    type="button"
                    onClick={updateLocation} 
                    disabled={isRefreshingLocation}
                    className="btn btn-secondary" 
                    style={{ padding: "4px 8px", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <RefreshCw size={10} className={isRefreshingLocation ? "animate-spin" : ""} /> 
                    {isRefreshingLocation ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MapPin size={16} style={{ color: "#39ff14" }} />
                  <div style={{ fontFamily: "Space Mono, monospace", fontSize: "12px" }}>
                    {userCoords ? `${userCoords.lat.toFixed(6)}, ${userCoords.lng.toFixed(6)}` : "Detecting location..."}
                  </div>
                </div>
              </div>

              {/* Radius slider control */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600 }}>
                  <span>Discovery Radius</span>
                  <span style={{ color: "#0070f3" }}>
                    {searchNearRadius >= 1000 ? `${(searchNearRadius / 1000).toFixed(1)} km` : `${searchNearRadius} m`}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="50000"
                  step="50"
                  value={searchNearRadius}
                  onChange={(e) => setSearchNearRadius(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#0070f3", cursor: "pointer" }}
                />
              </div>

              {/* Search Results */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>
                  Interactions in range ({nearbyPins.length})
                </span>

                {nearbyPins.length === 0 ? (
                  <div style={{
                    backgroundColor: "rgba(255,255,255,0.01)",
                    border: "1px dashed rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    padding: "20px",
                    textAlign: "center",
                    color: "#555",
                    fontSize: "12px"
                  }}>
                    No posts found in this range. Try increasing the discovery radius slider.
                  </div>
                ) : (
                  nearbyPins.map(pin => {
                    const dist = userCoords ? calculateDistance(userCoords.lat, userCoords.lng, pin.latitude, pin.longitude) : 0;
                    const distStr = dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
                    return (
                      <div
                        key={pin.id}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.02)",
                          border: "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "8px",
                          padding: "12px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: "13px" }}>{pin.title}</span>
                          <span style={{ fontSize: "10px", color: "#0070f3", fontWeight: 600 }}>{distStr}</span>
                        </div>
                        <p style={{ fontSize: "11px", color: "#888" }} className="line-clamp-2">{pin.content}</p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                          <span style={{ fontSize: "10px", color: "#555" }}>By @{pin.authorUsername}</span>
                          <button
                            onClick={() => {
                              setSelectedCoords({ lat: pin.latitude, lng: pin.longitude });
                              setGlobeTarget({ lat: pin.latitude, lng: pin.longitude });
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#0070f3",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              padding: "0",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Compass size={12} /> Focus
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {/* TAB 4: FRIENDS MANAGEMENT */}
          {activeTab === "friends" && (
            <>
              <div>
                <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                  Friends Management
                </h3>
                <p style={{ color: "#888", fontSize: "12px" }}>
                  Add friends by UID to share private posts with each other.
                </p>
              </div>

              {/* User unique UID Card */}
              {profile && (
                <div style={{
                  backgroundColor: "rgba(0, 112, 243, 0.04)",
                  border: "1px solid rgba(0, 112, 243, 0.15)",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>
                      My Unique UID
                    </span>
                    <button
                      onClick={handleCopyUid}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0070f3",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "10px",
                        fontWeight: 600
                      }}
                    >
                      {copiedUid ? <Check size={10} /> : <Copy size={10} />}
                      {copiedUid ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div style={{
                    fontFamily: "Space Mono, monospace",
                    fontSize: "11px",
                    color: "#ccc",
                    wordBreak: "break-all",
                    backgroundColor: "#050505",
                    padding: "8px",
                    borderRadius: "4px"
                  }}>
                    {profile.uid}
                  </div>
                </div>
              )}

              {/* Add Friends Search */}
              <form onSubmit={handleSearchFriend} style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Enter Username or UID..."
                  value={friendSearchQuery}
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: "12px",
                    padding: "8px 12px",
                    backgroundColor: "#0a0a0a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px"
                  }}
                />
                <button type="submit" disabled={friendSearchLoading} className="btn btn-secondary" style={{ padding: "8px 12px", fontSize: "12px" }}>
                  {friendSearchLoading ? "..." : "Search"}
                </button>
              </form>

              {/* Search Result */}
              {friendSearchResult && (
                <div style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px"
                }}>
                  <img 
                    src={friendSearchResult.profilePic} 
                    alt="" 
                    style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} 
                  />
                  <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span style={{ fontSize: "13px", fontWeight: 600 }}>@{friendSearchResult.username}</span>
                    <span style={{ fontSize: "10px", color: "#666" }} className="line-clamp-1">{friendSearchResult.bio}</span>
                  </div>
                  
                  {profile?.friends?.includes(friendSearchResult.uid) ? (
                    <button
                      onClick={() => handleRemoveFriend(friendSearchResult.uid)}
                      style={{
                        padding: "6px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: "rgba(255,51,51,0.1)",
                        border: "1px solid rgba(255,51,51,0.2)",
                        borderRadius: "6px",
                        color: "#ff3333",
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddFriend(friendSearchResult.uid)}
                      style={{
                        padding: "6px 10px",
                        fontSize: "11px",
                        fontWeight: 600,
                        backgroundColor: "rgba(0,112,243,0.1)",
                        border: "1px solid rgba(0,112,243,0.2)",
                        borderRadius: "6px",
                        color: "#0070f3",
                        cursor: "pointer"
                      }}
                    >
                      Add
                    </button>
                  )}
                </div>
              )}

              {friendSearchError && (
                <div style={{ fontSize: "11px", color: "#ff3333", textAlign: "center" }}>{friendSearchError}</div>
              )}

              {/* Friends list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#888", textTransform: "uppercase" }}>
                  My Friends ({friendsList.length})
                </span>

                {friendsList.length === 0 ? (
                  <div style={{
                    backgroundColor: "rgba(255,255,255,0.01)",
                    border: "1px dashed rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    padding: "20px",
                    textAlign: "center",
                    color: "#555",
                    fontSize: "12px"
                  }}>
                    You haven't added any friends yet. Add friends by searching their UID!
                  </div>
                ) : (
                  friendsList.map(f => (
                    <div
                      key={f.uid}
                      style={{
                        backgroundColor: "rgba(255,255,255,0.01)",
                        border: "1px solid rgba(255,255,255,0.04)",
                        borderRadius: "8px",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                      }}
                    >
                      <img 
                        src={f.profilePic} 
                        alt="" 
                        style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }} 
                      />
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <span style={{ fontSize: "12px", fontWeight: 600 }}>@{f.username}</span>
                        <span style={{ fontSize: "9px", color: "#555" }} className="line-clamp-1">{f.bio}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveFriend(f.uid)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ff3333",
                          fontSize: "11px",
                          fontWeight: 500,
                          cursor: "pointer",
                          padding: "4px 8px"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* TAB 5: EDIT PROFILE */}
          {activeTab === "profile" && (
            <>
              <div>
                <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>
                  Edit Profile
                </h3>
                <p style={{ color: "#888", fontSize: "12px" }}>
                  Update your identity on the geospatial grid.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Avatar Picker */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <label style={{ position: "relative", cursor: "pointer", borderRadius: "50%", overflow: "hidden", width: "80px", height: "80px", border: "2px solid #0070f3" }}>
                    <img 
                      src={profilePicPreview || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150"} 
                      alt="Avatar" 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                    <div style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      fontSize: "9px",
                      textAlign: "center",
                      padding: "2px 0"
                    }}>
                      Change
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setProfileFile(file);
                          setProfilePicPreview(URL.createObjectURL(file));
                        }
                      }}
                      style={{ display: "none" }}
                    />
                  </label>
                  <span style={{ fontSize: "11px", color: "#666" }}>Click on avatar to upload photo</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px" }}>Username</label>
                  <input 
                    type="text" 
                    required 
                    value={editUsername} 
                    onChange={(e) => setEditUsername(e.target.value.replace(/\s+/g, "_"))} // replace spaces with underscores for handles
                    placeholder="john_doe" 
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "12px" }}>Bio</label>
                  <textarea 
                    value={editBio} 
                    onChange={(e) => setEditBio(e.target.value)} 
                    placeholder="Write a brief bio about yourself..." 
                    style={{ minHeight: "80px" }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={savingProfile} 
                  className="btn btn-primary" 
                  style={{ 
                    width: "100%", 
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  {savingProfile ? "Saving Settings..." : "Save Changes"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

