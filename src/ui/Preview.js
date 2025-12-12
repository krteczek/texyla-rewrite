// src/ui/Preview.js

import EventBus from '../core/EventBus.js';

/**
 * @class Preview
 * @description Komponenta pro live preview Texy! syntaxe
 * @property {Texyla} editor - Reference na hlavní editor
 * @property {HTMLElement|null} element - DOM element preview kontejneru
 * @property {boolean} isVisible - Stav viditelnosti preview
 * @property {string|null} endpoint - URL endpointu pro generování náhledu
 * @property {number|null} debounceTimer - Timer pro debounce
 * @property {boolean} isLoading - Indikátor načítání
 * @property {string} lastContent - Poslední zpracovaný obsah (pro cache)
 */
export class Preview {
    /**
     * Vytvoří novou Preview instanci
     * @param {Texyla} editor - Instance Texyla editoru
     */
    constructor(editor) {
        /** @type {Texyla} */
        this.editor = editor;
        
        /** @type {HTMLElement|null} */
        this.element = null;
        
        /** @type {boolean} */
        this.isVisible = false;
        
        /** @type {string|null} */
        this.endpoint = null;
        
        /** @type {number|null} */
        this.debounceTimer = null;
        
        /** @type {boolean} */
        this.isLoading = false;
        
        /** @type {string} */
        this.lastContent = '';
        
        /** @type {EventBus} */
        this.events = new EventBus();
        
        // Default endpoint z konfigurace nebo fallback
        this.endpoint = this.editor.config.get('previewEndpoint') || 
                       '/src/TexylaController.php';
        
        console.log(`Preview: Using endpoint ${this.endpoint}`);
    }
    
    /**
     * Inicializuje preview komponentu
     * @returns {Promise<Preview>}
     */
    async initialize() {
        try {
            // Vytvořit DOM element
            this.element = this._createElement();
            
            // Připojit k editoru
            this._attachToEditor();
            
            // Nastavit event listeners
            this._setupEventListeners();
            
            // Auto-preview pokud je povoleno
            if (this.editor.config.get('autoPreview', false)) {
                this._setupAutoPreview();
            }
            
            // Schovat preview výchozí (toggle přes tlačítko/klávesu)
            this.setVisible(this.editor.config.get('showPreview', false));
            
            this.events.emit('initialized', { preview: this });
            console.log(`Preview initialized for editor ${this.editor.id}`);
            
            return this;
            
        } catch (error) {
            console.error('Preview initialization failed:', error);
            throw new Error(`Preview init failed: ${error.message}`);
        }
    }
    
    /**
     * Vytvoří DOM element pro preview
     * @private
     * @returns {HTMLElement}
     */
    _createElement() {
        const container = document.createElement('div');
        container.className = 'texyla-preview';
        container.setAttribute('role', 'region');
        container.setAttribute('aria-label', 'Náhled formátovaného textu');
        
        // Header s ovládacími prvky
        const header = document.createElement('div');
        header.className = 'texyla-preview__header';
        header.innerHTML = `
            <h3 class="texyla-preview__title">
                <span class="texyla-preview__icon">👁️</span>
                Náhled
            </h3>
            <div class="texyla-preview__controls">
                <button type="button" class="texyla-preview__refresh" 
                        title="Obnovit náhled (Ctrl+P)">
                    🔄
                </button>
                <button type="button" class="texyla-preview__toggle" 
                        title="Skrýt/zobrazit náhled">
                    ▲
                </button>
            </div>
        `;
        container.appendChild(header);
        
        // Loading indicator
        const loading = document.createElement('div');
        loading.className = 'texyla-preview__loading';
        loading.innerHTML = `
            <div class="texyla-preview__spinner"></div>
            <span>Generuji náhled...</span>
        `;
        loading.style.display = 'none';
        container.appendChild(loading);
        
        // Content container
        const content = document.createElement('div');
        content.className = 'texyla-preview__content';
        content.innerHTML = `
            <div class="texyla-preview__empty">
                <p>Náhled se zobrazí zde po stisknutí <kbd>Ctrl+P</kbd></p>
                <p><small>Nejprve zadejte nějaký text do editoru</small></p>
            </div>
        `;
        container.appendChild(content);
        
        return container;
    }
    
    /**
     * Připojí preview k editoru v DOM
     * @private
     */
    _attachToEditor() {
        const wrapper = this.editor.textarea.closest('.texyla-wrapper');
        if (wrapper) {
            wrapper.appendChild(this.element);
        } else {
            // Fallback - vložit za textareu
            this.editor.textarea.parentNode.insertBefore(
                this.element, 
                this.editor.textarea.nextSibling
            );
        }
    }
    
    /**
     * Nastaví event listeners
     * @private
     */
    _setupEventListeners() {
        if (!this.element) return;
        
        // Refresh button
        const refreshBtn = this.element.querySelector('.texyla-preview__refresh');
        refreshBtn.addEventListener('click', () => this.update());
        
        // Toggle button
        const toggleBtn = this.element.querySelector('.texyla-preview__toggle');
        toggleBtn.addEventListener('click', () => this.toggle());
        
        // Klávesové zkratky
        document.addEventListener('keydown', (e) => {
            // Ctrl+P pro toggle preview
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                this.toggle();
            }
            
            // Ctrl+Shift+R pro refresh pokud je preview viditelné
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'r') {
                e.preventDefault();
                this.update();
            }
        });
        
        // Sledovat změny v editoru pro auto-refresh
        this.editor.events.on('content-changed', () => {
            if (this.isVisible && this.editor.config.get('autoPreview', false)) {
                this.update();
            }
        });
        
        // Sledovat změny kontextu
        this.editor.events.on('context-changed', () => {
            if (this.isVisible) {
                this.update();
            }
        });
    }
    
    /**
     * Nastaví auto-preview při psaní
     * @private
     */
    _setupAutoPreview() {
        const textarea = this.editor.textarea;
        const debounceTime = this.editor.config.get('previewDebounce', 1000);
        
        textarea.addEventListener('input', () => {
            clearTimeout(this.debounceTimer);
            
            if (!this.isVisible) return;
            
            // Debounce pro časté změny
            this.debounceTimer = setTimeout(() => {
                if (textarea.value !== this.lastContent) {
                    this.update();
                }
            }, debounceTime);
        });
    }
    
    /**
     * Aktualizuje preview (volá API endpoint)
     * @param {boolean} [force=false] - Přinutit refresh i při stejném obsahu
     * @returns {Promise<void>}
     */
    async update(force = false) {
        const content = this.editor.getContent();
        const context = this.editor.config.get('context', 'default');
        
        // Pokud obsah nezměněn a neforceujeme → přeskočit
        if (!force && content === this.lastContent) {
            console.log('Preview: Content unchanged, skipping');
            return;
        }
        
        // Pokud prázdný obsah → zobrazit placeholder
        if (!content.trim()) {
            this._showEmptyState();
            return;
        }
        
        // Debounce: zrušit předchozí timer
        clearTimeout(this.debounceTimer);
        
        // Nový timer pro debounce (pokud není manuální update)
        if (!force) {
            const debounceTime = this.editor.config.get('previewDebounce', 500);
            
            this.debounceTimer = setTimeout(async () => {
                await this._fetchPreview(content, context);
            }, debounceTime);
            
            return;
        }
        
        // Okamžitý update (manuální)
        await this._fetchPreview(content, context);
    }
    
    /**
     * Zavolá API endpoint pro generování náhledu
     * @private
     * @param {string} content - Texy! obsah
     * @param {string} context - Kontext (admin/forum/default)
     * @returns {Promise<void>}
     */
    async _fetchPreview(content, context) {
        try {
            this._showLoading();
            
            // Emitovat event před requestem
            this.events.emit('fetch-start', { content, context });
            
            // Volání PHP endpointu (TexylaController.php)
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/html'
                },
                body: JSON.stringify({
                    texy_source: content,
                    context: context
                })
            });
            
            // Kontrola HTTP statusu
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Získat HTML odpověď
            const html = await response.text();
            
            // Validovat odpověď
            if (!html || html.trim() === '') {
                throw new Error('Empty response from server');
            }
            
            // Aktualizovat obsah
            this._updateContent(html);
            
            // Uložit poslední zpracovaný obsah
            this.lastContent = content;
            
            // Emitovat event po úspěchu
            this.events.emit('fetch-success', {
                content,
                context,
                html,
                responseTime: Date.now()
            });
            
            console.log(`Preview updated for editor ${this.editor.id}`);
            
        } catch (error) {
            this._showError(error);
            
            // Emitovat error event
            this.events.emit('fetch-error', {
                content,
                context,
                error: error.message
            });
            
            console.error('Preview fetch failed:', error);
        } finally {
            this._hideLoading();
        }
    }
    
    /**
     * Zobrazí loading stav
     * @private
     */
    _showLoading() {
        if (!this.element) return;
        
        this.isLoading = true;
        
        const loadingEl = this.element.querySelector('.texyla-preview__loading');
        const contentEl = this.element.querySelector('.texyla-preview__content');
        
        if (loadingEl) loadingEl.style.display = 'flex';
        if (contentEl) contentEl.style.opacity = '0.5';
    }
    
    /**
     * Skryje loading stav
     * @private
     */
    _hideLoading() {
        if (!this.element) return;
        
        this.isLoading = false;
        
        const loadingEl = this.element.querySelector('.texyla-preview__loading');
        const contentEl = this.element.querySelector('.texyla-preview__content');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.opacity = '1';
    }
    
    /**
     * Aktualizuje obsah preview kontejneru
     * @private
     * @param {string} html - HTML obsah pro zobrazení
     */
    _updateContent(html) {
        if (!this.element) return;
        
        const contentEl = this.element.querySelector('.texyla-preview__content');
        if (!contentEl) return;
        
        // Očistit obsah
        contentEl.innerHTML = '';
        
        // Vytvořit wrapper pro stylování
        const wrapper = document.createElement('div');
        wrapper.className = 'texyla-preview__html';
        
        // Bezpečně vložit HTML (sanitizace by byla na backendu)
        wrapper.innerHTML = html;
        
        contentEl.appendChild(wrapper);
        
        // Scrollovat na začátek
        contentEl.scrollTop = 0;
        
        // Přidat CSS pro základní formátování
        this._injectPreviewStyles();
    }
    
    /**
     * Vloží základní styly pro preview (Texy! výstup)
     * @private
     */
    _injectPreviewStyles() {
        const styleId = 'texyla-preview-styles';
        
        // Pokud styly už existují, přeskočit
        if (document.getElementById(styleId)) return;
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .texyla-preview__html {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                line-height: 1.6;
                color: #2d3748;
            }
            
            .texyla-preview__html h1,
            .texyla-preview__html h2,
            .texyla-preview__html h3 {
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                color: #2d3748;
                font-weight: 600;
            }
            
            .texyla-preview__html h1 { font-size: 1.875rem; }
            .texyla-preview__html h2 { font-size: 1.5rem; }
            .texyla-preview__html h3 { font-size: 1.25rem; }
            
            .texyla-preview__html p {
                margin: 1em 0;
            }
            
            .texyla-preview__html strong {
                font-weight: 700;
                color: #2d3748;
            }
            
            .texyla-preview__html em {
                font-style: italic;
            }
            
            .texyla-preview__html code {
                font-family: 'Monaco', 'Menlo', monospace;
                background: #f7fafc;
                padding: 0.125rem 0.375rem;
                border-radius: 0.25rem;
                font-size: 0.875em;
                border: 1px solid #e2e8f0;
            }
            
            .texyla-preview__html pre {
                background: #f7fafc;
                border: 1px solid #e2e8f0;
                border-radius: 0.375rem;
                padding: 1rem;
                overflow-x: auto;
                margin: 1em 0;
            }
            
            .texyla-preview__html pre code {
                background: none;
                border: none;
                padding: 0;
            }
            
            .texyla-preview__html blockquote {
                border-left: 4px solid #cbd5e0;
                margin: 1em 0;
                padding-left: 1em;
                color: #4a5568;
                font-style: italic;
            }
            
            .texyla-preview__html ul,
            .texyla-preview__html ol {
                margin: 1em 0;
                padding-left: 2em;
            }
            
            .texyla-preview__html a {
                color: #4299e1;
                text-decoration: underline;
            }
            
            .texyla-preview__html a:hover {
                color: #2b6cb0;
            }
            
            .texyla-preview__html img {
                max-width: 100%;
                height: auto;
                border-radius: 0.375rem;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Zobrazí error stav
     * @private
     * @param {Error} error - Error objekt
     */
    _showError(error) {
        if (!this.element) return;
        
        const contentEl = this.element.querySelector('.texyla-preview__content');
        if (!contentEl) return;
        
        contentEl.innerHTML = `
            <div class="texyla-preview__error">
                <div class="texyla-preview__error-icon">⚠️</div>
                <div class="texyla-preview__error-content">
                    <h4>Chyba při generování náhledu</h4>
                    <p>${this.editor.config.get('debug') ? error.message : 'Zkuste to prosím znovu za chvíli.'}</p>
                    <button type="button" class="texyla-preview__retry">
                        Zkusit znovu
                    </button>
                </div>
            </div>
        `;
        
        // Retry button
        const retryBtn = contentEl.querySelector('.texyla-preview__retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.update(true));
        }
    }
    
    /**
     * Zobrazí prázdný stav
     * @private
     */
    _showEmptyState() {
        if (!this.element) return;
        
        const contentEl = this.element.querySelector('.texyla-preview__content');
        if (!contentEl) return;
        
        contentEl.innerHTML = `
            <div class="texyla-preview__empty">
                <p>Zadejte text pro zobrazení náhledu</p>
                <p><small>Použijte formátování Texy! syntaxe</small></p>
            </div>
        `;
        
        this.lastContent = '';
    }
    
    /**
     * Přepne viditelnost preview
     * @param {boolean} [visible] - Konkrétní stav, nebo toggle
     * @returns {boolean} Nový stav
     */
    toggle(visible = null) {
        const newState = visible !== null ? visible : !this.isVisible;
        return this.setVisible(newState);
    }
    
    /**
     * Nastaví viditelnost preview
     * @param {boolean} visible - true=zobrazit, false=skrýt
     * @returns {boolean} Nový stav
     */
    setVisible(visible) {
        this.isVisible = visible;
        
        if (this.element) {
            this.element.classList.toggle('texyla-preview--visible', visible);
            
            // Aktualizovat ikonu tlačítka
            const toggleBtn = this.element.querySelector('.texyla-preview__toggle');
            if (toggleBtn) {
                toggleBtn.textContent = visible ? '▼' : '▲';
                toggleBtn.title = visible ? 'Skrýt náhled' : 'Zobrazit náhled';
            }
            
            // Pokud se zobrazuje a máme obsah → aktualizovat
            if (visible && this.editor.getContent().trim()) {
                this.update(true);
            }
        }
        
        // Emitovat event
        this.events.emit('visibility-changed', { visible });
        
        return visible;
    }
    
    /**
     * Zničí preview komponentu a uklidí
     */
    destroy() {
        clearTimeout(this.debounceTimer);
        
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        
        this.events.emit('destroyed');
    }
}

export default Preview;