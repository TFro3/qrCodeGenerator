/**
 * UI Controller Module
 * Handles all user interface interactions and event binding
 */

class UIController {
    constructor() {
        this.elements = {};
        this.state = {
            currentCanvas: null,
            iconPickerOpen: false
        };
    }

    /**
     * Initialize UI controller and cache DOM elements
     */
    init() {
        this.cacheElements();
    }

    /**
     * Cache DOM element references
     */
    cacheElements() {
        // Input controls
        this.elements.qrInput = document.getElementById('qr-input');
        this.elements.sizeSelect = document.getElementById('qr-size');
        this.elements.errorCorrectionSelect = document.getElementById('error-correction');
        this.elements.fgColorInput = document.getElementById('fg-color');
        this.elements.bgColorInput = document.getElementById('bg-color');
        this.elements.transparentBgCheckbox = document.getElementById('transparent-bg');

        // Style buttons
        this.elements.styleButtons = document.querySelectorAll('.style-btn');

        // Logo controls
        this.elements.uploadLogoBtn = document.getElementById('upload-logo-btn');
        this.elements.presetIconsBtn = document.getElementById('preset-icons-btn');
        this.elements.logoUploadInput = document.getElementById('logo-upload');
        this.elements.logoPreview = document.getElementById('logo-preview');
        this.elements.logoPreviewImg = document.getElementById('logo-preview-img');
        this.elements.removeLogoBtn = document.getElementById('remove-logo-btn');
        this.elements.iconPicker = document.getElementById('icon-picker');
        this.elements.presetIconsNotice = document.getElementById('preset-icons-notice');

        // Action buttons
        this.elements.generateBtn = document.getElementById('generate-btn');
        this.elements.downloadBtn = document.getElementById('download-btn');

        // Display elements
        this.elements.canvas = document.getElementById('qr-canvas');
        this.elements.canvasContainer = document.querySelector('.canvas-container');
        this.elements.loadingIndicator = document.getElementById('loading-indicator');
        this.elements.placeholder = document.getElementById('placeholder');
    }

    /**
     * Bind event handlers
     * @param {Object} app - Main application instance
     */
    bindEvents(app) {
        // Generate button
        this.elements.generateBtn.addEventListener('click', () => {
            app.generateQR();
        });

        // Enter key in input field
        this.elements.qrInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                app.generateQR();
            }
        });

        // Real-time updates (debounced)
        let updateTimeout;
        const debouncedUpdate = () => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                if (this.state.currentCanvas) {
                    app.generateQR();
                }
            }, 300);
        };

        this.elements.sizeSelect.addEventListener('change', debouncedUpdate);
        this.elements.errorCorrectionSelect.addEventListener('change', debouncedUpdate);
        this.elements.fgColorInput.addEventListener('input', debouncedUpdate);
        this.elements.bgColorInput.addEventListener('input', debouncedUpdate);

        // Transparent background toggle
        this.elements.transparentBgCheckbox.addEventListener('change', (e) => {
            // Disable background color input when transparent is checked
            this.elements.bgColorInput.disabled = e.target.checked;
            if (this.state.currentCanvas) {
                app.generateQR();
            }
        });

        // Style buttons
        this.elements.styleButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.setActiveStyle(btn.dataset.style);
                if (this.state.currentCanvas) {
                    app.generateQR();
                }
            });
        });

        // Logo upload
        this.elements.uploadLogoBtn.addEventListener('click', () => {
            this.elements.logoUploadInput.click();
        });

        this.elements.logoUploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await app.handleLogoUpload(file);
            }
        });

        // Remove logo
        this.elements.removeLogoBtn.addEventListener('click', () => {
            app.removeLogo();
        });

        // Preset icons
        this.elements.presetIconsBtn.addEventListener('click', () => {
            this.toggleIconPicker();
        });

        // Download button
        this.elements.downloadBtn.addEventListener('click', () => {
            app.downloadQR();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Cmd/Ctrl + S to download
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                if (!this.elements.downloadBtn.disabled) {
                    app.downloadQR();
                }
            }

            // Escape to close icon picker
            if (e.key === 'Escape' && this.state.iconPickerOpen) {
                this.toggleIconPicker();
            }
        });
    }

    /**
     * Set active style button
     * @param {string} style - Style name
     */
    setActiveStyle(style) {
        this.elements.styleButtons.forEach(btn => {
            if (btn.dataset.style === style) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Get current configuration from UI
     * @returns {Object} - Current configuration
     */
    getConfig() {
        const activeStyleBtn = document.querySelector('.style-btn.active');

        return {
            text: this.elements.qrInput.value.trim(),
            size: parseInt(this.elements.sizeSelect.value, 10),
            errorCorrection: this.elements.errorCorrectionSelect.value,
            style: activeStyleBtn ? activeStyleBtn.dataset.style : 'squares',
            foregroundColor: this.elements.fgColorInput.value,
            backgroundColor: this.elements.bgColorInput.value,
            transparentBackground: this.elements.transparentBgCheckbox.checked,
            margin: 4
        };
    }

    /**
     * Display QR code on canvas
     * @param {HTMLCanvasElement} canvas - Canvas with QR code
     */
    displayQR(canvas) {
        if (!canvas) return;

        this.state.currentCanvas = canvas;

        // Hide placeholder, show canvas
        this.elements.placeholder.classList.add('hidden');
        this.elements.canvas.classList.remove('hidden');

        // Copy to display canvas
        const ctx = this.elements.canvas.getContext('2d');
        this.elements.canvas.width = canvas.width;
        this.elements.canvas.height = canvas.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvas, 0, 0);

        // Enable download button
        this.elements.downloadBtn.disabled = false;
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.elements.loadingIndicator.classList.remove('hidden');
        this.elements.generateBtn.disabled = true;
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.elements.loadingIndicator.classList.add('hidden');
        this.elements.generateBtn.disabled = false;
    }

    /**
     * Show logo preview
     * @param {string} logoSrc - Logo image source
     */
    showLogoPreview(logoSrc) {
        this.elements.logoPreviewImg.src = logoSrc;
        this.elements.logoPreview.classList.remove('hidden');
    }

    /**
     * Hide logo preview
     */
    hideLogoPreview() {
        this.elements.logoPreview.classList.add('hidden');
        this.elements.logoPreviewImg.src = '';
    }

    /**
     * Toggle icon picker visibility
     */
    toggleIconPicker() {
        if (this.state.iconPickerOpen) {
            this.elements.iconPicker.classList.add('hidden');
            this.state.iconPickerOpen = false;
        } else {
            this.elements.iconPicker.classList.remove('hidden');
            this.state.iconPickerOpen = true;
        }
    }

    /**
     * Populate icon picker with preset icons
     * @param {Object} manifest - Icon manifest data
     * @param {Function} onIconSelect - Callback when icon is selected
     */
    populateIconPicker(manifest, onIconSelect) {
        this.elements.iconPicker.innerHTML = '';

        if (!manifest || !manifest.categories) {
            console.error('Invalid icon manifest');
            return;
        }

        manifest.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'icon-category';

            const categoryTitle = document.createElement('h3');
            categoryTitle.className = 'icon-category-title';
            categoryTitle.textContent = category.name;

            const iconGrid = document.createElement('div');
            iconGrid.className = 'icon-grid';

            category.icons.forEach(icon => {
                const iconItem = document.createElement('button');
                iconItem.className = 'icon-item';
                iconItem.setAttribute('aria-label', icon.name);
                iconItem.dataset.iconPath = icon.file;

                // Load icon (assuming SVG or image)
                const iconImg = document.createElement('img');
                iconImg.src = `assets/icons/${icon.file}`;
                iconImg.alt = icon.name;

                iconItem.appendChild(iconImg);

                iconItem.addEventListener('click', () => {
                    // Remove selected class from all icons
                    document.querySelectorAll('.icon-item').forEach(item => {
                        item.classList.remove('selected');
                    });

                    // Add selected class to clicked icon
                    iconItem.classList.add('selected');

                    // Call callback with icon path
                    if (onIconSelect) {
                        onIconSelect(`assets/icons/${icon.file}`);
                    }
                });

                iconGrid.appendChild(iconItem);
            });

            categoryDiv.appendChild(categoryTitle);
            categoryDiv.appendChild(iconGrid);
            this.elements.iconPicker.appendChild(categoryDiv);
        });
    }

    /**
     * Disable preset icons button when icons can't be loaded
     * @param {string} reason - Reason why icons are unavailable
     */
    disablePresetIcons(reason) {
        if (this.elements.presetIconsBtn) {
            this.elements.presetIconsBtn.disabled = true;
            this.elements.presetIconsBtn.title = reason;
            this.elements.presetIconsBtn.style.opacity = '0.5';
            this.elements.presetIconsBtn.style.cursor = 'not-allowed';

            // Show helper text notice
            if (this.elements.presetIconsNotice) {
                this.elements.presetIconsNotice.classList.remove('hidden');
            }

            console.log('Preset icons disabled:', reason);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Simple alert for now - can be enhanced with custom modal
        alert(`Error: ${message}`);
    }

    /**
     * Show success message
     * @param {string} message - Success message
     */
    showSuccess(message) {
        // Simple alert for now - can be enhanced with toast notification
        console.log(`Success: ${message}`);
    }

    /**
     * Validate input
     * @returns {Object} - Validation result
     */
    validateInput() {
        const text = this.elements.qrInput.value.trim();

        if (!text) {
            return {
                valid: false,
                error: 'Please enter a URL or text to generate a QR code'
            };
        }

        if (text.length > 2953) {
            return {
                valid: false,
                error: 'Text is too long. Maximum 2953 characters for QR codes.'
            };
        }

        return { valid: true };
    }
}
