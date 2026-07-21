# AURA — Your AI Career Guide

Custom neon/glassmorphism web frontend for the AURA career-guidance chatbot
(**A**I-powered **U**ndergraduate/Universal **R**ecommendation **A**ssistant).
The bot's brain lives on Botpress Cloud; this app is the UI that wraps it.

## Run it

```bash
npm install
npm run dev      # → http://localhost:5173
```

## Custom logo & avatar

Drop your image files into `public/` with these exact names:

- `public/aura-logo.png` (or `.svg` / `.jpg`) — top-left header logo
- `public/aura-avatar.png` (or `.svg` / `.jpg`) — chat avatar (panel header
  **and** the bot's avatar inside the webchat via `configuration.botAvatar`)

They're picked up automatically (PNG tried first, then SVG, then JPG). Until
the files exist, the app falls back to the generated gradient orb. Square
images ≥128×128 look best; they're displayed in a circle.

## Stack

- React 19 + Vite
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Framer Motion (landing → chat transition, orb, staggered reveals)
- Botpress Webchat v3.6 via the published embed snippet (see `index.html`)

## How the Botpress integration works

The two official script tags in [index.html](index.html) load `inject.js`
(v3.6) and the published bot config (botId + clientId). After the webchat
fires `webchat:initialized`, [src/hooks/useBotpress.js](src/hooks/useBotpress.js)
calls the documented `window.botpress.config()` API to:

- mount the chat **embedded** inside our own container via
  `configuration.embeddedChatId: "aura-webchat"` (no floating corner bubble —
  `.bpFab` is also hidden in CSS as a belt-and-suspenders measure),
- apply the dark/neon theme (`themeMode`, `color`, `variant`, `fontFamily`,
  `radius`, `composerPlaceholder`),
- inject `additionalStylesheet` CSS into the webchat's shadow DOM so the inner
  chrome (composer, avatars) matches the brand and the built-in header is
  hidden (our glass panel header replaces it, including a restart button that
  calls `window.botpress.restartConversation()`).

Then `window.botpress.open()` reveals the chat. All method names were verified
against the official docs (botpress.com/docs/webchat) and the actual v3.6
`inject.js` bundle.

## Layout

- **Landing**: split-screen — animated AURA orb, headline, full-form subtext,
  and feature chips on the left; the chat panel with a frosted teaser overlay
  and “Start chatting” on the right. A “What AURA can do” card row sits below.
- **Chat**: clicking “Start chatting” fades the teaser out and the panel
  expands to focus (Framer Motion layout animation). “← Back to intro”
  restores the landing without losing the conversation.
