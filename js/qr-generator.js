/**
 * QR Code Generator Module
 * Handles QR code generation with different pattern styles
 */

class QRGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Generate QR code with specified options
     * @param {Object} options - QR generation options
     * @param {string} options.text - Text to encode
     * @param {number} options.size - Canvas size in pixels
     * @param {string} options.errorCorrection - Error correction level (L, M, Q, H)
     * @param {string} options.style - Pattern style (squares, dots, rounded)
     * @param {string} options.foregroundColor - QR code color
     * @param {string} options.backgroundColor - Background color
     * @param {boolean} options.transparentBackground - Use transparent background
     * @param {number} options.margin - Quiet zone modules
     * @returns {HTMLCanvasElement} - Canvas with QR code
     */
    generate(options) {
        const {
            text,
            size = 512,
            errorCorrection = 'H',
            style = 'squares',
            foregroundColor = '#000000',
            backgroundColor = '#ffffff',
            transparentBackground = false,
            margin = 4
        } = options;

        if (!text) {
            throw new Error('Text is required to generate QR code');
        }

        // Calculate appropriate type number based on text length
        const typeNumber = this.calculateTypeNumber(text, errorCorrection);

        // Create QR code using qrcode-generator library
        const qr = qrcode(typeNumber, errorCorrection);
        qr.addData(text);
        qr.make();

        // Render QR code to canvas with selected style
        return this.renderToCanvas(qr, {
            size,
            style,
            foregroundColor,
            backgroundColor,
            transparentBackground,
            margin
        });
    }

    /**
     * Calculate optimal type number for QR code
     * @param {string} text - Text to encode
     * @param {string} errorCorrection - Error correction level
     * @returns {number} - QR code type number
     */
    calculateTypeNumber(text, errorCorrection) {
        // Start with type 1 and increase until text fits
        for (let typeNumber = 1; typeNumber <= 40; typeNumber++) {
            try {
                const qr = qrcode(typeNumber, errorCorrection);
                qr.addData(text);
                qr.make();
                return typeNumber;
            } catch (e) {
                // Text doesn't fit, try next type number
                continue;
            }
        }
        // Default to type 10 if calculation fails
        return 10;
    }

    /**
     * Render QR code to canvas
     * @param {Object} qr - QR code object from qrcode-generator
     * @param {Object} options - Rendering options
     * @returns {HTMLCanvasElement} - Canvas with rendered QR code
     */
    renderToCanvas(qr, options) {
        const { size, style, foregroundColor, backgroundColor, transparentBackground, margin } = options;
        const moduleCount = qr.getModuleCount();
        const totalModules = moduleCount + (margin * 2);
        const cellSize = size / totalModules;

        // Set canvas size
        this.canvas.width = size;
        this.canvas.height = size;

        // Clear canvas (creates transparency)
        this.ctx.clearRect(0, 0, size, size);

        // Fill background (only if not transparent)
        if (!transparentBackground) {
            this.ctx.fillStyle = backgroundColor;
            this.ctx.fillRect(0, 0, size, size);
        }

        // Set foreground color
        this.ctx.fillStyle = foregroundColor;

        // Render based on selected style
        switch (style) {
            case 'dots':
                this.renderDots(qr, cellSize, margin);
                break;
            case 'rounded':
                this.renderRounded(qr, cellSize, margin);
                break;
            case 'squares':
            default:
                this.renderSquares(qr, cellSize, margin);
                break;
        }

        return this.canvas;
    }

    /**
     * Render QR code with square pattern (default)
     * @param {Object} qr - QR code object
     * @param {number} cellSize - Size of each module
     * @param {number} margin - Quiet zone margin
     */
    renderSquares(qr, cellSize, margin) {
        const moduleCount = qr.getModuleCount();

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const x = (col + margin) * cellSize;
                    const y = (row + margin) * cellSize;
                    this.ctx.fillRect(x, y, cellSize, cellSize);
                }
            }
        }
    }

    /**
     * Render QR code with dot pattern
     * @param {Object} qr - QR code object
     * @param {number} cellSize - Size of each module
     * @param {number} margin - Quiet zone margin
     */
    renderDots(qr, cellSize, margin) {
        const moduleCount = qr.getModuleCount();
        const radius = (cellSize * 0.45); // 90% of half cell size for slight spacing

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const centerX = (col + margin + 0.5) * cellSize;
                    const centerY = (row + margin + 0.5) * cellSize;

                    this.ctx.beginPath();
                    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    }

    /**
     * Render QR code with rounded pattern
     * @param {Object} qr - QR code object
     * @param {number} cellSize - Size of each module
     * @param {number} margin - Quiet zone margin
     */
    renderRounded(qr, cellSize, margin) {
        const moduleCount = qr.getModuleCount();
        const borderRadius = cellSize * 0.3; // 30% of cell size

        for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
                if (qr.isDark(row, col)) {
                    const x = (col + margin) * cellSize;
                    const y = (row + margin) * cellSize;

                    // Draw rounded rectangle
                    this.drawRoundedRect(x, y, cellSize, cellSize, borderRadius);
                }
            }
        }
    }

    /**
     * Draw a rounded rectangle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Rectangle width
     * @param {number} height - Rectangle height
     * @param {number} radius - Border radius
     */
    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.arcTo(x + width, y, x + width, y + radius, radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.arcTo(x, y + height, x, y + height - radius, radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.arcTo(x, y, x + radius, y, radius);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Get the current canvas
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }
}
