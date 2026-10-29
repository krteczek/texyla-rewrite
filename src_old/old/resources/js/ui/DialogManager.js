// src/ui/DialogManager.js

import EventBus from '../core/EventBus.js';

/**
 * @class DialogManager
 * @description Správce dialogových oken pro Texylu
 * @property {Texyla} editor - Reference na hlavní editor
 * @property {Map} dialogs - Registry dostupných dialogů
 * @property {HTMLElement|null} overlay - Overlay pro modální dialog
 * @property {HTMLElement|null} currentDialog - Aktuálně otevřený dialog
 */
export class DialogManager {
    /**
     * Vytvoří nový DialogManager
     * @param {Texyla} editor - Instance Texyla editoru
     */
    constructor(editor) {
        /** @type {Texyla} */
        this.editor = editor;
        
        /** @type {Map<string, Object>} */
        this.dialogs = new Map();
        
        /** @type {HTMLElement|null} */
        this.overlay = null;
        
        /** @type {HTMLElement|null} */
        this.currentDialog = null;
        
        /** @type {EventBus} */
        this.events = new EventBus();
        
        // Načíst core dialogy podle TexylaConfigFactory
        this._registerCoreDialogs();
        
        console.log(`DialogManager initialized for editor ${editor.id}`);
    }
    
    /**
     * Registruje nový typ dialogu
     * @param {string} type - Typ dialogu (link, image, heading, code-block)
     * @param {Object} config - Konfigurace dialogu
     * @param {string} config.title - Titulek dialogu
     * @param {Function} config.template - Funkce vracející HTML šablonu
     * @param {Function} config.onSubmit - Callback při odeslání (vrací Texy! syntax)
     * @param {Function} [config.onOpen] - Callback při otevření
     * @param {Function} [config.onClose] - Callback při zavření
     * @param {Object} [config.defaults] - Výchozí hodnoty polí
     */
    register(type, config) {
        if (this.dialogs.has(type)) {
            console.warn(`Dialog type '${type}' already registered, overwriting`);
        }
        
        const dialogConfig = {
            title: config.title || type,
            template: config.template,
            onSubmit: config.onSubmit,
            onOpen: config.onOpen || (() => {}),
            onClose: config.onClose || (() => {}),
            defaults: config.defaults || {}
        };
        
        this.dialogs.set(type, dialogConfig);
        this.events.emit('dialog-registered', { type, config: dialogConfig });
        
        console.log(`Dialog registered: ${type}`);
    }
    
    /**
     * Registruje core dialogy podle TexylaConfigFactory
     * @private
     */
    _registerCoreDialogs() {
        // ============================================
        // DIALOG: LINK
        // ============================================
        this.register('link', {
            title: 'Vložit odkaz',
            template: (defaults = {}) => `
                <form class="texyla-dialog__form" id="dialog-link-form">
                    <div class="texyla-dialog__field">
                        <label for="dialog-link-text" class="texyla-dialog__label">
                            Text odkazu
                        </label>
                        <input type="text" 
                               id="dialog-link-text" 
                               name="text" 
                               class="texyla-dialog__input"
                               placeholder="Klikněte zde"
                               value="${this._escapeHtml(defaults.text || '')}"
                               autocomplete="off">
                    </div>
                    
                    <div class="texyla-dialog__field">
                        <label for="dialog-link-url" class="texyla-dialog__label">
                            URL adresa
                        </label>
                        <input type="url" 
                               id="dialog-link-url" 
                               name="url" 
                               class="texyla-dialog__input"
                               placeholder="https://example.com"
                               value="${this._escapeHtml(defaults.url || '')}"
                               required
                               autocomplete="off">
                        <div class="texyla-dialog__hint">
                            Musí začínat http://, https://, mailto: nebo //
                        </div>
                    </div>
                    
                    <div class="texyla-dialog__field">
                        <label for="dialog-link-title" class="texyla-dialog__label">
                            Titulek (volitelně)
                        </label>
                        <input type="text" 
                               id="dialog-link-title" 
                               name="title" 
                               class="texyla-dialog__input"
                               placeholder="Popisek při najetí myší"
                               value="${this._escapeHtml(defaults.title || '')}"
                               autocomplete="off">
                    </div>
                    
                    <div class="texyla-dialog__actions">
                        <button type="button" 
                                class="texyla-dialog__button texyla-dialog__button--cancel">
                            Zrušit
                        </button>
                        <button type="submit" 
                                class="texyla-dialog__button texyla-dialog__button--submit">
                            Vložit odkaz
                        </button>
                    </div>
                </form>
            `,
            onSubmit: (data) => {
                // Texy! syntax: [text](url "title")
                const title = data.title ? ` "${this._escapeTexyAttribute(data.title)}"` : '';
                return `[${data.text || data.url}](${data.url}${title})`;
            },
            defaults: {}
        });
        
        // ============================================
        // DIALOG: IMAGE (KOMPLETNÍ IMPLEMENTACE)
        // ============================================
        this.register('image', {
            title: 'Vložit obrázek',
            template: (defaults = {}) => `
                <form class="texyla-dialog__form" id="dialog-image-form">
                    <div class="texyla-dialog__field">
                        <label for="dialog-image-url" class="texyla-dialog__label">
                            URL obrázku
                        </label>
                        <input type="url" 
                               id="dialog-image-url" 
                               name="url" 
                               class="texyla-dialog__input"
                               placeholder="https://example.com/image.jpg"
                               value="${this._escapeHtml(defaults.url || '')}"
                               required
                               autocomplete="off">
                        <div class="texyla-dialog__hint">
                            Podporuje: JPG, PNG, GIF, SVG, WebP
                        </div>
                    </div>
                    
                    <div class="texyla-dialog__field">
                        <label for="dialog-image-alt" class="texyla-dialog__label">
                            Alternativní text *
                        </label>
                        <input type="text" 
                               id="dialog-image-alt" 
                               name="alt" 
                               class="texyla-dialog__input"
                               placeholder="Popis obrázku"
                               value="${this._escapeHtml(defaults.alt || '')}"
                               required
                               autocomplete="off">
                        <div class="texyla-dialog__hint">
                            Povinné pro přístupnost a SEO
                        </div>
                    </div>
                    
                    <div class="texyla-dialog__field">
                        <label for="dialog-image-title" class="texyla-dialog__label">
                            Titulek (volitelně)
                        </label>
                        <input type="text" 
                               id="dialog-image-title" 
                               name="title" 
                               class="texyla-dialog__input"
                               placeholder="Popisek při najetí myší"
                               value="${this._escapeHtml(defaults.title || '')}"
                               autocomplete="off">
                    </div>
                    
                    <div class="texyla-dialog__field">
                        <label for="dialog-image-align" class="texyla-dialog__label">
                            Zarovnání
                        </label>
                        <select id="dialog-image-align" 
                                name="align" 
                                class="texyla-dialog__select">
                            <option value="">Výchozí</option>
                            <option value="left" ${defaults.align === 'left' ? 'selected' : ''}>Vlevo</option>
                            <option value="right" ${defaults.align === 'right' ? 'selected' : ''}>Vpravo</option>
                            <option value="center" ${defaults.align === 'center' ? 'selected' : ''}>Na střed</option>
                        </select>
                    </div>
                    
                    <div class="texyla-dialog__field texyla-dialog__field--inline">
                        <label class="texyla-dialog__checkbox">
                            <input type="checkbox" 
                                   name="linked" 
                                   id="dialog-image-linked"
                                   ${defaults.linked ? 'checked' : ''}>
                            Obrázek jako odkaz
                        </label>
                    </div>
                    
                    <div class="texyla-dialog__field texyla-dialog__field--inline">
                        <label class="texyla-dialog__checkbox">
                            <input type="checkbox" 
                                   name="figure" 
                                   id="dialog-image-figure"
                                   ${defaults.figure ? 'checked' : ''}>
                            Obrázek s popiskou (figure)
                        </label>
                    </div>
                    
                    <div class="texyla-dialog__actions">
                        <button type="button" 
                                class="texyla-dialog__button texyla-dialog__button--cancel">
                            Zrušit
                        </button>
                        <button type="submit" 
                                class="texyla-dialog__button texyla-dialog__button--submit">
                            Vložit obrázek
                        </button>
                    </div>
                    
                    <div class="texyla-dialog__preview" id="image-preview-container" style="display: none;">
                        <div class="texyla-dialog__preview-title">Náhled:</div>
                        <div class="texyla-dialog__preview-image" id="image-preview">
                            <!-- Náhled se načte dynamicky -->
                        </div>
                    </div>
                </form>
            `,
            onSubmit: (data) => {
                // Texy! syntax pro obrázky
                let syntax = '';
                
                if (data.figure) {
                    // Figure s popiskou: [* alt *] url "title"
                    syntax = '[* ';
                } else if (data.linked) {
                    // Obrázek jako odkaz: [* alt *](url "title")
                    syntax = '[* ';
                } else {
                    // Normální obrázek: [alt](url "title")
                    syntax = '[';
                }
                
                // Přidat alt text
                syntax += data.alt;
                
                // Uzavřít první část
                if (data.figure || data.linked) {
                    syntax += ' *]';
                } else {
                    syntax += ']';
                }
                
                // Přidat URL a title
                const title = data.title ? ` "${this._escapeTexyAttribute(data.title)}"` : '';
                syntax += `(${data.url}${title})`;
                
                // Přidat zarovnání pokud je specifikováno
                if (data.align) {
                    syntax += ` .${data.align}`;
                }
                
                return syntax;
            },
            onOpen: (defaults) => {
                // Po otevření dialogu nastavit live preview
                setTimeout(() => {
                    const urlInput = document.getElementById('dialog-image-url');
                    const previewContainer = document.getElementById('image-preview-container');
                    const previewImage = document.getElementById('image-preview');
                    
                    if (urlInput && previewContainer && previewImage) {
                        const updatePreview = () => {
                            const url = urlInput.value.trim();
                            
                            if (url && this._isValidImageUrl(url)) {
                                previewImage.innerHTML = `
                                    <img src="${this._escapeHtml(url)}" 
                                         alt="Náhled obrázku" 
                                         style="max-width: 100%; max-height: 200px; border-radius: 4px;">
                                    <div class="texyla-dialog__preview-url">${this._escapeHtml(url)}</div>
                                `;
                                previewContainer.style.display = 'block';
                            } else {
                                previewContainer.style.display = 'none';
                            }
                        };
                        
                        urlInput.addEventListener('input', updatePreview);
                        urlInput.addEventListener('change', updatePreview);
                        
                        // Initial update
                        updatePreview();
                    }
                }, 100);
            },
            defaults: {}
        });
        
        // ============================================
        // DIALOG: HEADING
        // ============================================
        this.register('heading', {
            title: 'Vložit nadpis',
            template: (defaults = {}) => `
                <form class="texyla-dialog__form" id="dialog-heading-form">
                    <div class="texyla-dialog__field">
                        <label for="dialog-heading-text" class="texyla-dialog__label">
                            Text nadpisu *
                        </label>
                        <input type="text" 
                               id="dialog-heading-text" 
                               name="text" 
                               class="texyla-dialog__input"
                               placeholder="Název kapitoly"
                               value="${this._escapeHtml(defaults.text || '')}"
                               required
                               autocomplete="off">
                    </div>
                    
                    <div class="texyla-dialog__field">
                        <label for="dialog-heading-level" class="texyla-dialog__label">
                            Úroveň nadpisu
                        </label>
                        <div class="texyla-dialog__radio-group">
                            ${[1, 2, 3, 4, 5, 6].map(level => `
                                <label class="texyla-dialog__radio">
                                    <input type="radio" 
                                           name="level" 
                                           value="${level}"
                                           ${defaults.level === level ? 'checked' : ''}
                                           ${level === (defaults.level || 3) ? 'checked' : ''}>
                                    <span class="texyla-dialog__radio-label">
                                        H${level}
                                    </span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="texyla-dialog__hint">
                            H1 pouze pro hlavní nadpis stránky (použijte 1×)
                        </div>
                    </div>
                    
                    <div class="texyla-dialog__actions">
                        <button type="button" 
                                class="texyla-dialog__button texyla-dialog__button--cancel">
                            Zrušit
                        </button>
                        <button type="submit" 
                                class="texyla-dialog__button texyla-dialog__button--submit">
                            Vložit nadpis
                        </button>
                    </div>
                </form>
            `,
            onSubmit: (data) => {
                // Texy! syntax: ### Nadpis
                const hashes = '#'.repeat(data.level || 3);
                return `${hashes} ${data.text}`;
            },
            defaults: { level: 3 }
        });
        
        // ============================================
        // DIALOG: CODE-BLOCK
        // ============================================
        this.register('code-block', {
            title: 'Blok kódu',
            template: (defaults = {}) => `
                <form class="texyla-dialog__form" id="dialog-code-form">
                    <div class="texyla-dialog__field">
                        <label for="dialog-code-language" class="texyla-dialog__label">
                            Programovací jazyk
                        </label>
                        <select id="dialog-code-language" 
                                name="language" 
                                class="texyla-dialog__select">
                            <option value="">žádný (plain text)</option>
                            ${['php', 'javascript', 'html', 'css', 'python', 'sql', 'bash', 'json', 'xml', 'yaml', 'twig', 'latte']
                                .map(lang => `
                                    <option value="${lang}" 
                                            ${defaults.language === lang ? 'selected' : ''}>
                                        ${lang}
                                    </option>
                                `).join('')}
                        </select>
                        <div class="texyla-dialog__hint">
                            Určuje zvýraznění syntaxe v náhledu
                        </div>
                    </div>
                    
                    <div class="texyla-dialog__field">
                        <label for="dialog-code-content" class="texyla-dialog__label">
                            Kód *
                        </label>
                        <textarea id="dialog-code-content" 
                                  name="content" 
                                  class="texyla-dialog__textarea"
                                  rows="8"
                                  placeholder="// Vložte svůj kód zde"
                                  required
                                  autocomplete="off">${this._escapeHtml(defaults.content || '')}</textarea>
                        <div class="texyla-dialog__hint">
                            Pro vložení existujícího kódu, vyberte jej před otevřením dialogu
                        </div>
                    </div>
                    
                    <div class="texyla-dialog__field texyla-dialog__field--inline">
                        <label class="texyla-dialog__checkbox">
                            <input type="checkbox" 
                                   name="lineNumbers" 
                                   id="dialog-code-line-numbers"
                                   ${defaults.lineNumbers ? 'checked' : ''}>
                            Zobrazit čísla řádků
                        </label>
                    </div>
                    
                    <div class="texyla-dialog__actions">
                        <button type="button" 
                                class="texyla-dialog__button texyla-dialog__button--cancel">
                            Zrušit
                        </button>
                        <button type="submit" 
                                class="texyla-dialog__button texyla-dialog__button--submit">
                            Vložit blok kódu
                        </button>
                    </div>
                </form>
            `,
            onSubmit: (data) => {
                // Texy! syntax: /--code php\nkod\n\--
                const lang = data.language ? ` ${data.language}` : '';
                const lineNumbers = data.lineNumbers ? ' linenumbers' : '';
                return `/--code${lang}${lineNumbers}\n${data.content}\n\\--`;
            },
            defaults: { language: '', lineNumbers: false }
        });
    }
    
    /**
     * Otevře dialog daného typu
     * @param {string} type - Typ dialogu (link, image, heading, code-block)
     * @param {Object} [defaults={}] - Výchozí hodnoty pro formulář
     * @returns {boolean} Úspěch otevření
     */
    open(type, defaults = {}) {
        // Zavřít předchozí dialog pokud je otevřený
        if (this.currentDialog) {
            this.close();
        }
        
        // Kontrola existence dialogu
        if (!this.dialogs.has(type)) {
            console.error(`Dialog type '${type}' not registered`);
            this.events.emit('dialog-error', {
                type,
                error: `Dialog type '${type}' not found`
            });
            return false;
        }
        
        const dialogConfig = this.dialogs.get(type);
        
        // Emitovat před otevřením
        this.events.emit('dialog-before-open', { type, config: dialogConfig });
        
        try {
            // Vytvořit overlay
            this._createOverlay();
            
            // Vytvořit dialog
            this.currentDialog = this._createDialog(type, dialogConfig, defaults);
            
            // Přidat do DOM
            document.body.appendChild(this.currentDialog);
            
            // Callback onOpen
            if (dialogConfig.onOpen) {
                dialogConfig.onOpen(defaults);
            }
            
            // Nastavit focus na první input
            this._focusFirstInput();
            
            // Emitovat po otevření
            this.events.emit('dialog-opened', { type, dialog: this.currentDialog });
            
            console.log(`Dialog opened: ${type}`);
            return true;
            
        } catch (error) {
            console.error(`Failed to open dialog ${type}:`, error);
            this.events.emit('dialog-error', { type, error: error.message });
            return false;
        }
    }
    
    /**
     * Vytvoří overlay pro modální dialog
     * @private
     */
    _createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'texyla-dialog-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            animation: texyla-dialog-fade-in 0.2s ease;
        `;
        
        // Kliknutí na overlay zavře dialog
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.close();
            }
        });
        
        document.body.appendChild(this.overlay);
        
        // Zablokovat scroll na pozadí
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Vytvoří dialog element
     * @private
     * @param {string} type - Typ dialogu
     * @param {Object} config - Konfigurace dialogu
     * @param {Object} defaults - Výchozí hodnoty
     * @returns {HTMLElement}
     */
    _createDialog(type, config, defaults) {
        const dialog = document.createElement('div');
        dialog.className = 'texyla-dialog';
        dialog.dataset.dialogType = type;
        
        // Výchozí hodnoty: kombinace config defaults a provided defaults
        const mergedDefaults = { ...config.defaults, ...defaults };
        
        dialog.innerHTML = `
            <div class="texyla-dialog__container">
                <div class="texyla-dialog__header">
                    <h3 class="texyla-dialog__title">${this._escapeHtml(config.title)}</h3>
                    <button type="button" 
                            class="texyla-dialog__close"
                            aria-label="Zavřít">
                        ×
                    </button>
                </div>
                
                <div class="texyla-dialog__body">
                    ${config.template(mergedDefaults)}
                </div>
                
                <div class="texyla-dialog__footer">
                    <div class="texyla-dialog__hint">
                        <kbd>Esc</kbd> zavře, <kbd>Enter</kbd> potvrdí formulář
                    </div>
                </div>
            </div>
        `;
        
        // Event listeners
        const closeBtn = dialog.querySelector('.texyla-dialog__close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        const cancelBtn = dialog.querySelector('.texyla-dialog__button--cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
        
        const form = dialog.querySelector('.texyla-dialog__form');
        if (form) {
            form.addEventListener('submit', (e) => this._handleSubmit(e, type, config));
        }
        
        // Klávesové zkratky
        dialog.addEventListener('keydown', (e) => this._handleKeydown(e, type));
        
        return dialog;
    }
    
    /**
     * Zpracuje odeslání formuláře
     * @private
     * @param {Event} e - Submit event
     * @param {string} type - Typ dialogu
     * @param {Object} config - Konfigurace dialogu
     */
    _handleSubmit(e, type, config) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Zpracovat checkboxy
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            data[checkbox.name] = checkbox.checked;
        });
        
        // Validace
        if (!this._validateForm(type, data)) {
            return;
        }
        
        // Generovat Texy! syntax
        const syntax = config.onSubmit(data);
        
        // Vložit do editoru
        this.editor.insert(syntax);
        
        // Zavřít dialog
        this.close();
        
        // Emitovat event
        this.events.emit('dialog-submitted', {
            type,
            data,
            syntax
        });
        
        console.log(`Dialog submitted (${type}):`, data);
    }
    
    /**
     * Validuje data formuláře
     * @private
     * @param {string} type - Typ dialogu
     * @param {Object} data - Form data
     * @returns {boolean} Validity
     */
    _validateForm(type, data) {
        switch (type) {
            case 'link':
                if (!data.url?.trim()) {
                    this._showValidationError('URL je povinné pole');
                    return false;
                }
                if (!this._isValidUrl(data.url)) {
                    this._showValidationError('Neplatná URL adresa');
                    return false;
                }
                break;
                
            case 'image':
                if (!data.url?.trim()) {
                    this._showValidationError('URL obrázku je povinné');
                    return false;
                }
                if (!this._isValidImageUrl(data.url)) {
                    this._showValidationError('Neplatná URL obrázku');
                    return false;
                }
                if (!data.alt?.trim()) {
                    this._showValidationError('Alternativní text je povinný pro obrázky');
                    return false;
                }
                break;
                
            case 'heading':
                if (!data.text?.trim()) {
                    this._showValidationError('Text nadpisu je povinný');
                    return false;
                }
                break;
                
            case 'code-block':
                if (!data.content?.trim()) {
                    this._showValidationError('Obsah kódu je povinný');
                    return false;
                }
                break;
        }
        
        return true;
    }
    
    /**
     * Zobrazí chybu validace
     * @private
     * @param {string} message - Chybová zpráva
     */
    _showValidationError(message) {
        if (!this.currentDialog) return;
        
        // Odstranit předchozí chyby
        const existingError = this.currentDialog.querySelector('.texyla-dialog__error');
        if (existingError) {
            existingError.remove();
        }
        
        // Vytvořit novou chybu
        const errorEl = document.createElement('div');
        errorEl.className = 'texyla-dialog__error';
        errorEl.innerHTML = `
            <span class="texyla-dialog__error-icon">⚠️</span>
            <span class="texyla-dialog__error-text">${this._escapeHtml(message)}</span>
        `;
        
        const body = this.currentDialog.querySelector('.texyla-dialog__body');
        if (body) {
            body.insertBefore(errorEl, body.firstChild);
            
            // Animace
            errorEl.style.animation = 'texyla-dialog-shake 0.5s ease';
            setTimeout(() => {
                errorEl.style.animation = '';
            }, 500);
        }
    }
    
    /**
     * Zpracuje klávesové zkratky
     * @private
     * @param {KeyboardEvent} e - Keydown event
     * @param {string} type - Typ dialogu
     */
    _handleKeydown(e, type) {
        // ESC - zavřít dialog
        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            return;
        }
        
        // Enter v inputu (kromě textarea) - submit
        if (e.key === 'Enter' && !e.shiftKey) {
            const target = e.target;
            if (target.tagName !== 'TEXTAREA') {
                const form = this.currentDialog?.querySelector('.texyla-dialog__form');
                if (form) {
                    e.preventDefault();
                    form.requestSubmit();
                }
            }
        }
    }
    
    /**
     * Nastaví focus na první input v dialogu
     * @private
     */
    _focusFirstInput() {
        if (!this.currentDialog) return;
        
        const firstInput = this.currentDialog.querySelector(
            'input:not([type="hidden"]):not([disabled]), ' +
            'textarea:not([disabled]), ' +
            'select:not([disabled]), ' +
            'button:not([disabled])'
        );
        
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
    
    /**
     * Zavře aktuálně otevřený dialog
     * @returns {boolean} Úspěch zavření
     */
    close() {
        if (!this.currentDialog) return false;
        
        const type = this.currentDialog.dataset.dialogType;
        const config = type ? this.dialogs.get(type) : null;
        
        // Callback onClose
        if (config && config.onClose) {
            config.onClose();
        }
        
        // Odebrat z DOM
        this.currentDialog.remove();
        this.currentDialog = null;
        
        // Odebrat overlay
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        // Odblokovat scroll
        document.body.style.overflow = '';
        
        // Emitovat event
        this.events.emit('dialog-closed', { type });
        
        // Vrátit focus do editoru
        if (this.editor.textarea) {
            setTimeout(() => this.editor.textarea.focus(), 50);
        }
        
        console.log(`Dialog closed: ${type || 'unknown'}`);
        return true;
    }
    
    /* ============================================
       UTILITY METHODS
       ============================================ */
    
    /**
     * Escapuje HTML pro bezpečné vložení do template
     * @private
     * @param {string} str - String k escapování
     * @returns {string} Escapovaný string
     */
    _escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    /**
     * Escapuje atributy pro Texy! syntax
     * @private
     * @param {string} str - String k escapování
     * @returns {string} Escapovaný string
     */
    _escapeTexyAttribute(str) {
        // Escapovat uvozovky pro Texy! atributy
        return str.replace(/"/g, '&quot;');
    }
    
    /**
     * Validuje URL
     * @private
     * @param {string} url - URL k validaci
     * @returns {boolean} Validity
     */
    _isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:', 'mailto:', 'ftp:'].includes(urlObj.protocol) || url.startsWith('//');
        } catch {
            return false;
        }
    }
    
    /**
     * Validuje URL obrázku
     * @private
     * @param {string} url - URL k validaci
     * @returns {boolean} Validity
     */
    _isValidImageUrl(url) {
        if (!this._isValidUrl(url)) return false;
        
        // Kontrola image extensions
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'];
        const lowerUrl = url.toLowerCase();
        return imageExtensions.some(ext => lowerUrl.includes(ext));
    }
    
    /**
     * Vrátí seznam registrovaných dialogů
     * @returns {Array} Seznam typů dialogů
     */
    getAvailableDialogs() {
        return Array.from(this.dialogs.keys());
    }
    
    /**
     * Zkontroluje zda je dialog daného typu dostupný
     * @param {string} type - Typ dialogu
     * @returns {boolean} Dostupnost
     */
    hasDialog(type) {
        return this.dialogs.has(type);
    }
    
    /**
     * Zničí DialogManager a uklidí
     */
    destroy() {
        this.close();
        this.dialogs.clear();
        this.events.emit('destroyed');
    }
}

export default DialogManager;