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

        // Create a new canvas for this frame (important for animated GIFs)
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = qrCanvas.width;
        outputCanvas.height = qrCanvas.height;
        const outputCtx = outputCanvas.getContext('2d');

        // Draw original QR code
        outputCtx.drawImage(qrCanvas, 0, 0);

        // Load logo image
        const logoImage = await this.loadImage(logoSrc);

        // Calculate logo dimensions
        const logoSize = qrCanvas.width * logoSizePercent;
        const logoX = (qrCanvas.width - logoSize) / 2;
        const logoY = (qrCanvas.height - logoSize) / 2;

        // Draw background for logo (improves scannability)
        // Use rounded shape for dots pattern for better blending
        this.drawLogoBackground(logoX, logoY, logoSize, padding, backgroundColor, patternStyle, outputCtx);

        // Draw logo with aspect ratio preservation
        this.drawLogo(logoImage, logoX, logoY, logoSize, outputCtx);

        return outputCanvas;
    }

    /**
     * Draw background behind logo (shape depends on pattern style)
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} size - Logo size
     * @param {number} padding - Padding around logo
     * @param {string} backgroundColor - Background color
     * @param {string} patternStyle - QR pattern style
     * @param {CanvasRenderingContext2D} ctx - Canvas context (optional, defaults to this.ctx)
     */
    drawLogoBackground(x, y, size, padding, backgroundColor, patternStyle, ctx = null) {
        const context = ctx || this.ctx;
        context.fillStyle = backgroundColor;

        // For dots pattern, use circular background for better blending
        // For other patterns, use rounded rectangle
        if (patternStyle === 'dots') {
            const centerX = x + size / 2;
            const centerY = y + size / 2;
            const radius = (size + padding * 2) / 2;

            context.beginPath();
            context.arc(centerX, centerY, radius, 0, Math.PI * 2);
            context.fill();
        } else if (patternStyle === 'rounded') {
            // Rounded rectangle with more radius
            const borderRadius = (size + padding * 2) * 0.2;
            context.beginPath();
            context.moveTo(x - padding + borderRadius, y - padding);
            context.lineTo(x + size + padding - borderRadius, y - padding);
            context.arcTo(x + size + padding, y - padding, x + size + padding, y - padding + borderRadius, borderRadius);
            context.lineTo(x + size + padding, y + size + padding - borderRadius);
            context.arcTo(x + size + padding, y + size + padding, x + size + padding - borderRadius, y + size + padding, borderRadius);
            context.lineTo(x - padding + borderRadius, y + size + padding);
            context.arcTo(x - padding, y + size + padding, x - padding, y + size + padding - borderRadius, borderRadius);
            context.lineTo(x - padding, y - padding + borderRadius);
            context.arcTo(x - padding, y - padding, x - padding + borderRadius, y - padding, borderRadius);
            context.closePath();
            context.fill();
        } else {
            // Standard rectangle for squares pattern
            context.fillRect(
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
     * @param {CanvasRenderingContext2D} ctx - Canvas context (optional, defaults to this.ctx)
     */
    drawLogo(image, x, y, maxSize, ctx = null) {
        const context = ctx || this.ctx;
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

        context.drawImage(
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
     * @param {number} maxSizeBytes - Maximum file size in bytes (optional, uses file-type specific defaults)
     * @returns {Object} - Validation result
     */
    validateImageFile(file, maxSizeBytes = null) {
        const errors = [];

        if (!file) {
            errors.push('No file provided');
            return { valid: false, errors };
        }

        // Check file type
        if (!file.type.startsWith('image/')) {
            errors.push('File must be an image');
        }

        // Set size limits based on file type if not explicitly provided
        if (maxSizeBytes === null) {
            if (file.type === 'image/gif') {
                maxSizeBytes = 100 * 1024 * 1024; // 100MB for GIFs (animations can be large)
            } else {
                maxSizeBytes = 5 * 1024 * 1024; // 5MB for other images
            }
        }

        // Check file size
        if (file.size > maxSizeBytes) {
            const maxSizeMB = maxSizeBytes / (1024 * 1024);
            errors.push(`File size must be less than ${maxSizeMB}MB`);
        }

        // Check supported formats
        const supportedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif'];
        if (!supportedFormats.includes(file.type)) {
            errors.push('Unsupported image format. Use PNG, JPEG, SVG, WebP, or GIF');
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

    /**
     * Check if image source is an animated GIF
     * @param {string} src - Image source (data URL or URL)
     * @returns {boolean} - True if GIF
     */
    isGIF(src) {
        return src.startsWith('data:image/gif') || src.toLowerCase().endsWith('.gif');
    }

    /**
     * Parse GIF file and extract frames
     * @param {string} dataURL - GIF data URL
     * @returns {Promise<Array>} - Array of frame objects with {imageData, delay}
     */
    async parseGIF(dataURL) {
        try {
            // Check if gifuct is available
            if (!window.gifuct) {
                throw new Error('gifuct-js library not loaded');
            }

            // Convert data URL to array buffer
            const base64 = dataURL.split(',')[1];
            if (!base64) {
                throw new Error('Invalid data URL format');
            }

            const binaryString = atob(base64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            console.log(`Parsing GIF: ${bytes.length} bytes`);

            // Parse GIF using gifuct-js
            const gif = window.gifuct.parseGIF(bytes.buffer);
            const frames = window.gifuct.decompressFrames(gif, true);

            console.log(`GIF parsed: ${frames.length} frames found`);

            if (!frames || frames.length === 0) {
                throw new Error('No frames found in GIF');
            }

            // Convert frames to ImageData and extract delays
            const processedFrames = [];
            for (const frame of frames) {
                // Create ImageData from frame patch
                const imageData = new ImageData(
                    new Uint8ClampedArray(frame.patch),
                    frame.dims.width,
                    frame.dims.height
                );

                processedFrames.push({
                    imageData: imageData,
                    delay: frame.delay || 100, // Default 100ms if no delay
                    dims: frame.dims
                });
            }

            return processedFrames;
        } catch (error) {
            console.error('Failed to parse GIF:', error);
            console.error('Error details:', error.message);
            throw new Error(`Failed to parse GIF file: ${error.message}`);
        }
    }

    /**
     * Create canvas from ImageData
     * @param {ImageData} imageData - Image data
     * @returns {HTMLCanvasElement} - Canvas with image
     */
    imageDataToCanvas(imageData) {
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    /**
     * Create animated GIF from array of canvases
     * @param {Array<HTMLCanvasElement>} canvases - Array of canvas elements
     * @param {Array<number>} delays - Array of frame delays in ms
     * @param {Function} progressCallback - Optional progress callback
     * @returns {Promise<Blob>} - GIF blob
     */
    async createAnimatedGIF(canvases, delays, progressCallback = null) {
        return new Promise((resolve, reject) => {
            try {
                // Check if GIF library is available
                if (!window.GIF) {
                    reject(new Error('gif.js library not loaded'));
                    return;
                }

                if (!canvases || canvases.length === 0) {
                    reject(new Error('No canvases provided for GIF creation'));
                    return;
                }

                console.log(`Creating animated GIF from ${canvases.length} frames`);

                const gif = new window.GIF({
                    workers: 2,
                    quality: 1, // 1 = best quality, 30 = worst (counterintuitive!)
                    workerScript: 'js/vendor/gif.worker.js',
                    background: '#FFFFFF',
                    transparent: null
                });

                // Add progress listener
                if (progressCallback) {
                    gif.on('progress', (progress) => {
                        progressCallback(progress);
                    });
                }

                // Add frames to GIF
                canvases.forEach((canvas, index) => {
                    gif.addFrame(canvas, {
                        delay: delays[index] || 100,
                        copy: true
                    });
                    console.log(`Added frame ${index + 1}/${canvases.length} with delay ${delays[index]}cs`);
                });

                // Handle completion
                gif.on('finished', (blob) => {
                    console.log('GIF encoding completed successfully');
                    console.log(`GIF blob size: ${blob.size} bytes, type: ${blob.type}`);
                    resolve(blob);
                });

                // Handle errors
                gif.on('error', (error) => {
                    console.error('GIF encoding error:', error);
                    reject(new Error(`GIF encoding failed: ${error}`));
                });

                // Start rendering
                gif.render();
            } catch (error) {
                console.error('Failed to create animated GIF:', error);
                reject(new Error(`Failed to create animated GIF: ${error.message}`));
            }
        });
    }

    /**
     * Convert GIF blob to data URL
     * @param {Blob} blob - GIF blob
     * @returns {Promise<string>} - Data URL
     */
    async blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(new Error(`Failed to convert blob: ${error}`));
            reader.readAsDataURL(blob);
        });
    }
}
