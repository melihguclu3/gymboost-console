# GymBoost Developer Console - Project Context & Memories

### Design System (Modern Command Center)
- **Aesthetic:** Vercel/Linear inspired minimalism. "Military Grade" surgical precision.
- **Theme:** Pure black (#000) background, high-contrast typography (Inter/Monospace).
- **Materials:** Deep glassmorphism (blur: 20px, border: `white/4%`), Bento Grid 2.0.
- **Accents:** Neon `orange-500` for system-critical actions, `blue-500` for telemetry, `emerald-500` for link status.
- **Typography:** Sans-serif (Montserrat/Inter) for headings, Monospace for all IDs, timestamps, and log data.

### Core Features
- **Universal Logger:** Global telemetry stream with multi-node filtering and category tabs. High-density monospaced UI.
- **Kernel Configuration:** Low-level node management via "Military Grade" configuration modals and threshold controls.
- **Command Palette (CMD+K):** Global surgical navigation and command execution interface.
- **Live Kernel Stream:** Real-time system event visualization on the dashboard.
- **Dynamic HUD:** Real-time ticking system clock, latency tracking, and node stability monitoring.

### Technical Stack
- **Framework:** Next.js 16 (App Router)
- **Middleware:** `proxy.ts` implementation for network boundary control.
- **Security:** Next.js Server Actions for all sensitive validation.
- **UI/UX:** Framer Motion (animations), Sonner (notifications), Lucide React (icons).
- **Styling:** Tailwind CSS v4.
