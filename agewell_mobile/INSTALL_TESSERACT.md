# Tesseract OCR Installation Guide for AGEWELL

## 📥 Download Tesseract OCR

### Latest Version (Recommended)
**Tesseract 5.5.0** - 64-bit Windows Installer

**Direct Download Link:**
```
https://github.com/tesseract-ocr/tesseract/releases/download/5.5.0/tesseract-ocr-w64-setup-5.5.0.20241111.exe
```

### Alternative Versions
- **Older versions (32-bit and 64-bit):** https://digi.bib.uni-mannheim.de/tesseract/
- **Tesseract 4.x:** Available from the same repository
- **Tesseract 3.x:** Legacy versions available

## 🔧 Installation Steps

### Step 1: Download the Installer
1. Click this link to download: [tesseract-ocr-w64-setup-5.5.0.20241111.exe](https://github.com/tesseract-ocr/tesseract/releases/download/5.5.0/tesseract-ocr-w64-setup-5.5.0.20241111.exe)
2. Save the file to your Downloads folder

### Step 2: Run the Installer
1. Double-click the downloaded `.exe` file
2. Click "Yes" if Windows asks for permission
3. Follow the installation wizard

### Step 3: Choose Installation Directory
**IMPORTANT:** Use the default installation path:
```
C:\Program Files\Tesseract-OCR
```

⚠️ **WARNING:** The uninstaller removes the entire installation directory. Do NOT install in an existing directory with other files!

### Step 4: Select Components
During installation, ensure these are selected:
- ✅ **Tesseract OCR Engine** (required)
- ✅ **English language data** (required)
- ✅ Additional language data (optional, if needed)

### Step 5: Complete Installation
1. Click "Install"
2. Wait for installation to complete
3. Click "Finish"

### Step 6: Verify Installation
Open Command Prompt and run:
```bash
tesseract --version
```

Expected output:
```
tesseract 5.5.0
 leptonica-1.84.1
  libgif 5.2.1 : libjpeg 8d (libjpeg-turbo 3.0.1) : libpng 1.6.43 : libtiff 4.6.0 : zlib 1.3.1 : libwebp 1.4.0 : libopenjp2 2.5.2
 Found AVX2
 Found AVX
 Found FMA
 Found SSE4.1
 Found libarchive 3.7.4 zlib/1.3.1 liblzma/5.6.2 bz2lib/1.0.8 liblz4/1.10.0 libzstd/1.5.6
 Found libcurl/8.8.0 (Schannel) zlib/1.3.1 zstd/1.5.6 libidn2/2.3.7 libpsl/0.21.5 libssh2/1.11.0 nghttp2/1.62.1 nghttp3/1.4.0
```

## 🛠️ Configuration for AGEWELL

### Option 1: Default Installation (Recommended)
If you installed to the default path, **no configuration needed!** The AGEWELL backend will automatically detect Tesseract.

### Option 2: Custom Installation Path
If you installed to a different location, update the path in the backend:

1. Open: `D:\AGEWELL\backend\services\ocr_service.py`
2. Find this section (around line 20):
   ```python
   if os.name == 'nt':
       # Common installation paths
       possible_paths = [
           r'C:\Program Files\Tesseract-OCR\tesseract.exe',
           r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
       ]
   ```
3. Add your custom path to the list

### Option 3: Add to PATH (Alternative)
Add Tesseract to your system PATH:

1. Open System Properties → Environment Variables
2. Under "System variables", find "Path"
3. Click "Edit"
4. Click "New"
5. Add: `C:\Program Files\Tesseract-OCR`
6. Click "OK" on all dialogs
7. Restart Command Prompt/PowerShell

## 📚 Language Data

### Included Languages
The installer includes English by default. For additional languages:

### Download Additional Languages
1. Visit: https://github.com/tesseract-ocr/tessdata
2. Download the `.traineddata` file for your language
3. Copy to: `C:\Program Files\Tesseract-OCR\tessdata\`

### Common Languages
- **English:** `eng.traineddata` (included)
- **Spanish:** `spa.traineddata`
- **French:** `fra.traineddata`
- **German:** `deu.traineddata`
- **Hindi:** `hin.traineddata`

## 🧪 Testing Tesseract

### Test 1: Command Line
```bash
tesseract --version
tesseract --list-langs
```

### Test 2: With Sample Image
1. Create a test image with text
2. Run:
   ```bash
   tesseract test_image.png output
   ```
3. Check `output.txt` for extracted text

### Test 3: With AGEWELL
1. Start AGEWELL backend
2. Upload a prescription image
3. Check if OCR processing works

## 🔧 Troubleshooting

### Issue: "tesseract is not recognized"
**Solution:**
- Verify installation path exists
- Add to PATH (see Option 3 above)
- Restart terminal/IDE

### Issue: "Failed to load language data"
**Solution:**
- Check `tessdata` folder exists
- Verify `eng.traineddata` is present
- Reinstall if missing

### Issue: "OCR returns empty text"
**Solution:**
- Ensure image is clear and high quality
- Try different image formats (PNG, JPG)
- Check image orientation
- Verify language data is installed

### Issue: "Permission denied"
**Solution:**
- Run installer as Administrator
- Check folder permissions
- Reinstall to default location

## 📖 Using Tesseract

### Basic Usage
```bash
# Extract text from image
tesseract input.png output

# Specify language
tesseract input.png output -l eng

# Multiple languages
tesseract input.png output -l eng+spa

# Create searchable PDF
tesseract input.png output pdf

# Create hOCR output
tesseract input.png output hocr
```

### Advanced Options
```bash
# Page segmentation mode
tesseract input.png output --psm 3

# OCR Engine mode
tesseract input.png output --oem 3

# Custom config
tesseract input.png output -c tessedit_char_whitelist=0123456789
```

### Page Segmentation Modes (PSM)
- `0` - Orientation and script detection only
- `1` - Automatic page segmentation with OSD
- `3` - Fully automatic page segmentation (default)
- `4` - Assume a single column of text
- `6` - Assume a single uniform block of text
- `7` - Treat the image as a single text line
- `11` - Sparse text. Find as much text as possible

## 🎯 AGEWELL Integration

### How AGEWELL Uses Tesseract
1. User uploads prescription image
2. Backend saves image to `uploads/prescriptions/`
3. OCR service calls Tesseract to extract text
4. AI parses extracted text for medications
5. Medications auto-added to schedule

### Supported Image Formats
- PNG (recommended)
- JPG/JPEG
- PDF (single page)
- TIFF
- BMP

### Best Practices for Prescription Images
- ✅ High resolution (300 DPI or higher)
- ✅ Good lighting, no shadows
- ✅ Clear, focused image
- ✅ Straight orientation (not tilted)
- ✅ Black text on white background
- ❌ Avoid blurry images
- ❌ Avoid handwritten prescriptions (OCR works best with printed text)

## 📊 Performance Tips

### Improve OCR Accuracy
1. Use high-quality images
2. Preprocess images (contrast, brightness)
3. Use appropriate PSM mode
4. Specify correct language
5. Use latest Tesseract version

### Speed Optimization
1. Resize large images before OCR
2. Use appropriate OEM mode
3. Limit to specific language
4. Use faster PSM modes

## 🔗 Additional Resources

- **Official Documentation:** https://tesseract-ocr.github.io/
- **GitHub Repository:** https://github.com/tesseract-ocr/tesseract
- **UB Mannheim Builds:** https://github.com/UB-Mannheim/tesseract/wiki
- **Language Data:** https://github.com/tesseract-ocr/tessdata
- **Training Data:** https://github.com/tesseract-ocr/tesstrain

## ✅ Installation Checklist

- [ ] Downloaded Tesseract installer
- [ ] Ran installer as Administrator
- [ ] Installed to default path: `C:\Program Files\Tesseract-OCR`
- [ ] Selected English language data
- [ ] Completed installation
- [ ] Verified with `tesseract --version`
- [ ] Tested with sample image
- [ ] AGEWELL backend can access Tesseract
- [ ] Prescription upload works in AGEWELL

## 🎉 You're Ready!

Once Tesseract is installed and verified, AGEWELL's prescription OCR feature will work automatically!

**Next Steps:**
1. Start AGEWELL backend
2. Start AGEWELL frontend
3. Upload a prescription image
4. Watch the AI extract medications automatically!

---

**Need Help?** Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues.
