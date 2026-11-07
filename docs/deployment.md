# FinSightAI Deployment Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- Firebase project with Firestore enabled
- Gemini API key (or OpenRouter as fallback)

## Local Development

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Add serviceAccountKey.json from Firebase Console > Project Settings > Service Accounts
# Update .env with your API keys
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Production Deployment

### Backend (Gunicorn)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()
```

### Frontend (Vite Build)
```bash
cd frontend
npm run build
# Serve dist/ folder with nginx or similar
```

### Docker Support
```dockerfile
# Build and run with Docker
docker build -t finsight-ai .
docker run -p 5000:5000 finsight-ai
```

## Environment Variables
```
SECRET_KEY=
JWT_SECRET_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
FIREBASE_CREDENTIALS_PATH=serviceAccountKey.json
UPLOAD_FOLDER=uploads
```

## Nginx Config (Frontend Proxy)
```nginx
server {
    listen 80;
    server_name finsight-ai.local;

    location / {
        proxy_pass http://localhost:3000;
    }

    location /api {
        proxy_pass http://localhost:5000;
    }
}
```
