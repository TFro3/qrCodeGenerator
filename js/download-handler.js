/**
 * Download Handler Module
 * Handles downloading QR codes in various formats
 */

class DownloadHandler {
    constructor() {
        this.defaultFilename = 'qrcode';
    }

    /**
     * Download canvas as PNG
     * @param {HTMLCanvasElement} canvas - Canvas to download
     * @param {string} filename - Filename (without extension)
     */
    downloadPNG(canvas, filename = this.defaultFilename) {
        if (!canvas) {
            console.error('No canvas provided for download');
            return;
        }

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Failed to create blob from canvas');
                return;
            }

            this.downloadBlob(blob, `${filename}.png`);
        }, 'image/png', 1.0);
    }

    /**
     * Download canvas as JPEG
     * @param {HTMLCanvasElement} canvas - Canvas to download
     * @param {string} filename - Filename (without extension)
     * @param {number} quality - JPEG quality (0.0 - 1.0)
     */
    downloadJPEG(canvas, filename = this.defaultFilename, quality = 0.95) {
        if (!canvas) {
            console.error('No canvas provided for download');
            return;
        }

        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Failed to create blob from canvas');
                return;
            }

            this.downloadBlob(blob, `${filename}.jpg`);
        }, 'image/jpeg', quality);
    }

    /**
     * Download canvas as SVG
     * Note: This creates a simple SVG with the canvas as an embedded image
     * For true vector SVG, the QR rendering would need to be rewritten
     * @param {HTMLCanvasElement} canvas - Canvas to download
     * @param {string} filename - Filename (without extension)
     */
    downloadSVG(canvas, filename = this.defaultFilename) {
        if (!canvas) {
            console.error('No canvas provided for download');
            return;
        }

        const dataUrl = canvas.toDataURL('image/png');
        const width = canvas.width;
        const height = canvas.height;

        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <image width="${width}" height="${height}" xlink:href="${dataUrl}"/>
</svg>`;

        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        this.downloadBlob(blob, `${filename}.svg`);
    }

    /**
     * Download a blob as a file
     * @param {Blob} blob - Blob to download
     * @param {string} filename - Full filename with extension
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Generate a filename based on current timestamp and text
     * @param {string} text - Text encoded in QR code
     * @returns {string} - Generated filename
     */
    generateFilename(text = '') {
        const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        if (text) {
            // Extract domain from URL or use first few words
            try {
                const url = new URL(text);
                const domain = url.hostname.replace('www.', '');
                return `qrcode-${domain}-${timestamp}`;
            } catch (e) {
                // Not a URL, use first few words
                const words = text.split(/\s+/).slice(0, 3).join('-');
                const sanitized = words.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
                return `qrcode-${sanitized}-${timestamp}`;
            }
        }

        return `qrcode-${timestamp}`;
    }

    /**
     * Copy canvas to clipboard (modern browsers)
     * @param {HTMLCanvasElement} canvas - Canvas to copy
     * @returns {Promise<boolean>} - Success status
     */
    async copyToClipboard(canvas) {
        if (!canvas) {
            console.error('No canvas provided for clipboard');
            return false;
        }

        try {
            // Check if Clipboard API is available
            if (!navigator.clipboard || !navigator.clipboard.write) {
                console.warn('Clipboard API not available');
                return false;
            }

            // Convert canvas to blob
            const blob = await new Promise((resolve) => {
                canvas.toBlob(resolve, 'image/png');
            });

            if (!blob) {
                console.error('Failed to create blob from canvas');
                return false;
            }

            // Write to clipboard
            await navigator.clipboard.write([
                new ClipboardItem({
                    'image/png': blob
                })
            ]);

            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
}
