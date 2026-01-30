/**
 * Image Processor Module
 * Handles logo overlay on QR codes using Canvas API
 */

class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Add logo overlay to QR code canvas
     * @param {HTMLCanvasElement} qrCanvas - Original QR code canvas
     * @param {string} logoSrc - Logo image source (URL or data URL)
     * @param {Object} options - Overlay options
     * @param {number} options.logoSizePercent - Logo size as percentage of QR (0.2-0.3)
     * @param {number} options.padding - Padding around logo in pixels
     * @param {string} options.backgroundColor - Background color for logo area
     * @param {string} options.patternStyle - QR pattern style (for better background shape)
     * @returns {Promise<HTMLCanvasElement>} - Canvas with logo overlay
     */
    async addLogoOverlay(qrCanvas, logoSrc, options = {}) {
        const {
            logoSizePercent = 0.25, // 25% of QR code size
            padding = 10,
            backgroundColor = '#FFFFFF',
            patternStyle = 'squares'
        } = options;

        if (!qrCanvas || !logoSrc) {
            throw new Error('QR canvas and logo source are required');
        }

        // Set canvas to same size as QR code
        this.canvas.width = qrCanvas.width;
        this.canvas.height = qrCanvas.height;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw original QR code
        this.ctx.drawImage(qrCanvas, 0, 0);

        // Load logo image
        const logoImage = await this.loadImage(logoSrc);

        // Calculate logo dimensions
        const logoSize = qrCanvas.width * logoSizePercent;
        const logoX = (qrCanvas.width - logoSize) / 2;
        const logoY = (qrCanvas.height - logoSize) / 2;

        // Draw background for logo (improves scannability)
        // Use rounded shape for dots pattern for better blending
        this.drawLogoBackground(logoX, logoY, logoSize, padding, backgroundColor, patternStyle);

        // Draw logo with aspect ratio preservation
        await this.drawLogo(logoImage, logoX, logoY, logoSize);

        return this.canvas;
    }

    /**
     * Draw background behind logo (shape depends on pattern style)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Logo size
     * @param {number} padding - Padding around logo
     * @param {string} backgroundColor - Background color
     * @param {string} patternStyle - QR pattern style
     */
    drawLogoBackground(x, y, size, padding, backgroundColor, patternStyle) {
        this.ctx.fillStyle = backgroundColor;

        // For dots pattern, use circular background for better blending
        // For other patterns, use rounded rectangle
        if (patternStyle === 'dots') {
            const centerX = x + size / 2;
            const centerY = y + size / 2;
            const radius = (size + padding * 2) / 2;

            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
        } else if (patternStyle === 'rounded') {
            // Rounded rectangle with more radius
            const borderRadius = (size + padding * 2) * 0.2;
            this.ctx.beginPath();
            this.ctx.moveTo(x - padding + borderRadius, y - padding);
            this.ctx.lineTo(x + size + padding - borderRadius, y - padding);
            this.ctx.arcTo(x + size + padding, y - padding, x + size + padding, y - padding + borderRadius, borderRadius);
            this.ctx.lineTo(x + size + padding, y + size + padding - borderRadius);
            this.ctx.arcTo(x + size + padding, y + size + padding, x + size + padding - borderRadius, y + size + padding, borderRadius);
            this.ctx.lineTo(x - padding + borderRadius, y + size + padding);
            this.ctx.arcTo(x - padding, y + size + padding, x - padding, y + size + padding - borderRadius, borderRadius);
            this.ctx.lineTo(x - padding, y - padding + borderRadius);
            this.ctx.arcTo(x - padding, y - padding, x - padding + borderRadius, y - padding, borderRadius);
            this.ctx.closePath();
            this.ctx.fill();
        } else {
            // Standard rectangle for squares pattern
            this.ctx.fillRect(
                x - padding,
                y - padding,
                size + (padding * 2),
                size + (padding * 2)
            );
        }
    }

    /**
     * Draw logo image with aspect ratio preservation
     * @param {HTMLImageElement} image - Logo image
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} maxSize - Maximum size for logo
     */
    drawLogo(image, x, y, maxSize) {
        const aspectRatio = image.width / image.height;
        let width = maxSize;
        let height = maxSize;

        // Preserve aspect ratio
        if (aspectRatio > 1) {
            // Landscape
            height = maxSize / aspectRatio;
        } else if (aspectRatio < 1) {
            // Portrait
            width = maxSize * aspectRatio;
        }

        // Center within the allocated space
        const offsetX = (maxSize - width) / 2;
        const offsetY = (maxSize - height) / 2;

        this.ctx.drawImage(
            image,
            x + offsetX,
            y + offsetY,
            width,
            height
        );
    }

    /**
     * Load image from URL or data URL
     * @param {string} src - Image source
     * @returns {Promise<HTMLImageElement>} - Loaded image
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Enable CORS for external images

            img.onload = () => resolve(img);
            img.onerror = (error) => reject(new Error(`Failed to load image: ${error}`));

            img.src = src;
        });
    }

    /**
     * Convert file to data URL
     * @param {File} file - Image file
     * @returns {Promise<string>} - Data URL
     */
    fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Invalid image file'));
                return;
            }

            const reader = new FileReader();

            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(new Error(`Failed to read file: ${error}`));

            reader.readAsDataURL(file);
        });
    }

    /**
     * Resize image to maximum dimensions
     * @param {string} imageSrc - Image source
     * @param {number} maxWidth - Maximum width
     * @param {number} maxHeight - Maximum height
     * @returns {Promise<string>} - Resized image data URL
     */
    async resizeImage(imageSrc, maxWidth, maxHeight) {
        const image = await this.loadImage(imageSrc);

        let width = image.width;
        let height = image.height;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;

            if (width > height) {
                width = maxWidth;
                height = maxWidth / aspectRatio;
            } else {
                height = maxHeight;
                width = maxHeight * aspectRatio;
            }
        }

        // Create temporary canvas for resizing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;

        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(image, 0, 0, width, height);

        return tempCanvas.toDataURL('image/png');
    }

    /**
     * Validate image file
     * @param {File} file - Image file
     * @param {number} maxSizeBytes - Maximum file size in bytes
     * @returns {Object} - Validation result
     */
    validateImageFile(file, maxSizeBytes = 5 * 1024 * 1024) { // 5MB default
        const errors = [];

        if (!file) {
            errors.push('No file provided');
            return { valid: false, errors };
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            errors.push('File must be an image');
        }

        // Check file size
        if (file.size > maxSizeBytes) {
            const maxSizeMB = maxSizeBytes / (1024 * 1024);
            errors.push(`File size must be less than ${maxSizeMB}MB`);
        }

        // Check supported formats
        const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
        if (!supportedFormats.includes(file.type)) {
            errors.push('Unsupported image format. Use PNG, JPEG, SVG, or WebP');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Get the current canvas
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }
}
