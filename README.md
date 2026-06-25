# 📸 Through My Lens

> **A Geospatial AR Social Network — Drop your world, explore theirs.**

Through My Lens is a location-anchored social media platform where users can publish posts (images, videos, text, articles) tied to their **exact physical GPS coordinates**. Other users can only interact with a post — like, comment, share, or follow the creator — when they are **physically present** at that location.

---

## ✨ Features

### 🌍 3D Globe & 2D Map Visualization
- **Interactive 3D Globe** rendered with `globe.gl` — explore posts, landmarks, and friends pins from anywhere in the world.
- **2D Map fallback** with radar-style hotspot discovery.
- Smooth **1.8-second fly-to animation** when locating a specific post.
- Color-coded markers:
  - 🟡 **Yellow** — Landmark points & public posts
  - 🟢 **Neon Green** — Your current location
  - ⚪ **White** — Drop-target pin
  - 🔴 **Red** — Private posts (friends only)
  - Concentric **ripple rings** denote proximity radius around active posts.

### 📍 Location-Gated Interactions
Users can only view, like, comment, share, or follow a creator if they are physically within a configurable radius (e.g., **50 meters**) of the post. This enforces real-world presence and creates genuine local discovery.

### 🗺️ Modules (Hero Overlay Panel)
| Module | Description |
|---|---|
| **Browse Feed** | Scrollable feed of posts with likes, comment drawers, and globe-locate |
| **Create Post** | GPS coordinate selector, title, description, media upload to Cloudinary |
| **Search Around You** | Radius-based post filter (50m to 50km slider) |
| **Friends** | Direct mutual friendship management by UID/Username |
| **Edit Profile** | Update username, bio, and profile picture |

### 🔒 Privacy Controls
- **Public posts** — visible to all, locatable when `allowLocate` is enabled.
- **Private posts** — visible only to author + mutual friends; always locatable by authorized users.

---

## 🛠️ Tech Stack

### Android App
| Layer | Technology |
|---|---|
| Language | Kotlin |
| UI | Jetpack Compose |
| AR Engine | ARCore / Sceneview |
| Backend | Firebase (Auth, Firestore, Cloud Storage) |
| Spatial Queries | Geohash via Firestore |

### Web Companion (/web)
| Layer | Technology |
|---|---|
| Framework | React + Vite |
| Styling | Vanilla CSS (Glassmorphism) |
| 3D Globe | globe.gl + three-globe |
| Map | Leaflet.js |
| Backend | Firebase (Firestore, Auth) |
| Media Upload | Cloudinary |

---

## 📁 Project Structure

```
Through My Lens/
├── app/                        # Android (Kotlin / Jetpack Compose)
│   └── src/main/java/com/app/throughmylens/
│       ├── MainActivity.kt
│       ├── Navigation.kt
│       ├── data/DataRepository.kt
│       ├── theme/
│       └── ui/main/
│           ├── MainScreen.kt
│           └── MainScreenViewModel.kt
│
├── web/                        # Web companion (React + Vite)
│   └── src/
│       ├── components/
│       │   ├── AuthScreen.jsx      # Login / Sign-up screen
│       │   ├── Dashboard.jsx       # Main app shell & hero overlay
│       │   ├── GlobeView.jsx       # 3D interactive globe
│       │   └── MapView.jsx         # 2D map fallback
│       ├── data/landmarks.js       # Global landmark coordinates
│       ├── App.jsx
│       └── App.css
│
├── project_notes.md            # Architecture decisions & Q&A log
├── changes_summary.txt         # Detailed changelog
└── README.md
```

---

## 🚀 Getting Started

### Web App

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173

### Android App

1. Open the project root in **Android Studio**.
2. Add your `google-services.json` to `app/` (from your Firebase project console).
3. Sync Gradle and run on an emulator or physical device.

> ⚠️ `google-services.json` is excluded from this repository. You must supply your own Firebase configuration.

---

## 🔑 Environment Setup

### Firebase
- Create a Firebase project at https://console.firebase.google.com
- Enable **Authentication** (Email/Password + Google Sign-In)
- Enable **Firestore** with the following collections:
  - `posts` — geospatial post records
  - `users` — user profiles and friend relationships
- Enable **Cloud Storage** for media

### Cloudinary (Web)
- Create an account at https://cloudinary.com
- Set your **Cloud Name** and **Upload Preset** in `web/src/components/Dashboard.jsx`

---

## 🗺️ Roadmap

- [ ] **Geocaching / Story Trails** — Link multiple locations into sequential tours or scavenger hunts
- [ ] **AR Camera View** — 3D camera view (Pokemon GO-style) where users scan their environment and see floating digital posts
- [ ] **Push Notifications** — Alert users when friends drop posts nearby
- [ ] **Proximity Unlocks** — Exclusive content that reveals only when physically present
- [ ] **Heatmaps** — Visual density layers showing where the most activity is happening

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

Built with love by Dhruv Saxena
