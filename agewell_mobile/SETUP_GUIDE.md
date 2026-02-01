# AGEWELL - Quick Setup Guide

## Step-by-Step Installation

### 1. Install Prerequisites

#### Python 3.8+
- Download from: https://www.python.org/downloads/
- During installation, check "Add Python to PATH"

#### Node.js 16+
- Download from: https://nodejs.org/
- Install LTS version

#### Tesseract OCR
- **Already Included:** Tesseract is pre-configured in `D:\AGEWELL\Tesseract\`
- **No Installation Needed:** The project will use the local Tesseract installation
- **Alternative:** You can also install system-wide from [INSTALL_TESSERACT.md](INSTALL_TESSERACT.md)
- **Verify:** The backend will automatically detect Tesseract on startup

### 2. Backend Setup

Open PowerShell/Command Prompt:

```powershell
# Navigate to backend
cd D:\AGEWELL\backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Run the application (creates database automatically)
python app.py
```

Backend will start on: http://localhost:5000

### 3. Frontend Setup

Open a NEW PowerShell/Command Prompt window:

```powershell
# Navigate to frontend
cd D:\AGEWELL\frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start on: http://localhost:3000

### 4. Access the Application

1. Open browser: http://localhost:3000
2. Login page will appear
3. Enter any phone number (demo mode)
4. System will create a user automatically

### 5. Initial Configuration

#### Create Test Users

**Elderly User:**
- Use the login page with phone: `1234567890`
- Role: elderly (auto-assigned)

**Caregiver User:**
- Use login page with phone: `0987654321`
- Role: caregiver (auto-assigned)

#### Link Users (via API)

Use a tool like Postman or curl:

```bash
curl -X POST http://localhost:5000/api/users/link-caregiver \
  -H "Content-Type: application/json" \
  -d '{
    "elderly_user_id": 1,
    "caregiver_user_id": 2
  }'
```

### 6. Test the System

#### Add Health Reading
1. Login as elderly user
2. Go to Health Monitoring
3. Click "Add Reading"
4. Enter sample data:
   - SpO₂: 96
   - Heart Rate: 75
   - Temperature: 36.8
5. Save

#### Upload Prescription
1. Go to Prescription Upload
2. Upload a prescription image
3. AI will process and extract medications
4. Medications will appear in schedule

#### Test Medication Adherence
1. Go to Medication Schedule
2. View today's medications
3. Mark medications as "Taken"
4. Check adherence rate

#### View AI Analysis
1. Login as caregiver
2. Dashboard shows comprehensive analysis
3. View alerts, recommendations, and trends

## Common Issues & Solutions

### Issue: "Python not found"
**Solution**: 
- Reinstall Python with "Add to PATH" checked
- Or add Python to PATH manually

### Issue: "Tesseract not found"
**Solution**:
- Install Tesseract OCR
- Update path in `backend\services\ocr_service.py`:
  ```python
  pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
  ```

### Issue: "Port already in use"
**Solution**:
- Backend: Change port in `backend\app.py`: `app.run(port=5001)`
- Frontend: Change port in `frontend\vite.config.js`: `port: 3001`

### Issue: "Module not found"
**Solution**:
- Ensure virtual environment is activated
- Run: `pip install -r requirements.txt` again

### Issue: "CORS error"
**Solution**:
- Ensure backend is running on port 5000
- Check `frontend\vite.config.js` proxy configuration

### Issue: "Database locked"
**Solution**:
- Close all backend instances
- Delete `backend\agewell.db`
- Restart backend (database will be recreated)

## Development Tips

### Hot Reload
- Frontend: Changes auto-reload
- Backend: Restart server after code changes

### Database Reset
```powershell
cd D:\AGEWELL\backend
del agewell.db
python app.py
```

### View API Documentation
- Visit: http://localhost:5000/
- Shows available endpoints

### Test API Endpoints
Use Postman or curl:

```bash
# Health check
curl http://localhost:5000/health

# Get user
curl http://localhost:5000/api/users/1

# Add health reading
curl -X POST http://localhost:5000/api/health/readings \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "spo2": 96,
    "heart_rate": 75,
    "temperature": 36.8
  }'
```

## Production Deployment

### Backend
1. Use production WSGI server:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

2. Use PostgreSQL instead of SQLite:
   ```python
   # In app.py
   app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:pass@localhost/agewell'
   ```

3. Set environment variables:
   ```bash
   set SECRET_KEY=your-production-secret-key
   set WHATSAPP_API_KEY=your-api-key
   ```

### Frontend
1. Build production bundle:
   ```bash
   npm run build
   ```

2. Deploy `dist` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting

3. Update API URL:
   - Create `.env.production` in frontend
   - Set: `VITE_API_URL=https://your-api-domain.com/api`

## Next Steps

1. **Customize UI**: Edit colors in `frontend\tailwind.config.js`
2. **Add Authentication**: Implement JWT-based auth
3. **Configure Notifications**: Set up WhatsApp/SMS API
4. **Add More Features**: Extend based on requirements
5. **Testing**: Add unit and integration tests
6. **Monitoring**: Set up logging and error tracking

## Support

For issues or questions:
1. Check this guide
2. Review README.md
3. Check code comments
4. Review API documentation

---

**Ready to go!** Start both servers and access http://localhost:3000
