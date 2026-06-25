import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function AuthScreen({ auth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#000",
      position: "relative",
      overflow: "hidden",
      padding: "20px"
    }}>
      {/* Decorative Blur Backgrounds */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "30%",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0, 112, 243, 0.1) 0%, transparent 70%)",
        filter: "blur(60px)",
        pointerEvents: "none"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#0a0a0a",
          border: "1px solid #1f1f1f",
          borderRadius: "12px",
          padding: "40px 30px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          zIndex: 10
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{
              display: "inline-flex",
              padding: "12px",
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid #1f1f1f",
              marginBottom: "16px",
              color: "#0070f3"
            }}
          >
            <Globe size={28} />
          </motion.div>
          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "24px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: "8px"
          }}>
            Through My Lens
          </h2>
          <p style={{ color: "#888", fontSize: "14px" }}>
            Geospatial Augmented Reality Social Network
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@domain.com"
              style={{
                backgroundColor: "#050505",
                border: "1px solid #1f1f1f",
                borderRadius: "6px",
                color: "#fff",
                padding: "12px",
                fontSize: "14px"
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Lock size={14} /> Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  backgroundColor: "#050505",
                  border: "1px solid #1f1f1f",
                  borderRadius: "6px",
                  color: "#fff",
                  padding: "12px",
                  paddingRight: "44px",
                  fontSize: "14px",
                  width: "100%",
                  boxSizing: "border-box"
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#555",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  transition: "color 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#aaa"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#555"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{
                  color: "#ff3333",
                  fontSize: "13px",
                  fontWeight: 500,
                  backgroundColor: "rgba(255, 51, 51, 0.05)",
                  border: "1px solid rgba(255, 51, 51, 0.1)",
                  borderRadius: "6px",
                  padding: "10px 12px",
                  marginTop: "4px"
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              marginTop: "8px",
              padding: "12px",
              fontSize: "14px",
              fontWeight: 600,
              width: "100%"
            }}
          >
            {loading ? "Authenticating..." : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {isSignUp ? "Create Account" : "Access Portal"} <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <div style={{
          marginTop: "24px",
          textAlign: "center",
          fontSize: "13px",
          color: "#888"
        }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
            style={{
              color: "#0070f3",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
