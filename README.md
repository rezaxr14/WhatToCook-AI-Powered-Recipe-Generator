# 🍳 WhatToCook — AI-Powered Intelligent Recipe Studio & Smart Pantry

> **Zero Food Waste AI Recipe Engine**, visual camera ingredient scanner powered by **Generative AI**, real-time culinary generation streaming, interactive Telegram bot assistant, smart grocery lists with 1-click WhatsApp & Telegram exports, dynamic portion scaling, and an offline Progressive Web App (PWA).

[![Django 5.2](https://img.shields.io/badge/Django-5.2-092E20?style=for-the-badge&logo=django&logoColor=white)](https://djangoproject.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Docker Alpine](https://img.shields.io/badge/Docker-Alpine_Lean-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

---

## 🌟 Architecture & Key Features

```
WhatToCook Ecosystem
├── 🌐 React 18 + TypeScript + TailwindCSS + TanStack Query Frontend (Vite)
├── ⚡ Django 5.2 REST Framework API Backend (Python 3.11)
├── 🤖 Multimodal AI Vision & Generative Recipe Streaming Engine
├── 💬 Telegram Bot Webhook & Interactive Pantry Handshake
├── 📱 Smart Grocery Exporter (WhatsApp, Telegram, Markdown, Print)
├── 🗄️ PostgreSQL 15 (Docker) / SQLite3 (Auto-fallback local dev)
└── 🚀 Redis 7 + Celery Task Queue
```

### ✨ Core Features
1. **📸 AI Vision Pantry Scanner**: Snap a photo of your fridge or countertop; AI detects recognized food items and automatically stocks your digital pantry shelf.
2. **🧠 Smart Zero-Waste Recipe Matching**: Instantly computes 100% matched recipes you can cook right now with no extra groceries needed, plus partial matches (missing only 1 or 2 items).
3. **⚡ Live SSE Generative Streaming**: Watch recipes, macro breakdowns, and master chef secrets stream in real-time.
4. **🤖 Telegram AI Chef Bot**: Link your Telegram account with 1-click. Send `/cook`, `/pantry`, `/add Garlic`, or `/remove Butter` from your phone on the go.
5. **🛒 Smart Grocery List & 1-Click Social Exporter**: Add missing ingredients from any recipe or partial match with 1 click. Export formatted grocery lists to **WhatsApp**, **Telegram**, Clipboard, or Print slip.
6. **⚖️ Dynamic Portion Scaler (1x, 2x, 4x, 6x, 8x)**: Scalable ingredient measurements (e.g. `2 tbsp`, `250g`, `1/2 cup`) dynamically recalibrate portions in real-time without boundary overflows.
7. **💡 AI Substitution Assistant**: Missing buttermilk, eggs, heavy cream, or parmesan? Instant culinary swaps and ratio tips.
8. **📱 Progressive Web App (PWA)**: Installable on iOS & Android with offline pantry viewing.

---

## ⚡ Superfast Quickstart with Docker (Recommended)

Run the complete multi-service stack with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/rezaxr14/WhatToCook-AI-Powered-Recipe-Generator.git
cd WhatToCook-AI-Powered-Recipe-Generator

# 2. Configure environment variables
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY (from https://aistudio.google.com)

# 3. Build and launch all lightweight containers
docker compose up -d --build

# 4. Seed the rich recipe database (13+ gourmet dishes with HD images)
docker compose exec web python manage.py seed_recipes
```

### 🌐 Access Points:
- **Frontend Web App**: [http://localhost:5173](http://localhost:5173)
- **Django REST API**: [http://localhost:8000/api/](http://localhost:8000/api/)
- **Django Admin Panel**: [http://localhost:8000/admin/](http://localhost:8000/admin/)

---

## 💻 Local Development Setup (Without Docker)

### 1. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed recipes
python manage.py migrate
python manage.py seed_recipes

# Start backend server
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend Setup
```bash
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

---

## 🧪 Testing Suite

Run the comprehensive Django REST API test suite:

```bash
python manage.py test GetFood
```

Target: **100% passing tests (19/19)** covering:
- Authentication & Auto-Pantry Creation
- Pantry Ingredient Operations & Optimistic Handshakes
- Zero-Waste Match Engine Algorithms (100% & Partial matches)
- Multimodal Vision Scanner & Fallback Resiliency
- Live AI Recipe Generation & Streaming Endpoints
