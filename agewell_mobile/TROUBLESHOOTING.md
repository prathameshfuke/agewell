# AGEWELL - Troubleshooting Guide

## 🔧 Common Issues and Solutions

### Backend Issues

#### Issue: "Python not found" or "python is not recognized"
**Symptoms:**
- Error when running `python app.py`
- Command not found

**Solutions:**
1. Install Python 3.8+ from https://www.python.org/downloads/
2. During installation, check "Add Python to PATH"
3. Restart terminal/command prompt
4. Verify: `python --version`

Alternative:
```bash
# Try python3 instead
python3 app.py
```

---

#### Issue: "Module not found" errors
**Symptoms:**
- `ModuleNotFoundError: No module named 'flask'`
- Import errors

**Solutions:**
1. Ensure virtual environment is activated:
   ```bash
   cd D:\AGEWELL\backend
   venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Verify installation:
   ```bash
   pip list
   ```

---

#### Issue: "Tesseract not found"
**Symptoms:**
- `TesseractNotFoundError`
- OCR processing fails

**Solutions:**
1. Install Tesseract OCR:
   - **Download:** [tesseract-ocr-w64-setup-5.5.0.20241111.exe](https://github.com/tesseract-ocr/tesseract/releases/download/5.5.0/tesseract-ocr-w64-setup-5.5.0.20241111.exe)
   - **Install to:** `C:\Program Files\Tesseract-OCR\` (default)
   - **Full Guide:** See [INSTALL_TESSERACT.md](INSTALL_TESSERACT.md)

2. Verify installation:
   ```bash
   tesseract --version
   ```

3. If installed to custom location, update path in `backend\services\ocr_service.py`:
   ```python
   pytesseract.pytesseract.tesseract_cmd = r'C:\Your\Custom\Path\tesseract.exe'
   ```

4. Add to PATH (alternative):
   - System Properties → Environment Variables → Path
   - Add: `C:\Program Files\Tesseract-OCR`
   - Restart terminal

---

#### Issue: "Port 5000 already in use"
**Symptoms:**
- `Address already in use`
- Server won't start

**Solutions:**
1. Find and kill process using port 5000:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

2. Or change port in `backend\app.py`:
   ```python
   app.run(debug=True, host='0.0.0.0', port=5001)
   ```

---

#### Issue: "Database locked"
**Symptoms:**
- `sqlite3.OperationalError: database is locked`
- Cannot write to database

**Solutions:**
1. Close all backend instances
2. Delete database and recreate:
   ```bash
   cd D:\AGEWELL\backend
   del agewell.db
   python app.py
   ```

3. Or use PostgreSQL for production

---

#### Issue: "CORS errors"
**Symptoms:**
- `Access-Control-Allow-Origin` errors in browser
- API calls fail from frontend

**Solutions:**
1. Verify backend is running on port 5000
2. Check CORS configuration in `backend\app.py`:
   ```python
   CORS(app)  # Should be present
   ```

3. Verify frontend proxy in `frontend\vite.config.js`:
   ```javascript
   proxy: {
     '/api': {
       target: 'http://localhost:5000',
       changeOrigin: true
     }
   }
   ```

---

### Frontend Issues

#### Issue: "npm not found"
**Symptoms:**
- `npm is not recognized`
- Cannot install dependencies

**Solutions:**
1. Install Node.js from https://nodejs.org/
2. Install LTS version
3. Restart terminal
4. Verify: `npm --version`

---

#### Issue: "Module not found" in frontend
**Symptoms:**
- `Cannot find module 'react'`
- Import errors

**Solutions:**
1. Install dependencies:
   ```bash
   cd D:\AGEWELL\frontend
   npm install
   ```

2. Clear cache and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

#### Issue: "Port 3000 already in use"
**Symptoms:**
- Vite server won't start
- Port conflict

**Solutions:**
1. Kill process on port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. Or change port in `frontend\vite.config.js`:
   ```javascript
   server: {
     port: 3001
   }
   ```

---

#### Issue: "API calls return 404"
**Symptoms:**
- Network errors in browser console
- API endpoints not found

**Solutions:**
1. Ensure backend is running
2. Check API base URL in `frontend\src\api\api.js`
3. Verify endpoint paths match backend routes
4. Check browser network tab for actual request URL

---

### Database Issues

#### Issue: "Table does not exist"
**Symptoms:**
- `sqlite3.OperationalError: no such table`
- Database queries fail

**Solutions:**
1. Recreate database:
   ```bash
   cd D:\AGEWELL\backend
   del agewell.db
   python app.py
   ```

2. Or run seed script:
   ```bash
   python seed_data.py
   ```

---

#### Issue: "Foreign key constraint failed"
**Symptoms:**
- Cannot insert/update records
- Constraint violations

**Solutions:**
1. Ensure related records exist first
2. Check user_id, medication_id references
3. Verify data integrity
4. Reseed database if corrupted

---

### OCR Issues

#### Issue: "OCR returns empty text"
**Symptoms:**
- Prescription processing returns no medications
- OCR text is blank

**Solutions:**
1. Ensure image is clear and high quality
2. Try different image formats (PNG, JPG)
3. Check image orientation
4. Verify Tesseract installation
5. Test with sample prescription image

---

#### Issue: "Medication parsing fails"
**Symptoms:**
- OCR extracts text but no medications found
- Parsing errors

**Solutions:**
1. Check prescription format
2. Ensure text is in English
3. Review OCR text output
4. Manually add medications if needed
5. Adjust parsing patterns in `ocr_service.py`

---

### Authentication Issues

#### Issue: "Cannot login"
**Symptoms:**
- Login fails
- User not created

**Solutions:**
1. Check phone number format
2. Verify backend is running
3. Check browser console for errors
4. Create user manually via API:
   ```bash
   curl -X POST http://localhost:5000/api/users/ \
     -H "Content-Type: application/json" \
     -d '{"name":"Test","phone":"1234567890","role":"elderly"}'
   ```

---

### Performance Issues

#### Issue: "Slow API responses"
**Symptoms:**
- Long loading times
- Timeouts

**Solutions:**
1. Check database size
2. Add indexes to frequently queried columns
3. Optimize queries
4. Use pagination for large datasets
5. Consider caching

---

#### Issue: "High memory usage"
**Symptoms:**
- Application crashes
- System slowdown

**Solutions:**
1. Restart servers
2. Clear browser cache
3. Optimize database queries
4. Limit data fetching
5. Use production build for frontend

---

### Notification Issues

#### Issue: "Notifications not sending"
**Symptoms:**
- No WhatsApp messages
- No push notifications

**Solutions:**
1. Check `.env` file for API keys
2. Verify notification service configuration
3. Check console logs for errors
4. Test with development mode (console logging)
5. Verify phone number format

---

### Build Issues

#### Issue: "Frontend build fails"
**Symptoms:**
- `npm run build` errors
- Compilation errors

**Solutions:**
1. Clear cache:
   ```bash
   rm -rf node_modules .vite
   npm install
   ```

2. Check for syntax errors
3. Verify all imports
4. Update dependencies:
   ```bash
   npm update
   ```

---

### Deployment Issues

#### Issue: "Production deployment fails"
**Symptoms:**
- Server errors in production
- Application not accessible

**Solutions:**
1. Check environment variables
2. Verify database connection
3. Ensure all dependencies installed
4. Check server logs
5. Verify CORS settings for production domain

---

## 🔍 Debugging Tips

### Backend Debugging

1. **Enable Debug Mode:**
   ```python
   # In app.py
   app.run(debug=True)
   ```

2. **Check Logs:**
   - Monitor console output
   - Add print statements
   - Use logging module

3. **Test API Directly:**
   ```bash
   curl http://localhost:5000/api/users/1
   ```

4. **Database Inspection:**
   ```bash
   sqlite3 agewell.db
   .tables
   SELECT * FROM users;
   ```

### Frontend Debugging

1. **Browser Console:**
   - F12 → Console tab
   - Check for errors
   - Monitor network requests

2. **React DevTools:**
   - Install React DevTools extension
   - Inspect component state
   - Check props

3. **Network Tab:**
   - Monitor API calls
   - Check request/response
   - Verify status codes

---

## 📞 Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Review error messages carefully
3. ✅ Check browser console
4. ✅ Verify all prerequisites installed
5. ✅ Try restarting servers
6. ✅ Check documentation

### Information to Provide

When reporting issues, include:
- Error message (full text)
- Steps to reproduce
- Operating system
- Python version (`python --version`)
- Node version (`node --version`)
- Browser and version
- Screenshots if applicable

---

## 🛠️ Maintenance Tasks

### Regular Maintenance

1. **Clear Old Data:**
   ```sql
   DELETE FROM health_readings WHERE timestamp < date('now', '-30 days');
   ```

2. **Backup Database:**
   ```bash
   copy agewell.db agewell_backup.db
   ```

3. **Update Dependencies:**
   ```bash
   # Backend
   pip install --upgrade -r requirements.txt
   
   # Frontend
   npm update
   ```

4. **Clear Logs:**
   - Delete old log files
   - Rotate logs regularly

---

## 🔄 Reset Everything

If all else fails, complete reset:

```bash
# Backend
cd D:\AGEWELL\backend
rmdir /s /q venv
del agewell.db
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed_data.py
python app.py

# Frontend (new terminal)
cd D:\AGEWELL\frontend
rmdir /s /q node_modules
del package-lock.json
npm install
npm run dev
```

---

## ✅ Health Check Checklist

Run through this checklist to verify everything is working:

- [ ] Python installed and in PATH
- [ ] Node.js installed and in PATH
- [ ] Tesseract OCR installed
- [ ] Backend virtual environment created
- [ ] Backend dependencies installed
- [ ] Database created
- [ ] Backend server running (port 5000)
- [ ] Frontend dependencies installed
- [ ] Frontend server running (port 3000)
- [ ] Can access http://localhost:3000
- [ ] Can login to application
- [ ] Can add health reading
- [ ] Can view medications
- [ ] API calls working (check network tab)

---

**Still having issues?** Review the documentation files:
- README.md
- SETUP_GUIDE.md
- API_TESTING.md
- PROJECT_SUMMARY.md
