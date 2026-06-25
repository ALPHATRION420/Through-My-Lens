# Through My Lens - Project Notes & Conversation History

This document compiles the key ideas, technical recommendations, and specifications discussed so far to ensure all details are saved directly within the project workspace.

---

## 1. Project Overview & Mechanics
"Through My Lens" is a Geospatial Augmented Reality (AR) Social Network Android application.

- **Drop Posts**: Users can publish images, videos, text, articles, or blogs at their current live physical location.
- **Dual Discovery**:
  - **Map View**: A 2D radar/map interface showing hotspots and markers in the user's vicinity.
  - **AR Camera View**: A 3D camera view (similar to Pokémon GO) where users scan their environment and see digital posts floating in 3D space.
- **Location-Gated Interactions**: Users can only view, like, comment, share, or follow a creator if they are physically within a specific radius (e.g., 50 meters) of the post.
- **Geocaching / Story Trails**: Linking multiple locations together into sequential tours or scavenger hunts (future phase).

---

## 2. Recommended Tech Stack
Optimized for local development on Windows in the `D:\Through my lens` directory:

- **Language**: Kotlin (Google's official language for Android; runs natively on Windows).
- **UI**: Jetpack Compose (Modern native UI framework).
- **AR Engine**: Sceneview / ARCore (3D coordinate anchoring).
- **Backend & Database**: Firebase (Authentication, Firestore for Geohash spatial queries, and Cloud Storage for media).

---

## 3. Key Q&A & Clarifications
* **Q: Is Kotlin exclusive to macOS?**
  * **A**: No. Kotlin runs on Windows, macOS, and Linux. Android Studio is fully supported on Windows.
* **Q: Where will the project code be managed?**
  * **A**: All code, configuration, and project files will be stored in `D:\Through my lens`.
