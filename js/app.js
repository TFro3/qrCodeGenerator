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
            iconManifest: null
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing QR Code Generator...');

        // Initialize UI controller
        this.uiController.init();

        // Bind event handlers
        this.uiController.bindEvents(this);

        // Load preset icons
        await this.loadPresetIcons();

        console.log('QR Code Generator ready!');
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

        } catch (error) {
            console.error('Error generating QR code:', error);
            this.uiController.showError('Failed to generate QR code. Please try again.');
        } finally {
            // Hide loading indicator
            this.uiController.hideLoading();
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

            // Resize if too large (optional)
            const resizedDataURL = await this.imageProcessor.resizeImage(dataURL, 512, 512);

            // Set as current logo
            this.state.currentLogo = resizedDataURL;

            // Show preview
            this.uiController.showLogoPreview(resizedDataURL);

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

        if (!canvas) {
            this.uiController.showError('No QR code to download. Generate one first.');
            return;
        }

        try {
            const config = this.uiController.getConfig();
            const filename = this.downloadHandler.generateFilename(config.text);

            this.downloadHandler.downloadPNG(canvas, filename);
            this.uiController.showSuccess('QR code downloaded successfully!');

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
