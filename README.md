# expo-photosyncapp

Offline-first photo sync example built with Expo (managed workflow).

## What this project is

- A small example app that captures or picks photos and keeps them safe locally when the device is offline.
- Photos are persisted in a local SQLite database and uploaded automatically when the device is online.
- The app demonstrates a simple, robust offline→online sync pattern you can adapt for your own projects.

## Key features

- Capture photos with the device camera or pick from the gallery
- Offline-first: photos are saved immediately into a local SQLite DB (`photosync.db`)
- Persistent upload queue with automatic retry, exponential backoff and concurrency control
- Background sync (uses Expo background fetch/task manager — behavior can be throttled by OS)
- Simple UI with sync status and server id display
- Basic image compression/quality controls to reduce storage usage
- Manual retry and pull-to-refresh to force queue processing

## Where data lives

- All image data and metadata is stored locally on the device in the app sandbox (SQLite database). Your PC only runs the dev server — it does not store the images.
- When a backend exists and uploads succeed, the app stores the returned `server_id` in the local DB so records can be correlated.

# PhotoSync (expo-photosyncapp)

PhotoSync is an offline-first example app built with Expo and TypeScript that demonstrates capturing/picking images, persisting them locally in SQLite, and syncing uploads when the device is online. It includes a role-based admin system (user/admin/superadmin) and lightweight audit tracking for administrative actions.

This README consolidates the project documentation into a single reference.

## Contents

- Project overview
- How to run the project
- Features and role capabilities (User / Admin / Super Admin)
- Database & storage notes
- Tech stack
- Development & troubleshooting tips

---

## Project overview

- Offline-first photo capture and sync example.
- Photos and metadata are stored locally in a SQLite database (`photosync.db`).
- App demonstrates an upload queue, retry logic, background sync, and role-based management UI.

## Key features

- Capture or pick images and store them locally (pending upload when offline)
- Persistent upload queue with retry logic and status tracking
- Background sync support (subject to OS limitations)
- Role-based management and UI:
  - User: capture/pick/upload images, view own images
  - Admin: view all images, delete images, promote users to admin (promotions recorded)
  - Super Admin: additional powers to demote admins and view full audit trails
- Auditability: promotions and deletions by admins are recorded with timestamps; new deletions capture image metadata so thumbnails can be shown in the audit view

## How deletion works

- Clicking **Remove** in the Users screen calls `deleteUser(userId)`, which deletes the user row from the `users` table; after this the account cannot sign in or perform further actions.
- By design, deleting a user currently does NOT cascade to remove related `assets`, `admin_promotions`, or `deleted_assets` rows; these are preserved to maintain an audit trail. If you'd like cascading deletes (atomic removal of related data), I can implement that change.

---

## Quick start (development)

1. Install dependencies

```powershell
cd d:\Bravo\expo-photosyncapp
npm install
```

2. Start the Expo dev server

```powershell
npm start
```

3. Run on device/emulator

- Use Expo Go (scan the QR) or run on an emulator via the Expo CLI.
- For physical device testing (camera / file I/O) it's recommended to start with a tunnel:

```powershell
npx expo start --tunnel
```

---

## Roles & admin features

- User
  - Capture photos via camera or pick from gallery
  - Photos saved locally and uploaded when online

- Admin
  - View all uploaded images with uploader info
  - Delete images (deletions are recorded)
  - Promote regular users to admin (promotions are recorded, with promoter info)

- Super Admin
  - All admin capabilities
  - Demote admins back to users
  - View audit trails for admin actions (who promoted whom, which images were deleted and when)

Notes:

- Super Admin account is created automatically on first run with preconfigured credentials in the auth logic (see `src/context/AuthContext.tsx`).

---

## Database & storage

- Local DB: `expo-sqlite` storing tables such as `users`, `assets`, `admin_promotions`, and `deleted_assets`.
- Images historically stored as base64 in the DB. For production, prefer storing image files on disk and storing file paths in the DB to reduce DB size.
- The app runs lightweight migrations at startup to add columns/tables when the schema evolves.

---

## Tech stack

- Expo (managed workflow)
- React Native + TypeScript
- SQLite via `expo-sqlite`
- Camera & gallery: `expo-camera`, `expo-image-picker`
- File handling: `expo-file-system`
- Background tasks: `expo-task-manager`, `expo-background-fetch`
- Secure storage: `expo-secure-store`
- Utilities: `rxjs` for event bus patterns

---

## Development notes & useful commands

- Install dependencies: `npm install`
- Start dev server: `npm start`
- Run on Android: `npm run android` (when configured)
- Run on iOS: `npm run ios` (when configured)

Files you will likely edit:

- `src/context/AuthContext.tsx` — authentication and role logic
- `src/db/db.ts` — migrations and DB queries
- `src/screens/*` — UI screens (Capture, UserManagement, AssetManagement, UserProfile)
- `src/utils/api.ts` — mock or real backend upload settings

---
