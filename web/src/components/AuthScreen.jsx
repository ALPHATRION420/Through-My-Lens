import React, { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Lock, Mail, Eye, EyeOff, Loader2, UserPlus, LogIn } from "lucide-react";

// ── Design tokens ────────────────────────────────────────────────────────────
const accent = {
  blue:   "#4F9FFF",
  cyan:   "#00E5FF",
  purple: "#B47FFF",
  red:    "#FF4C6A",
};

// ── Floating-label input ──────────────────────────────────────────────────────
function AuthInput({ label, type = "text", value, onChange, required, icon: Icon, rightEl }) {
  const [focused, setFocused] = useState(false);
  const active = focused || value;
  return (
    <div style={{ position: "relative" }}>
      <div style={{
        borderRadius: "14px",
        border: `1px solid ${active ? accent.blue + "99" : "rgba(255,255,255,0.09)"}`,
        background: active ? "rgba(79,159,255,0.06)" : "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: active
          ? "0 0 0 3px rgba(79,159,255,0.14), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        position: "relative",
      }}>
        {Icon && (
          <Icon size={14} style={{
            position: "absolute", left: "14px", top: "50%",
            transform: "translateY(-50%)",
            color: active ? accent.blue : "#555",
            transition: "color 0.3s", zIndex: 1,
          }} />
        )}
        <label style={{
          position: "absolute",
          left: Icon ? "38px" : "14px",
          top: active ? "8px" : "50%",
          transform: active ? "none" : "translateY(-50%)",
          fontSize: active ? "9px" : "13px",
          fontWeight: active ? 700 : 400,
          color: active ? accent.blue : "#555",
          textTransform: active ? "uppercase" : "none",
          letterSpacing: active ? "0.1em" : 0,
          transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: "none", zIndex: 1,
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
          style={{
            display: "block", width: "100%", background: "transparent",
            border: "none", outline: "none", color: "#fff",
            fontFamily: "Inter, sans-serif", fontSize: "14px",
            padding: Icon ? "24px 44px 10px 38px" : "24px 14px 10px",
            borderRadius: "14px",
          }}
        />
        {rightEl && (
          <div style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", zIndex: 1 }}>
            {rightEl}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Password strength bar ─────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  let strength = 0;
  if (password.length >= 8)          strength++;
  if (/[A-Z]/.test(password))        strength++;
  if (/[0-9]/.test(password))        strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  const colors = ["#FF4C6A", "#FF8C42", "#FFD700", "#39FF14"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", gap: "4px" }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: "3px", borderRadius: "2px",
            background: i < strength ? colors[strength - 1] : "rgba(255,255,255,0.08)",
            boxShadow: i < strength ? `0 0 6px ${colors[strength-1]}88` : "none",
            transition: "all 0.35s",
          }} />
        ))}
      </div>
      <div style={{ textAlign: "right", fontSize: "9px", color: colors[strength - 1], fontWeight: 700 }}>
        {labels[strength - 1]}
      </div>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AuthScreen({ auth }) {
  const [isSignUp, setIsSignUp]       = useState(false);
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [error, setError]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      isSignUp
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => { setIsSignUp(v => !v); setError(""); };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "#030308",
      position: "relative", overflow: "hidden",
      padding: "20px",
    }}>
      <style>{`
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-30px) scale(1.08)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 33%{transform:translate(-30px,40px) scale(0.95)} 66%{transform:translate(20px,20px)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,-40px) scale(1.1)} }
        @keyframes orbitSpin   { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
        @keyframes counterSpin { from{transform:rotate(0deg)}  to{transform:rotate(-360deg)} }
        @keyframes authSpin    { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
      `}</style>

      {/* Floating orbs */}
      <div style={{ position:"absolute", top:"-10%", right:"-5%", width:"520px", height:"520px", borderRadius:"50%", background:"radial-gradient(circle,rgba(79,159,255,0.13) 0%,transparent 70%)", filter:"blur(50px)", animation:"orbFloat1 9s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:"-15%", left:"-8%", width:"620px", height:"620px", borderRadius:"50%", background:"radial-gradient(circle,rgba(180,127,255,0.10) 0%,transparent 70%)", filter:"blur(60px)", animation:"orbFloat2 13s ease-in-out infinite", pointerEvents:"none" }} />
      <div style={{ position:"absolute", top:"40%", left:"35%", width:"350px", height:"350px", borderRadius:"50%", background:"radial-gradient(circle,rgba(0,229,255,0.07) 0%,transparent 70%)", filter:"blur(40px)", animation:"orbFloat3 11s ease-in-out infinite", pointerEvents:"none" }} />

      {/* Grid dot overlay */}
      <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize:"32px 32px", pointerEvents:"none" }} />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: "100%", maxWidth: "420px",
          background: "rgba(8, 8, 20, 0.88)",
          backdropFilter: "blur(52px) saturate(1.6)",
          WebkitBackdropFilter: "blur(52px) saturate(1.6)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "26px",
          padding: "40px 36px 36px",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09), 0 50px 120px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.02)",
          position: "relative", zIndex: 10, overflow: "hidden",
        }}
      >
        {/* Top edge glow */}
        <div style={{ position:"absolute", top:0, left:"15%", right:"15%", height:"1px", background:`linear-gradient(90deg,transparent,rgba(79,159,255,0.55),rgba(0,229,255,0.35),transparent)`, pointerEvents:"none" }} />

        {/* Brand / Globe ──────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", position: "relative", marginBottom: "18px" }}>
            {/* Orbit ring */}
            <div style={{
              width: "82px", height: "82px", borderRadius: "50%",
              border: "1px dashed rgba(79,159,255,0.4)",
              animation: "orbitSpin 8s linear infinite",
              position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* Orbit dot */}
              <div style={{
                position: "absolute", top: "-5px", left: "50%", transform: "translateX(-50%)",
                width: "10px", height: "10px", borderRadius: "50%",
                background: accent.cyan, boxShadow: `0 0 14px ${accent.cyan}, 0 0 28px ${accent.cyan}66`,
              }} />
              {/* Counter-rotating globe */}
              <div style={{
                width: "54px", height: "54px", borderRadius: "50%",
                background: "linear-gradient(135deg,rgba(79,159,255,0.18),rgba(180,127,255,0.12))",
                border: "1px solid rgba(79,159,255,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 24px rgba(79,159,255,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
                animation: "counterSpin 8s linear infinite",
              }}>
                <Globe size={24} style={{ color: accent.blue }} />
              </div>
            </div>
          </div>

          <h2 style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "26px", fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 6px",
            background: `linear-gradient(135deg, #ffffff 0%, ${accent.cyan} 60%, ${accent.blue} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Through My Lens
          </h2>
          <p style={{ color: "#555", fontSize: "11px", margin: 0, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Geospatial AR Social Network
          </p>
        </div>

        {/* Mode toggle ──────────────────── */}
        <div style={{
          display: "flex", gap: "4px", marginBottom: "24px",
          background: "rgba(0,0,0,0.35)", borderRadius: "14px", padding: "4px",
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          {[
            { label: "Sign In",  icon: LogIn,    signUp: false },
            { label: "Sign Up",  icon: UserPlus, signUp: true  },
          ].map(({ label, icon: Icon, signUp }) => {
            const active = isSignUp === signUp;
            return (
              <button key={label} type="button"
                onClick={() => { if (isSignUp !== signUp) switchMode(); }}
                style={{
                  flex: 1, padding: "10px", borderRadius: "10px",
                  border: active ? `1px solid ${accent.blue}66` : "1px solid transparent",
                  background: active
                    ? `linear-gradient(135deg, rgba(79,159,255,0.22), rgba(0,229,255,0.10))`
                    : "transparent",
                  color: active ? "#fff" : "#555",
                  fontSize: "13px", fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                  boxShadow: active ? `0 0 18px rgba(79,159,255,0.18)` : "none",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                <Icon size={13} /> {label}
              </button>
            );
          })}
        </div>

        {/* Form ──────────────────── */}
        <AnimatePresence mode="wait">
          <motion.form
            key={isSignUp ? "signup" : "signin"}
            initial={{ opacity: 0, x: isSignUp ? 18 : -18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isSignUp ? -18 : 18 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "14px" }}
          >
            <AuthInput label="Email Address" type="email" value={email} onChange={e => setEmail(e.target.value)} required icon={Mail} />

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <AuthInput
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required icon={Lock}
                rightEl={
                  <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                    style={{ background:"none", border:"none", cursor:"pointer", color:"#555", padding:0, display:"flex", alignItems:"center", transition:"color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "#ccc"}
                    onMouseLeave={e => e.currentTarget.style.color = "#555"}
                  >
                    {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                }
              />
              <AnimatePresence>
                {isSignUp && password && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} transition={{duration:0.2}}>
                    <PasswordStrength password={password} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:"auto" }} exit={{ opacity:0, height:0 }}
                  style={{ color: accent.red, fontSize:"12px", fontWeight:500, background:"rgba(255,76,106,0.08)", border:"1px solid rgba(255,76,106,0.22)", borderRadius:"12px", padding:"10px 14px", lineHeight:1.4 }}
                >
                  ⚠️ {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width:"100%", padding:"15px", borderRadius:"14px", marginTop:"4px",
                border: loading ? "1px solid rgba(79,159,255,0.18)" : `1px solid ${accent.blue}66`,
                background: loading
                  ? "rgba(79,159,255,0.06)"
                  : `linear-gradient(135deg,rgba(79,159,255,0.26) 0%,rgba(180,127,255,0.16) 50%,rgba(0,229,255,0.16) 100%)`,
                color: loading ? "#555" : "#fff",
                fontSize:"14px", fontWeight:700, fontFamily:"Space Grotesk, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
                backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)",
                boxShadow: loading ? "none" : `0 0 32px rgba(79,159,255,0.22), inset 0 1px 0 rgba(255,255,255,0.12)`,
                transition:"all 0.3s cubic-bezier(0.4,0,0.2,1)",
                letterSpacing:"0.04em",
              }}
              onMouseEnter={e => { if(!loading){ e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 0 44px rgba(79,159,255,0.35),inset 0 1px 0 rgba(255,255,255,0.15)`; }}}
              onMouseLeave={e => { if(!loading){ e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow=`0 0 32px rgba(79,159,255,0.22),inset 0 1px 0 rgba(255,255,255,0.12)`; }}}
            >
              {loading
                ? <><Loader2 size={16} style={{animation:"authSpin 0.8s linear infinite"}}/> Authenticating…</>
                : isSignUp
                  ? <><UserPlus size={15}/> Create Account</>
                  : <><LogIn size={15}/> Access Portal</>
              }
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Switch mode link */}
        <div style={{ marginTop:"22px", textAlign:"center", fontSize:"12px", color:"#555" }}>
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            onClick={switchMode}
            style={{ color: accent.blue, cursor:"pointer", fontWeight:700, transition:"color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = accent.cyan}
            onMouseLeave={e => e.currentTarget.style.color = accent.blue}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
