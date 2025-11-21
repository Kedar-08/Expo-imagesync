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

## Tech stack

- Expo (managed workflow)
- React Native + TypeScript
- Local DB: `expo-sqlite`
- Camera & picker: `expo-camera`, `expo-image-picker`
- File handling: `expo-file-system`
- Network detection: `expo-network`
- Background: `expo-task-manager` + `expo-background-fetch` (Expo-managed limitations apply)
- Utilities: `rxjs` for event/metrics, small helper modules in `src/services`

## Quick start

1. Open a terminal and install dependencies

```powershell
cd d:\Bravo\expo-photosyncapp
npm install
```

2. Start the Expo dev server

```powershell
npm start
```

3. Launch the app

- Use Expo Go (scan the QR) or run on an emulator/device from the Expo CLI.

## Running on an external device

- To run the app on a physical/external device (recommended for testing camera, file I/O and background behavior), start the dev server using the tunnel option:

```powershell
npx expo start --tunnel
```

This will open a tunnel so your phone can connect to the dev server even when it's not on the same local network.

## How to use the app

- Open the app and go to the Capture screen.
- Tap `Camera` to take a photo, or `Gallery` to pick one.
- While offline the photo is saved to the local DB and marked `Pending`.
- When the device is online the app uploads queued photos and marks them `Synced` with a server id.
- Pull-to-refresh retries pending items; a manual `Retry` button is available per item.

## Configuration & notes

- Mock backend: the project includes a mock upload mode in `src/utils/api.ts` (use `USE_MOCK = true`) so you can test without a real backend.
- To use a real backend: set `USE_MOCK = false` and update `API_BASE` in `src/utils/api.ts`.
- Background fetch is throttled on mobile OSes — use EAS + custom dev client for more reliable background behavior.
- Large images are stored as base64 in SQLite by default; consider storing files on disk and only keeping paths in the DB for production.

## Next steps / ideas

- Persist images on disk and save only paths in SQLite to reduce DB size
- Implement real server endpoint with deduplication and verification
- Add authentication and secure uploads (signed requests)
- Add a settings screen for compression quality/behavior

## License & contribution

- This example is provided as-is for learning and prototyping. Feel free to reuse the code — add attribution if you like.

If you'd like, I can also add a short troubleshooting section or a small debug screen to export the SQLite contents.
