# Full-Stack Real-Time Communication Application

A full-stack web application built with **React, Node.js, Express, MongoDB, and Socket.IO**. The project combines authenticated access, real-time messaging, media handling, cloud-hosted assets, music playback, and centralized client-side state management.

## Overview

The application follows a client-server architecture:

```text
Browser / React
      │
      ├── REST API ───────► Express / Node.js ───► MongoDB
      │                              │
      │                              └────────────► Cloud Media
      │
      └── WebSocket ──────► Socket.IO ───────────► Real-time clients
```

The frontend handles the interface and client state, while the backend handles authentication, API operations, database access, media configuration, and real-time events.

---

## Tech Stack

### Frontend
- React + Vite
- React Router
- Zustand
- Axios
- Socket.IO Client
- Tailwind CSS / DaisyUI
- Lucide React
- React Hot Toast

### Backend
- Node.js
- Express
- MongoDB / Mongoose
- Socket.IO
- JWT
- bcryptjs
- dotenv
- Express Rate Limit
- Cookie Parser

### External Services
- Cloudinary for media storage
- MongoDB hosting/database service

---

## Core Features

- JWT-based authentication
- HTTP-only authentication cookies
- Protected frontend and backend routes
- Real-time messaging with Socket.IO
- Message sending and deletion
- Reply-to-message support
- Cursor-based message loading
- Online-user status
- Dynamic profile/media data
- Cloud-hosted images
- Gallery/media page
- Dedicated music page
- Global music player
- Persistent current-song state
- Settings page
- Centralized Zustand stores
- Responsive UI

---

# Application Workflow

## 1. Startup and Authentication

When the application starts, it first checks whether an existing authenticated session is valid.

```text
Application starts
      │
      ▼
Check authentication
      │
      ▼
Backend verifies JWT
      │
      ├── Valid ─────► Load user data
      │
      └── Invalid ───► Authentication screen
```

The application waits for this check before rendering protected application features.

Authentication state is maintained in the frontend store.

---

## 2. Login

The login flow is handled entirely through the backend.

```text
Login form
    │
    ▼
POST authentication request
    │
    ▼
Validate credentials
    │
    ▼
Compare password with bcrypt hash
    │
    ▼
Generate JWT
    │
    ▼
Store JWT in HTTP-only cookie
    │
    ▼
Return authenticated user information
```

Credentials and other sensitive configuration are stored through environment variables rather than frontend source code.

Passwords are stored as bcrypt hashes and are never required to be stored as plaintext.

---

## 3. Session Persistence

On refresh, the frontend calls the authentication-check endpoint.

```text
React
  │
  ▼
Authentication check
  │
  ▼
JWT from cookie
  │
  ▼
JWT verification
  │
  ▼
User information
  │
  ▼
Zustand authentication store
```

This allows the application to restore the authenticated state after a page reload.

---

# Real-Time Messaging

Socket.IO is used for real-time communication.

The application does not need to continuously poll the server for new messages. Once authenticated, the client establishes a socket connection and listens for relevant events.

```text
Client A
   │
   │ message
   ▼
Backend
   │
   ▼
Socket.IO
   ├──────────► Client A
   └──────────► Client B
```

Typical real-time events include:

```text
join
newMessage
deleteMessage
messageDelivered
messageStatus
onlineUsers
```

Socket listeners are cleaned up when they are no longer required to avoid duplicate handlers.

---

# Messaging API

Persistent message operations use the REST API.

Typical operations include:

```text
GET    /messages
POST   /messages/send
DELETE /messages/:id
```

The exact API prefix and deployment URL are environment-dependent.

### Sending

The frontend sends the message to the backend. After processing, the corresponding real-time event is delivered through Socket.IO.

### Receiving

A `newMessage` event updates the local message state without requiring a page reload.

### Deleting

A delete request updates the database, after which connected clients receive a deletion event and remove the message locally.

---

# Message Loading

The chat uses pagination/cursor-based loading rather than loading the entire message history at once.

```text
Initial request
      │
      ▼
Recent messages
      │
      ▼
Request older messages
      │
      ▼
Cursor-based request
      │
      ▼
Older messages
```

This keeps the initial payload smaller and helps long conversations remain manageable.

---

# State Management

Zustand provides global client-side state.

### Authentication Store

Responsible for:

- Authentication state
- Current user
- Login
- Logout
- Session checking
- Socket initialization related to authentication

### Chat Store

Responsible for:

- Loaded messages
- Message loading state
- Sending messages
- Deleting messages
- Reply state
- Real-time message events
- Online-user information

Keeping these concerns in stores prevents individual UI components from becoming responsible for the entire application state.

---

# Profile and Media System

User-specific media is configured on the backend and returned to the frontend when required.

The frontend consumes the returned media information instead of maintaining environment-specific mappings inside UI components.

General flow:

```text
Authenticated request
       │
       ▼
Backend determines media
       │
       ▼
Media URL returned
       │
       ▼
React component
       │
       ▼
Image / media element
```

Cloudinary is used for cloud-hosted media so large assets do not need to be stored directly inside the application source.

---

# Gallery

The gallery displays stored media retrieved through the configured media service.

Media-heavy pages should avoid loading unnecessary assets before they are needed. Image dimensions and file sizes should also be optimized for mobile devices.

---

# Music System

The application contains both a dedicated music page and a global music player.

The global player is mounted at the application level:

```text
App
 ├── Navbar
 ├── Routes
 │    ├── Home
 │    ├── Gallery
 │    ├── Music
 │    └── Settings
 │
 └── GlobalMusicPlayer
```

Because the player exists outside individual routes, navigating between pages does not require recreating the player.

The current song can be persisted in browser local storage so the selection can be restored after a reload.

---

# Navigation and Routing

React Router handles page navigation.

Protected pages use a route-protection component:

```text
Route
 │
 ▼
Authenticated?
 ├── Yes ──► Render page
 └── No ───► Redirect to login
```

Backend authentication remains the actual security boundary; frontend route protection only controls the user interface.

---

# Backend Architecture

The backend follows a controller/route/middleware structure.

```text
backend/
└── src/
    ├── controllers/
    ├── routes/
    ├── middleware/
    ├── config/
    ├── models/
    ├── lib/
    └── server.js
```

### Routes
Define API endpoints.

### Controllers
Contain application logic for requests.

### Middleware
Handles authentication, request processing, and other cross-cutting concerns.

### Models
Define database structures where persistent models are required.

### Config
Contains server-side configuration that should not be exposed to the frontend.

### Lib
Contains shared backend utilities.

---

# Frontend Architecture

```text
frontend/
└── src/
    ├── components/
    ├── pages/
    ├── store/
    ├── lib/
    └── App.jsx
```

### Components
Reusable interface elements.

### Pages
Complete application views.

### Store
Global application state using Zustand.

### Lib
Shared utilities such as Axios and Socket.IO configuration.

---

# Environment Configuration

Sensitive or environment-specific values are kept outside the frontend source code.

Typical configuration categories include:

```text
Server configuration
Database connection
JWT secret
Credential hashes
Cloud storage configuration
Application environment
```

A local `.env` file should not be committed to Git.

Recommended `.gitignore` entries include:

```text
.env
node_modules/
dist/
build/
```

Never expose server-side secrets such as database credentials, JWT secrets, cloud-service private keys, or password hashes to the frontend.

---

# Security

The application uses several security measures:

- Password hashing with bcrypt
- JWT authentication
- HTTP-only cookies
- Protected backend routes
- Protected frontend routes
- Environment-based secrets
- Authentication rate limiting
- Server-side credential verification
- Separation of frontend and backend secrets

Authentication should always be validated by the backend rather than relying only on frontend state.

---

# Performance

The application is designed to minimize unnecessary work during normal usage.

Important approaches include:

- Cursor-based message loading
- WebSocket events instead of constant message polling
- Centralized state management
- Socket listener cleanup
- Cloud-hosted media
- Lazy loading for heavy pages where appropriate
- Avoiding unnecessary high-frequency React state updates
- Keeping large media files out of application state

For long-running sessions, browser DevTools can help identify performance issues.

Useful panels:

```text
Network      → repeated requests and payload sizes
Performance  → long tasks and expensive rendering
Memory       → possible memory leaks
Console      → runtime and React errors
```

---

# Development Setup

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend and backend addresses should be configured according to the local or deployment environment.

---

# Production Architecture

The application can be deployed with the frontend and backend as separate services.

```text
                    Internet
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        Frontend              Backend
                                │
                       ┌────────┼────────┐
                       │        │        │
                       ▼        ▼        ▼
                    MongoDB  Cloud    Socket.IO
                             Media
```

The frontend communicates with the backend through HTTP requests and WebSocket connections.

---

# Design Principles

The project follows a few core principles:

1. Keep secrets on the backend.
2. Keep environment-specific values out of UI components.
3. Separate frontend and backend responsibilities.
4. Use REST APIs for persistent operations.
5. Use WebSockets for real-time events.
6. Use pagination for potentially large datasets.
7. Keep media in dedicated cloud storage.
8. Clean up listeners and subscriptions.
9. Load heavy resources only when required.
10. Keep global state centralized and predictable.

---

# License

This project is intended for private/personal use unless a separate license is provided.
