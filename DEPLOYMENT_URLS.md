# DuoBuddy / TRAE Platform - Deployment URLs

## 🌐 Emergeent Deployment URLs

### Production URLs (Accessible Externally)
- **Frontend**: https://profile-viewer-34.preview.emergentagent.com
- **Backend API**: https://profile-viewer-34.preview.emergentagent.com/api

### Internal Service Ports
- **Frontend Server**: Port 3000 (Node.js)
- **Backend Proxy**: Port 8001 (FastAPI/Python)
- **Ruby API Server**: Port 5050 (WEBrick)

## 🏗️ Architecture

```
External Request → Kubernetes Ingress
    ↓
    ├─→ Frontend (Port 3000) → Serves index.html
    │
    └─→ /api/* requests (Port 8001) → Python Proxy → Ruby Backend (Port 5050)
```

## 🔑 Configuration Changes Made

### 1. Frontend (index.html)
- ✅ Updated `API_BASE` to use empty string for Emergent environment
- ✅ Uses relative paths (`/api/*`) which are routed by Kubernetes
- ✅ Updated Content Security Policy to allow `*.emergentagent.com`

### 2. Backend Proxy (NEW - /app/backend/server.py)
- ✅ Created FastAPI proxy on port 8001
- ✅ Forwards all `/api/*` requests to Ruby server on port 5050
- ✅ Handles CORS and session cookies
- ✅ Compatible with Kubernetes ingress routing

### 3. Ruby API Server (api_server.rb)
- ✅ Added Emergent deployment URL to ALLOWED_ORIGINS
- ✅ Still runs on port 5050 (internal)

### 4. Frontend Server (NEW - /app/frontend/server.js)
- ✅ Simple Node.js server serving index.html
- ✅ SPA routing support (serves index.html for all routes)
- ✅ Runs on port 3000

## 🚀 Services Status

All services managed by supervisor:

```bash
sudo supervisorctl status
```

- **backend** (Port 8001) - FastAPI Proxy ✅
- **frontend** (Port 3000) - Node.js Server ✅
- **Ruby API** (Port 5050) - Background process ✅
- **mongodb** - Database ✅

## 🔧 Service Management

### Restart All Services
```bash
sudo supervisorctl restart all
```

### Restart Individual Services
```bash
sudo supervisorctl restart frontend
sudo supervisorctl restart backend
```

### Restart Ruby API (manual)
```bash
pkill -f "ruby api_server.rb"
cd /app/DuoBuddy && /usr/bin/ruby api_server.rb > /var/log/ruby_api.log 2>&1 &
```

## 🧪 Testing

### Test Frontend
```bash
curl http://localhost:3000/
```

### Test Backend Proxy
```bash
curl http://localhost:8001/health
```

### Test API Through Proxy
```bash
curl http://localhost:8001/api/admin/companies
# Should return: {"error":"unauthorized"} (expected without session)
```

### Test Ruby API Directly
```bash
curl http://localhost:5050/api/admin/companies
```

## 📍 Access Information

### Admin Login
- URL: https://profile-viewer-34.preview.emergentagent.com
- Email: admin@duobuddy.my
- Password: Admin@123!

### Features to Test
1. Company Management (no blank pages)
2. Company Branding (logo, color, domain)
3. Company Status Toggle (Active/Suspended)
4. View User Profile (dedicated page)
5. All API calls should work through `/api` prefix

## ✅ Deployment Checklist

- [x] Frontend serves on port 3000
- [x] Backend proxy on port 8001
- [x] Ruby API on port 5050
- [x] API calls use relative paths
- [x] CORS configured for Emergent domain
- [x] Content Security Policy updated
- [x] All services running via supervisor
- [x] SPA routing works
- [x] Health check endpoint active

## 🔍 Troubleshooting

### If frontend not loading:
```bash
sudo supervisorctl restart frontend
curl http://localhost:3000/
```

### If API calls failing:
```bash
sudo supervisorctl restart backend
curl http://localhost:8001/health
```

### If Ruby backend not responding:
```bash
ps aux | grep ruby
# If not running:
cd /app/DuoBuddy && /usr/bin/ruby api_server.rb > /var/log/ruby_api.log 2>&1 &
```

### Check logs:
```bash
tail -f /var/log/supervisor/frontend.err.log
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/ruby_api.log
```
