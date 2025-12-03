# **D&D One-Shot Generator**

A full-stack Dungeons & Dragons adventure generator powered by:

- **React + TypeScript + Vite** (frontend)  
- **Node.js + Express + TypeScript** (backend)  
- **Supabase** (Google OAuth + Postgres + Row-Level Security)  
- **D&D 5e API + Open5e API** (monster + magic item data)  
- Deploying as a single service on **Railway** where Express serves the built React app 

---

## ✨ **Features**

### 🧙‍♂️ **One-Shot Generation**

Generates randomized D&D adventures based on:

- **Party size**
- **Average level**
- **Environment** (forest, dungeon, mountain, city, swamp)

Data sources:

- **Monsters** pulled from the **D&D 5e API** [https://www.dnd5eapi.co/]
- **Magic items** pulled from **Open5e** [https://open5e.com/]

---

### 🔐 **User Authentication**

- **Google Sign-In** powered by Supabase OAuth
- The browser stores a **JWT session**
- Backend verifies every request using Supabase Admin API
- **Row-Level Security (RLS)** ensures users can
  - Access **only their own** one-shots  
  - Modify **only their own** records  
  - Delete **only their own** content  
