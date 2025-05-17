![4](https://github.com/user-attachments/assets/48638d79-fd2e-45d6-9c04-9f1cee56a309)

# ividiyo modal - visitor video modal
The video call modal that can be embedded on any site

---

This is the **Visitor Modal** component of the **P2P Video Modal** system — an embeddable video call widget that allows website visitors to instantly start a live video conversation with a sales agent.

It’s lightweight, written in **Vanilla JavaScript** and built with **Vite**, using **WebRTC** for peer-to-peer video and **Momento** for real-time signaling and session management.

> 🌱 Made for a spring-themed hackathon — because small businesses grow faster when they connect with people in real time.

---

## 🧩 Use Case

This component is designed to be embedded on any business website. When a visitor clicks the call button, the modal initiates a live P2P video connection with an available agent. Perfect for early-stage startups and small businesses looking to improve lead conversion with a personal touch.

---

## 🚀 Tech Stack

- ⚡️ Vite (Vanilla JS)
- 📡 WebRTC (P2P video)
- 💬 Momento Topics (signaling)
- 🧠 Momento Cache (session tracking)
- 🎨 HTML/CSS

---

## 📁 Project Structure

```bash
modal/
├── index.html             # Demo page
├── modal.js               # Core modal logic
├── signaling.js           # WebRTC + Momento Topics
├── cache.js               # Session registration in Momento Cache
├── styles.css             # Modal styling
├── vite.config.js         # Vite config
└── .env                   # Momento credentials
