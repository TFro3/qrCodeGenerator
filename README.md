# QR Code Generator

A free, self-hosted QR code generator that creates QR codes that **never expire**. Built with pure HTML, CSS, and JavaScript - no backend required!

## Features

- **Completely Free & Self-Hosted** - Your QR codes, your control
- **No Expiration** - QR codes work forever (as long as the linked URL is active)
- **Multiple Pattern Styles** - Choose between squares or rounded patterns
- **Custom Logos** - Add your own logo or choose from 18 preset icons
- **Animated GIF Support** - Upload animated GIFs to create eye-catching animated QR codes
- **Flexible Sizing** - Generate QR codes from 256px to 2048px
- **Error Correction Levels** - Choose from Low, Medium, Quartile, or High
- **Custom Colors** - Customize foreground and background colors, or use transparent backgrounds
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Offline Capable** - Works without internet connection once loaded
- **Privacy-Focused** - All processing happens in your browser

## Quick Start

### Option 1: Open Directly in Browser

Simply open [index.html](index.html) in any modern web browser. That's it!

**Note**: When opening the file directly (file:// protocol), preset icons won't be available due to browser security restrictions. You can still upload custom logos! For full functionality including preset icons, use Option 2 or 3.

### Option 2: Run with Python HTTP Server (Recommended)

```bash
cd "QR Code Generator"
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

### Option 3: Deploy on Raspberry Pi

#### Using Nginx (Recommended)

```bash
# Install nginx
sudo apt-get update
sudo apt-get install nginx

# Copy files to web root
sudo cp -r /path/to/qr-code-generator/* /var/www/html/

# Set permissions
sudo chown -R www-data:www-data /var/www/html

# Restart nginx
sudo systemctl restart nginx
```

Access via `http://[your-raspberry-pi-ip]/`

#### Using Apache

```bash
# Install Apache
sudo apt-get update
sudo apt-get install apache2

# Copy files
sudo cp -r /path/to/qr-code-generator/* /var/www/html/

# Set permissions
sudo chown -R www-data:www-data /var/www/html

# Restart Apache
sudo systemctl restart apache2
```

#### Using Lighttpd (Lightweight Option)

```bash
# Install lighttpd
sudo apt-get update
sudo apt-get install lighttpd

# Copy files
sudo cp -r /path/to/qr-code-generator/* /var/www/html/

# Restart lighttpd
sudo systemctl restart lighttpd
```

## Usage

1. **Enter URL or Text** - Type or paste the URL/text you want to encode
2. **Choose Pattern Style** - Select from squares (default) or rounded
3. **Select Size** - Choose from 256px, 512px, 1024px, or 2048px
4. **Set Error Correction** - Higher levels allow for more logo coverage
5. **Add Logo (Optional)** - Upload custom image or select a preset icon
6. **Customize Colors** - Change foreground and background colors, or enable transparent background
7. **Generate** - Click "Generate QR Code" or press Enter
8. **Download** - Click download button or press Cmd/Ctrl+S

## Keyboard Shortcuts

- **Enter** - Generate QR code
- **Cmd/Ctrl + S** - Download QR code
- **Escape** - Close icon picker

## Error Correction Levels

- **Low (7%)** - For clean digital displays
- **Medium (15%)** - General purpose use
- **Quartile (25%)** - For printed materials
- **High (30%)** - Required when using logos (recommended)

## Pattern Styles

### Squares
Traditional QR code appearance with square modules. Fastest rendering, maximum compatibility.

### Rounded
Smooth rounded rectangles for a contemporary look. Good balance of style and function.

## Logo Guidelines

For best scanning results when using logos:

- **Use High error correction level** (30% damage tolerance)
- **Keep logo size small** - Logo covers ~25% of QR code
- **Use high contrast** - Logo should stand out clearly
- **Test scanning** - Always test with your phone before printing

## Animated GIF Support

Create eye-catching animated QR codes for digital displays:

- **Upload animated GIFs** - Upload any GIF file as your logo to create an animated QR code
- **Frame-by-frame processing** - Each frame of your GIF is applied to the QR code
- **Automatic encoding** - The app processes all frames and combines them back into an animated GIF
- **Perfect for digital use** - Ideal for websites, digital displays, presentations, and social media
- **Same scannability** - Animated QR codes scan just as well as static ones
- **Progress indicators** - Real-time feedback during processing

**Best practices for animated QR codes:**
- Use smaller GIFs (fewer frames and smaller dimensions) for faster processing
- Keep animations simple - complex GIFs may take longer to process
- Test scanning on multiple devices before deploying
- Best suited for digital displays (screens) rather than printed materials
- Downloaded as animated GIF files ready to use

## Transparent Background

Enable transparent backgrounds for maximum flexibility:

- **When to use**: Perfect for overlaying QR codes on images, colored backgrounds, or designs
- **Export format**: Download as PNG with alpha channel transparency
- **Logo support**: Works seamlessly with logos - logo area maintains white background for scannability
- **Use cases**: Stickers, labels, business cards, marketing materials, web designs

**How to enable**: Simply check the "Transparent Background" checkbox in the Colors section before generating.

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Chromium on Raspberry Pi OS

## Technical Details

### Stack
- Pure HTML5, CSS3, JavaScript (ES6 with ES modules)
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) library
- [gifuct-js](https://github.com/matt-way/gifuct-js) for GIF parsing (via jsDelivr ESM)
- [gif.js](https://github.com/jnordberg/gif.js) for GIF encoding
- Native Canvas API for rendering
- No build tools required

### File Structure

```
qr-code-generator/
├── index.html              # Main HTML file
├── css/
│   ├── main.css           # Core styles
│   ├── components.css     # Component styles
│   └── responsive.css     # Mobile responsiveness
├── js/
│   ├── app.js             # Main application
│   ├── qr-generator.js    # QR generation logic
│   ├── image-processor.js # Logo overlay & GIF processing
│   ├── ui-controller.js   # UI interactions
│   ├── download-handler.js # Download functionality
│   └── vendor/
│       └── gif.worker.js  # GIF encoding worker (local)
├── assets/
│   ├── icons/             # Preset icon library
│   └── icons-manifest.json
└── README.md
```

### Requirements

- Modern web browser with Canvas API support
- ~5MB disk space
- No server-side dependencies

### Performance

Optimized for Raspberry Pi:
- Debounced preview updates (300ms)
- requestAnimationFrame rendering
- Maximum size limited to 2048px for performance

## Preset Icons

### Social Media (6 icons)
Facebook, Instagram, Twitter/X, LinkedIn, YouTube, TikTok

### Technology (6 icons)
GitHub, Website, Email, Phone, WiFi, Link

### Business (6 icons)
Shop, Cart, Card, Location, Calendar, Payment

## Privacy & Security

- **100% Client-Side** - No data sent to any server
- **No Tracking** - No analytics or cookies
- **No Account Required** - Use immediately, no signup
- **Offline Capable** - Works without internet connection
- **Open Source** - Inspect the code yourself

## Tips & Best Practices

1. **Test Before Printing** - Always scan your QR code before mass printing
2. **Use High Error Correction** - Especially for outdoor/printed codes
3. **Avoid Small Sizes for Logos** - 512px minimum when using logos
4. **High Contrast Colors** - Dark code on light background works best
5. **Leave Quiet Zone** - White border around QR code improves scanning
6. **Test Different Scanners** - iOS Camera, Android, dedicated apps

## Troubleshooting

### QR Code Won't Scan

- Increase error correction level to High (H)
- Make logo smaller or remove it
- Increase QR code size
- Ensure high contrast (black on white)
- Check that URL is correct

### Logo Not Appearing

- Check file format (PNG, JPG, SVG, GIF supported)
- File size must be under 5MB
- Try a different image
- Ensure error correction is set to High (H)

### Animated GIF Processing Slowly

- Reduce GIF file size (dimensions and frame count)
- Large GIFs with many frames take longer to process
- Progress percentage is shown during encoding
- Consider using simpler animations with fewer frames
- Processing time varies based on device performance

### Preset Icons Not Available (Button Disabled)

**Common Cause**: Opening `index.html` directly using `file://` protocol

**Solution**: Use a web server instead:
```bash
# Option 1: Python HTTP Server
python3 -m http.server 8000

# Option 2: Node.js http-server
npx http-server

# Option 3: Deploy to Raspberry Pi with nginx/apache
```

**Why**: Browsers block `fetch()` requests to local files (CORS policy) when using `file://` protocol for security reasons.

**Workaround**: You can still use the app! Just upload custom logos instead of using preset icons.

## Future Enhancements

Potential features for future versions:

- vCard QR codes (contact information)
- WiFi QR codes (network credentials)
- Batch QR code generation
- SVG export option
- History/favorites
- Dark mode
- Print layout

## Contributing

Found a bug or want to add a feature? Contributions welcome!

## License

Free to use for personal and commercial projects.

## Credits

- QR Code Library: [qrcode-generator by kazuhikoarase](https://github.com/kazuhikoarase/qrcode-generator)
- GIF Parsing: [gifuct-js by matt-way](https://github.com/matt-way/gifuct-js)
- GIF Encoding: [gif.js by jnordberg](https://github.com/jnordberg/gif.js)
- Icons: Custom SVG icons and brand logos

## Support

For issues or questions, please check:
1. This README for common solutions
2. Browser console for error messages
3. Verify all files are present

---

**Made with ❤️ for creating QR codes that last forever**

No subscriptions. No expiration. No tracking. Just free, reliable QR codes.
