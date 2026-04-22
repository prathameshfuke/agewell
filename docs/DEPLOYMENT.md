# Deployment Guide

This guide covers deploying AgeWell to production environments.

## Overview

AgeWell consists of:
1. **Frontend** - React SPA (can be deployed to Vercel, Netlify, or any static host)
2. **Backend** - Flask API (requires Python runtime)
3. **Database** - Supabase (managed PostgreSQL)

## Prerequisites

- Supabase project with database schema
- Tesseract OCR 5.5.0+ installed on server
- Python 3.10+ (for backend)
- Node.js 18+ (for frontend build)

---

## Supabase Setup

### 1. Create Project
1. Go to [Supabase](https://supabase.com) and create a project
2. Note the Project URL and anon key
3. Save these for later

### 2. Apply Database Schema
Run the SQL migrations in order:

```bash
# Connect to Supabase SQL Editor and run:
cat supabase/schema.sql | pbcopy  # Copy to clipboard
# Paste and run in SQL Editor
```

Or use Supabase CLI:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 3. Configure Auth
1. Go to Authentication → Providers
2. Enable Google OAuth
3. Add your Google OAuth credentials
4. Set Site URL and Redirect URLs

### 4. Configure CORS
1. Go to API Settings
2. Add your frontend domain to CORS origins

---

## Backend Deployment

### Option 1: Deploy to Railway/Render/Fly.io

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Deploy
railway up
```

**Render:**
1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: agewell-backend
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: agewell-db
          property: connectionString
```

2. Push to GitHub and connect Render

### Option 2: VPS/Dedicated Server

**1. Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3 python3-pip python3-venv tesseract-ocr -y

# Install Tesseract language data
sudo apt install tesseract-ocr-eng

# Create app directory
mkdir -p /opt/agewell
cd /opt/agewell
```

**2. Application Setup**
```bash
# Clone repository
git clone https://github.com/yourusername/agewell.git .

# Setup Python environment
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env file
cat > .env <<EOF
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
SECRET_KEY=$(openssl rand -hex 32)
FLASK_DEBUG=0
EOF
```

**3. Systemd Service**
Create `/etc/systemd/system/agewell.service`:
```ini
[Unit]
Description=AgeWell Flask API
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/agewell/backend
Environment=PATH=/opt/agewell/backend/venv/bin
EnvironmentFile=/opt/agewell/backend/.env
ExecStart=/opt/agewell/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5001 app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl daemon-reload
sudo systemctl enable agewell
sudo systemctl start agewell
```

**4. Nginx Configuration**
Create `/etc/nginx/sites-available/agewell`:
```nginx
server {
    listen 80;
    server_name api.agewell.example.com;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/agewell /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 3: Docker

**Dockerfile:**
```dockerfile
FROM python:3.11-slim

# Install Tesseract
RUN apt-get update && apt-get install -y tesseract-ocr tesseract-ocr-eng

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "app:app"]
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/agewell
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
    volumes:
      - uploads:/app/uploads

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=agewell
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
  uploads:
```

---

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. Push code to GitHub
2. Import project on Vercel
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### Option 2: Netlify

1. Connect GitHub repo to Netlify
2. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add environment variables
4. Deploy

### Option 3: Static Hosting

**Build:**
```bash
cd frontend
npm install
npm run build
```

**Upload `dist/` folder to:**
- AWS S3 + CloudFront
- Google Cloud Storage
- Any web server

---

## SSL/HTTPS

### Let's Encrypt (Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.agewell.example.com

# Auto-renewal is configured automatically
```

---

## Environment Configuration

### Production .env (Backend)

```bash
# Database (Use connection pooling for production)
DATABASE_URL=postgresql://user:pass@host:5432/agewell?sslmode=require

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# AI Services (Use production rate limits)
GROQ_API_KEY=gsk_production_key
GEMINI_API_KEY=AIza_production_key

# Security
SECRET_KEY=long-random-secret-key
FLASK_DEBUG=0

# Optional: Sentry for error tracking
SENTRY_DSN=https://...
```

### Production .env (Frontend)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional: API URL if different from same origin
VITE_API_URL=https://api.agewell.example.com
```

---

## Monitoring

### Health Checks

Add uptime monitoring:
- Ping `/health` endpoint
- Expected response: `{"status": "healthy"}`

### Logging

Backend logs to stdout. Configure log aggregation:
```bash
# View logs
sudo journalctl -u agewell -f

# Export to external service
# e.g., CloudWatch, Datadog, etc.
```

### Performance Monitoring

Consider integrating:
- New Relic
- DataDog
- Scout APM

---

## Backup Strategy

### Database (Supabase)
- Supabase provides automatic backups
- For additional safety: Schedule pg_dump

### Uploads
- Back up `/uploads/prescriptions/` directory
- Consider S3/GCS for file storage

---

## Security Checklist

- [ ] Use strong SECRET_KEY
- [ ] Enable SSL/HTTPS
- [ ] Set FLASK_DEBUG=0
- [ ] Configure CORS properly
- [ ] Enable Supabase RLS policies
- [ ] Use OAuth state parameter
- [ ] Validate all user inputs
- [ ] Rate limit API endpoints
- [ ] Monitor for suspicious activity

---

## Troubleshooting

**Tesseract not found:**
```bash
which tesseract
# Add to PATH or set TESSERACT_PATH env var
```

**CORS errors:**
- Check Supabase CORS settings
- Verify frontend domain in allowed origins

**Database connection failures:**
- Check DATABASE_URL format
- Verify network access to Supabase
- Check SSL mode settings

**AI service errors:**
- Verify API keys are valid
- Check rate limits
- Review service status pages
