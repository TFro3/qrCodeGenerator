/**
 * QR Code Generator Application
 * Main application coordinator
 */

class QRCodeApp {
    constructor() {
        this.qrGenerator = new QRGenerator();
        this.imageProcessor = new ImageProcessor();
        this.uiController = new UIController();
        this.downloadHandler = new DownloadHandler();

        this.state = {
            currentLogo: null,
            iconManifest: null,
            isAnimatedGIF: false,
            animatedGIFBlob: null
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing QR Code Generator...');

        // Check GIF library availability
        this.checkGIFLibraries();

        // Initialize UI controller
        this.uiController.init();

        // Bind event handlers
        this.uiController.bindEvents(this);

        // Load preset icons
        await this.loadPresetIcons();

        console.log('QR Code Generator ready!');
    }

    /**
     * Check if GIF processing libraries are available
     */
    checkGIFLibraries() {
        // Wait a bit for ES module to load
        setTimeout(() => {
            if (typeof window.gifuct === 'undefined') {
                console.warn('⚠️ gifuct-js library not loaded. Animated GIF support will be disabled.');
                console.warn('Check CDN: https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/+esm');
            } else {
                console.log('✓ gifuct-js library loaded successfully');
            }

            if (typeof window.GIF === 'undefined') {
                console.warn('⚠️ gif.js library not loaded. Animated GIF support will be disabled.');
                console.warn('Check CDN: https://unpkg.com/gif.js@0.2.0/dist/gif.js');
            } else {
                console.log('✓ gif.js library loaded successfully');
            }
        }, 100);
    }

    /**
     * Generate QR code based on current UI configuration
     */
    async generateQR() {
        try {
            // Validate input
            const validation = this.uiController.validateInput();
            if (!validation.valid) {
                this.uiController.showError(validation.error);
                return;
            }

            // Show loading indicator
            this.uiController.showLoading();

            // Get configuration from UI
            const config = this.uiController.getConfig();

            // Check if we're dealing with an animated GIF
            if (this.state.isAnimatedGIF && this.state.currentLogo) {
                await this.generateAnimatedQR(config);
            } else {
                // Standard static QR code generation
                await this.generateStaticQR(config);
            }

        } catch (error) {
            console.error('Error generating QR code:', error);
            this.uiController.showError('Failed to generate QR code. Please try again.');
        } finally {
            // Hide loading indicator
            this.uiController.hideLoading();
        }
    }

    /**
     * Generate static (non-animated) QR code
     */
    async generateStaticQR(config) {
        // Generate base QR code
        const qrCanvas = this.qrGenerator.generate(config);

        let finalCanvas = qrCanvas;

        // Add logo overlay if logo is selected
        if (this.state.currentLogo) {
            try {
                // Use white background for logo area regardless of QR background
                // (helps with scannability and works with both transparent and colored backgrounds)
                const logoBackgroundColor = '#FFFFFF';

                finalCanvas = await this.imageProcessor.addLogoOverlay(
                    qrCanvas,
                    this.state.currentLogo,
                    {
                        logoSizePercent: 0.25,
                        padding: 10,
                        backgroundColor: logoBackgroundColor,
                        patternStyle: config.style
                    }
                );
            } catch (error) {
                console.error('Failed to add logo overlay:', error);
                this.uiController.showError('Failed to add logo. Using QR code without logo.');
                finalCanvas = qrCanvas;
            }
        }

        // Display QR code
        this.uiController.displayQR(finalCanvas);
        this.state.animatedGIFBlob = null;
    }

    /**
     * Generate animated QR code with GIF logo
     */
    async generateAnimatedQR(config) {
        try {
            // Check if GIF libraries are available
            if (!window.gifuct || !window.GIF) {
                throw new Error('GIF processing libraries not loaded. Please check your internet connection and refresh the page.');
            }

            this.uiController.showLoadingMessage('Processing animated GIF...');

            // Parse GIF frames
            const frames = await this.imageProcessor.parseGIF(this.state.currentLogo);
            console.log(`Processing ${frames.length} GIF frames...`);

            const qrCanvases = [];
            const delays = [];

            // Use white background for logo area
            const logoBackgroundColor = '#FFFFFF';

            // Generate QR code for each frame
            for (let i = 0; i < frames.length; i++) {
                this.uiController.showLoadingMessage(`Processing frame ${i + 1}/${frames.length}...`);

                // Generate base QR code (same for all frames)
                const qrCanvas = this.qrGenerator.generate(config);

                // Convert frame ImageData to canvas
                const frameCanvas = this.imageProcessor.imageDataToCanvas(frames[i].imageData);
                const frameDataURL = frameCanvas.toDataURL();

                // Add logo overlay for this frame
                const finalCanvas = await this.imageProcessor.addLogoOverlay(
                    qrCanvas,
                    frameDataURL,
                    {
                        logoSizePercent: 0.25,
                        padding: 10,
                        backgroundColor: logoBackgroundColor,
                        patternStyle: config.style
                    }
                );

                qrCanvases.push(finalCanvas);
                delays.push(frames[i].delay);
            }

            // Create animated GIF from QR frames
            this.uiController.showLoadingMessage('Creating animated GIF...');

            const gifBlob = await this.imageProcessor.createAnimatedGIF(
                qrCanvases,
                delays,
                (progress) => {
                    this.uiController.showLoadingMessage(`Encoding GIF: ${Math.round(progress * 100)}%`);
                }
            );

            // Convert blob to data URL for display
            const gifDataURL = await this.imageProcessor.blobToDataURL(gifBlob);

            // Store blob for download
            this.state.animatedGIFBlob = gifBlob;

            // Display animated GIF
            this.uiController.displayAnimatedGIF(gifDataURL);

            console.log('Animated QR code generated successfully');

        } catch (error) {
            console.error('Failed to generate animated QR code:', error);
            console.error('Error details:', error.message, error.stack);
            this.uiController.showError(`Failed to process animated GIF: ${error.message}. Using static QR code.`);
            // Fallback to static QR
            await this.generateStaticQR(config);
        }
    }

    /**
     * Handle logo file upload
     * @param {File} file - Uploaded image file
     */
    async handleLogoUpload(file) {
        try {
            // Validate file
            const validation = this.imageProcessor.validateImageFile(file);
            if (!validation.valid) {
                this.uiController.showError(validation.errors.join(', '));
                return;
            }

            // Convert to data URL
            const dataURL = await this.imageProcessor.fileToDataURL(file);

            // Check if it's a GIF
            const isGIF = file.type === 'image/gif';

            if (isGIF) {
                // Store GIF as-is for animated processing
                this.state.currentLogo = dataURL;
                this.state.isAnimatedGIF = true;

                // Show preview (first frame)
                this.uiController.showLogoPreview(dataURL);
            } else {
                // Resize non-GIF images
                const resizedDataURL = await this.imageProcessor.resizeImage(dataURL, 512, 512);

                // Set as current logo
                this.state.currentLogo = resizedDataURL;
                this.state.isAnimatedGIF = false;

                // Show preview
                this.uiController.showLogoPreview(resizedDataURL);
            }

            // Close icon picker if open
            if (this.uiController.state.iconPickerOpen) {
                this.uiController.toggleIconPicker();
            }

            // Regenerate QR code if one exists
            if (this.uiController.state.currentCanvas) {
                await this.generateQR();
            }

        } catch (error) {
            console.error('Error handling logo upload:', error);
            this.uiController.showError('Failed to upload logo. Please try another image.');
        }
    }

    /**
     * Handle preset icon selection
     * @param {string} iconPath - Path to icon file
     */
    async handleIconSelect(iconPath) {
        try {
            // Set as current logo
            this.state.currentLogo = iconPath;

            // Show preview
            this.uiController.showLogoPreview(iconPath);

            // Close icon picker
            this.uiController.toggleIconPicker();

            // Regenerate QR code if one exists
            if (this.uiController.state.currentCanvas) {
                await this.generateQR();
            }

        } catch (error) {
            console.error('Error selecting preset icon:', error);
            this.uiController.showError('Failed to select icon. Please try again.');
        }
    }

    /**
     * Remove current logo
     */
    async removeLogo() {
        this.state.currentLogo = null;
        this.state.isAnimatedGIF = false;
        this.state.animatedGIFBlob = null;
        this.uiController.hideLogoPreview();

        // Clear file input
        const fileInput = document.getElementById('logo-upload');
        if (fileInput) {
            fileInput.value = '';
        }

        // Remove selection from icon picker
        document.querySelectorAll('.icon-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Regenerate QR code without logo
        if (this.uiController.state.currentCanvas) {
            await this.generateQR();
        }
    }

    /**
     * Download current QR code
     */
    downloadQR() {
        const canvas = this.uiController.state.currentCanvas;

        if (!canvas && !this.state.animatedGIFBlob) {
            this.uiController.showError('No QR code to download. Generate one first.');
            return;
        }

        try {
            const config = this.uiController.getConfig();
            const filename = this.downloadHandler.generateFilename(config.text);

            // Download animated GIF if available
            if (this.state.animatedGIFBlob) {
                this.downloadHandler.downloadGIF(this.state.animatedGIFBlob, filename);
                this.uiController.showSuccess('Animated QR code downloaded successfully!');
            } else {
                // Download static PNG
                this.downloadHandler.downloadPNG(canvas, filename);
                this.uiController.showSuccess('QR code downloaded successfully!');
            }

        } catch (error) {
            console.error('Error downloading QR code:', error);
            this.uiController.showError('Failed to download QR code. Please try again.');
        }
    }

    /**
     * Load preset icons manifest
     */
    async loadPresetIcons() {
        try {
            const response = await fetch('assets/icons-manifest.json');

            if (!response.ok) {
                console.warn('Icons manifest not found. Preset icons will not be available.');
                this.uiController.disablePresetIcons('Preset icons unavailable (use a web server or upload custom images)');
                return;
            }

            this.state.iconManifest = await response.json();

            // Populate icon picker
            this.uiController.populateIconPicker(
                this.state.iconManifest,
                (iconPath) => this.handleIconSelect(iconPath)
            );

            console.log('Preset icons loaded successfully');

        } catch (error) {
            console.warn('Failed to load preset icons:', error);
            // Non-critical error - app still works without preset icons
            // This commonly happens when opening index.html directly (file:// protocol)
            this.uiController.disablePresetIcons('Preset icons unavailable when opening file directly. Use a web server or upload custom images.');
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new QRCodeApp();
    app.init();
});
