<div align="center">

# 🌾 KisanMitra AI (किसानमित्र)
### *Next-Generation AI Decision-Support & Market Intelligence Platform for Indian Farmers*

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20(Neon)-00e599.svg)](https://neon.tech/)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini%202.0%20Flash-orange.svg)](https://aistudio.google.com/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel%20%7C%20Render-black.svg)](https://vercel.com/)

[Live Demo](https://kisanmitra-frontend.vercel.app) • [API Documentation](#-api-overview) • [Deployment Guide](DEPLOYMENT.md) • [Report Bug](https://github.com/nikhil007-git/KisanMitra-Frontend/issues)

</div>

---

## 📖 Overview

**KisanMitra AI** is a comprehensive, production-grade agricultural decision-support platform designed to bridge the information gap for Indian farmers. By combining **real-time APMC mandi prices**, **predictive market analytics**, and **Google Gemini 2.0 Flash AI**, KisanMitra helps farmers answer the single most critical economic question: 

> *"Should I sell my harvest today, wait for better rates, or take it to a higher-paying mandi nearby?"*

---

## ✨ Key Features

### 📊 1. Real-Time Mandi Market Intelligence
- **National Live Ticker**: Instant price changes and modal rates across APMC mandis nationwide.
- **MSP Comparison**: Direct benchmarks against Government Minimum Support Price (MSP).
- **Historical Trends**: 7, 15, and 30-day interactive price and arrival volume curves.
- **State & Commodity Filters**: Quick-filtering across 19+ major crops (Wheat, Paddy, Mustard, Cotton, Maize, Gram, Soybean, etc.).

### 🤖 2. AI Decision Engine (Powered by Google Gemini 2.0 Flash)
- **Sell Now / Wait / Monitor Recommendations**: AI analyzes 14-day price velocity, arrival pressures, storage costs, and seasonal demand cycles.
- **30 & 60-Day Price Forecasts**: Algorithmic forecasting with statistical confidence scoring.
- **Risk Breakdown**: Automated risk scoring (weather risk, price volatility, arrival shocks).

### 🏪 3. Smart Multi-Mandi Comparison
- **Distance & Logistics Calculator**: Computes transport freight rates (₹/km) based on vehicle selection (Tractor-trolley, Mini Truck, Large Truck).
- **Net Return Realization**: Calculates *Gross Revenue − (Mandi Cess + Freight + Bagging + Labour)* to pinpoint which mandi yields maximum take-home profit.

### 🌦️ 4. Hyper-Local Weather & Risk Advisory
- **7-Day Agricultural Forecast**: Powered by OpenWeatherMap API with temperature, rain probability, humidity, and wind speed.
- **Crop Vulnerability Alerts**: Early warning indicators for unseasonal rain, frost, or heatwave during harvesting/sowing windows.

### 💰 5. Farm Profit & Cost Calculator
- Input crop yield, acreage, and estimated modal rate to generate complete cost breakdowns and net profit margins.
- Multi-quantity volume comparison table (25 Qtl, 50 Qtl, 100 Qtl, 200 Qtl).

### 🗣️ 6. Multilingual Agricultural AI Assistant
- Conversational chat assistant trained on Indian agricultural agronomy, government schemes (PM-KISAN, PMFBY), crop pest control, and mandi operations.
- Multilingual interface supporting **English**, **Hindi (हिन्दी)**, **Punjabi (ਪੰਜਾਬੀ)**, and **Marathi (मराठी)**.

### 🔐 7. Dual Authentication
- Seamless Phone/PIN profile authentication for rural accessibility.
- Enterprise-grade social single sign-on (SSO) with **Clerk Auth** (Google Login).

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS, Lucide React Icons |
| **Backend** | Node.js, Express 4, RESTful Architecture |
| **Database & ORM** | PostgreSQL (Neon Serverless), Prisma ORM |
| **AI / LLM** | Google Gemini 2.0 Flash (`@google/generative-ai`) |
| **Authentication** | Clerk Authentication & JWT Token Sessions |
| **Weather Data** | OpenWeatherMap API |
| **Deployment** | Vercel (Frontend & Serverless Functions), Render Blueprint, Docker |

---

## 📂 Project Structure

```text
KisanMitra/
├── api/                       # Vercel Serverless Function entry point
│   └── index.js
├── backend/                   # Express REST API Server
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema (User, Crop, Mandi, Price, Decision)
│   │   └── seed.js            # Initial database seed script
│   ├── src/
│   │   ├── config/            # Gemini, Prisma, & server environment configs
│   │   ├── controllers/       # Route request handlers
│   │   ├── middleware/        # JWT auth, error handling, rate limiting
│   │   ├── routes/            # REST API endpoints (/api/crops, /api/market, etc.)
│   │   └── services/          # Gemini AI decision & mandi live services
│   ├── .env.example
│   ├── index.js               # Express application entry
│   └── package.json
├── frontend/                  # React + Vite Single Page Application
│   ├── public/                # Static icons and manifest
│   ├── src/
│   │   ├── assets/            # App illustrations and logos
│   │   ├── components/        # View modules (Dashboard, Mandi, Predict, Calculator)
│   │   ├── data/              # Fallback offline datasets
│   │   ├── translations/      # Hindi, Punjabi, Marathi, English i18n
│   │   ├── api.js             # Client API service with offline fallback
│   │   ├── KisanMitraApp.jsx  # Main application core
│   │   └── index.css          # Tailwind CSS styles & utility rules
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── DEPLOYMENT.md              # Detailed step-by-step production deployment guide
├── Dockerfile                 # Multi-stage production container build
├── docker-compose.yml         # Container orchestration with PostgreSQL
├── package.json               # Root monorepo build scripts
├── render.yaml                # Render 1-click blueprint config
└── vercel.json                # Vercel SPA and serverless routing config
```

---

## 🚀 Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/nikhil007-git/KisanMitra-Frontend.git
cd KisanMitra-Frontend
```

### 2. Configure Environment Variables
Copy the example environment files:
```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your credentials:
```env
PORT=5000
DATABASE_URL="postgresql://user:password@hostname:5432/kisanmitra?sslmode=require"
JWT_SECRET="your_secure_random_jwt_secret"
GEMINI_API_KEY="your_google_gemini_api_key"
GEMINI_MODEL="gemini-2.0-flash"
OPENWEATHER_API_KEY="your_openweather_api_key"
```

### 3. Install Dependencies & Generate Prisma Client
```bash
# Install root, backend, and frontend dependencies
npm run build
```

### 4. Run Locally
In separate terminals:

```bash
# Start Backend API (Port 5000)
npm run dev:backend

# Start Frontend Dev Server (Port 5173)
npm run dev:frontend
```

Open **`http://localhost:5173`** in your browser.

---

## 🌐 Production Deployment

For complete instructions, refer to **[`DEPLOYMENT.md`](DEPLOYMENT.md)**.

### Option A: Deploy to Vercel (Recommended — 100% Free)
1. Push this repository to GitHub.
2. Go to [Vercel.com](https://vercel.com) → **Add New Project** → Import your repository.
3. Settings:
   - **Framework**: `Vite`
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `frontend/dist`
4. Add Environment Variables:
   - `DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
5. Click **Deploy**. Both the React frontend and serverless Express API will be live on a single domain with HTTPS!

### Option B: Deploy with Docker
```bash
cp .env.example .env
docker compose up -d --build
```
Your full-stack application will be live at `http://localhost:5000`.

---

## 🔒 Security & Privacy

- All sensitive keys (`GEMINI_API_KEY`, database credentials, JWT secrets) are guarded by `.gitignore` and never committed.
- Passwords hashed with `bcryptjs`.
- HTTP security headers provided by `helmet` with CORS protection and API rate-limiting via `express-rate-limit`.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with ❤️ for Indian Farmers. Dedicated to empowering agriculture through AI.</sub>
</div>
