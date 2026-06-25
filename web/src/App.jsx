import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";

// Firebase configuration from console screenshot
const firebaseConfig = {
  apiKey: "AIzaSyATw2UGdikRrohgwTDMf75Wx43pQpL4vFM",
  authDomain: "throughmylens-d91e2.firebaseapp.com",
  projectId: "throughmylens-d91e2",
  storageBucket: "throughmylens-d91e2.firebasestorage.app",
  messagingSenderId: "545846461133",
  appId: "1:545846461133:web:1d9c7a365b43529a375f84",
  measurementId: "G-EXFGR083E2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "sans-serif"
      }}>
        <div style={{
          border: "2px solid #333",
          borderTop: "2px solid #fff",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          animation: "spin 1s linear infinite",
          marginRight: "12px"
        }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span>Accessing Matrix...</span>
      </div>
    );
  }

  return (
    <div className="app-container">
      {!user ? (
        <AuthScreen auth={auth} />
      ) : (
        <Dashboard auth={auth} user={user} db={db} storage={storage} />
      )}
    </div>
  );
}
export { app, auth, db, storage };
