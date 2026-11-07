# FinSightAI - Setup & Run Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- Firebase project with Firestore enabled

## Firebase Setup (Required)

1. Go to https://console.firebase.google.com
2. Select/create a project
3. Go to **Project Settings > Service Accounts**
4. Click **"Generate New Private Key"**
5. Save the JSON file as `backend/serviceAccountKey.json`

## Quick Start

### Step 1: Configure Environment
Copy `backend/.env` and add your API keys:
- `GEMINI_API_KEY` - Your Google Gemini API key
- `OPENROUTER_API_KEY` - Your OpenRouter API key (fallback)

### Step 2: Install Backend
```powershell
cd backend
pip install -r requirements.txt
```

### Step 3: Install Frontend
```powershell
cd frontend
npm install
```

### Step 4: Start Backend
```powershell
cd backend
python run.py
```
Runs on http://localhost:5000

### Step 5: Start Frontend
```powershell
cd frontend
npm run dev
```
Runs on http://localhost:3000

## Or Use Auto-Start
```powershell
.\start.bat
```

## Project Structure
```
backend/
├── app.py              # Flask app factory
├── config.py           # Configuration
├── run.py              # Entry point
├── requirements.txt
├── .env
└── app/
    ├── routes/         # API route handlers
    ├── services/       # Firestore & auth services
    ├── analytics/      # Analytics engine, forecasting, anomaly detection
    ├── ai/             # Gemini & OpenRouter providers, service manager
    └── utils/          # Helper functions

frontend/
├── src/
│   ├── App.jsx         # Main app with routing
│   ├── api.js          # Axios instance
│   ├── context/        # Auth context
│   ├── components/     # Layout, sidebar, header
│   └── pages/          # All page components
└── index.html

docs/                   # API, database, deployment, testing docs
```

## API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | No | Register user |
| POST | /api/auth/login | No | Login |
| GET | /api/auth/profile | Yes | User profile |
| GET/POST | /api/transactions | Yes | Manage transactions |
| GET/POST | /api/budgets | Yes | Manage budgets |
| GET/POST | /api/goals | Yes | Manage goals |
| GET | /api/analytics/dashboard | Yes | Dashboard data |
| GET | /api/analytics/spending | Yes | Spending analysis |
| GET | /api/analytics/forecast | Yes | ML forecast |
| GET | /api/analytics/anomalies | Yes | Anomaly detection |
| POST | /api/chat | Yes | AI chatbot |
| POST | /api/receipts/upload | Yes | Receipt scanner |
| POST | /api/reports/generate | Yes | AI reports |

## Troubleshooting

Firebase:
- Ensure `backend/serviceAccountKey.json` exists with valid credentials
- Enable Firestore in Firebase Console
- Enable billing for Firestore (required)

Port conflicts:
- Frontend runs on port 3000 (change in vite.config.js)
- Backend runs on port 5000 (change in run.py)
