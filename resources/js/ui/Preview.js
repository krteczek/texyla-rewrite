// src/ui/Preview.js - AKTUALIZOVANÁ VERZE

import EventBus from '../core/EventBus.js';

/**
 * @class Preview
 * @description Komponenta pro live preview Texy! syntaxe
 */
export class Preview {
    constructor(editor) {
        this.editor = editor;
        this.element = null;
        this.isVisible = false;
        this.endpoint = this.editor.config.get('previewEndpoint') || '/src/TexylaController.php';
        this.debounceTimer = null;
        this.isLoading = false;
        this.lastContent = '';
        this.events = new EventBus();
        
        console.log(`Preview: Using endpoint ${this.endpoint}`);
    }
    
    async initialize() {
        try {
            this.element = this._createElement();
            this._attachToEditor();
            this._setupEventListeners();
            
            // Auto-preview pokud je povoleno
            if (this.editor.config.get('autoPreview', false)) {
                this._setupAutoPreview();
            }
            
            // Výchozí stav z configu
            const showPreview = this.editor.config.get('showPreview', false);
            this.setVisible(showPreview);
            
            this.events.emit('initialized', { preview: this });
            console.log(`Preview initialized for editor ${this.editor.id}`);
            
            return this;
            
        } catch (error) {
            console.error('Preview initialization failed:', error);
            throw error;
        }
    }
    
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
                <span class="texyla-preview__status"></span>
            </h3>
            <div class="texyla-preview__controls">
                <button type="button" class="texyla-preview__refresh" 
                        title="Obnovit náhled">
                    🔄
                </button>
                <button type="button" class="texyla-preview__toggle" 
                        title="Skrýt/zobrazit náhled">
                    ▼
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
                <p>Pro zobrazení náhledu stiskněte <kbd>Ctrl+P</kbd></p>
                <p><small>Nejprve zadejte nějaký text do editoru</small></p>
            </div>
        `;
        container.appendChild(content);
        
        return container;
    }
    
    _attachToEditor() {
        const wrapper = this.editor.textarea.closest('.texyla-wrapper');
        if (wrapper) {
            wrapper.appendChild(this.element);
        } else {
            this.editor.textarea.parentNode.insertBefore(
                this.element, 
                this.editor.textarea.nextSibling
            );
        }
    }
    
    _setupEventListeners() {
        if (!this.element) return;
        
        // Refresh button
        const refreshBtn = this.element.querySelector('.texyla-preview__refresh');
        refreshBtn.addEventListener('click', () => this.update(true));
        
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
                this.update(true);
            }
        });
    }
    
    async update(force = false) {
        const content = this.editor.getContent();
        const context = this.editor.config.get('context', 'default');
        
        // Pokud není viditelné, přeskočit
        if (!this.isVisible) return;
        
        // Pokud obsah nezměněn a neforceujeme → přeskočit
        if (!force && content === this.lastContent) {
            return;
        }
        
        // Pokud prázdný obsah → zobrazit placeholder
        if (!content.trim()) {
            this._showEmptyState();
            return;
        }
        
        // Debounce
        clearTimeout(this.debounceTimer);
        
        const debounceTime = this.editor.config.get('previewDebounce', 500);
        
        this.debounceTimer = setTimeout(async () => {
            await this._fetchPreview(content, context);
        }, debounceTime);
    }
    
    async _fetchPreview(content, context) {
        try {
            this._showLoading();
            
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    texy_source: content,
                    context: context
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            
            if (!html || html.trim() === '') {
                throw new Error('Empty response from server');
            }
            
            this._updateContent(html);
            this.lastContent = content;
            
            // Update status indicator
            this._updateStatus('success');
            
        } catch (error) {
            this._showError(error);
            this._updateStatus('error');
        } finally {
            this._hideLoading();
        }
    }
    
    _showLoading() {
        this.isLoading = true;
        
        const loadingEl = this.element.querySelector('.texyla-preview__loading');
        const contentEl = this.element.querySelector('.texyla-preview__content');
        
        if (loadingEl) loadingEl.style.display = 'flex';
        if (contentEl) contentEl.style.opacity = '0.5';
    }
    
    _hideLoading() {
        this.isLoading = false;
        
        const loadingEl = this.element.querySelector('.texyla-preview__loading');
        const contentEl = this.element.querySelector('.texyla-preview__content');
        
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) contentEl.style.opacity = '1';
    }
    
    _updateContent(html) {
        const contentEl = this.element.querySelector('.texyla-preview__content');
        if (!contentEl) return;
        
        contentEl.innerHTML = '';
        
        const wrapper = document.createElement('div');
        wrapper.className = 'texyla-preview__html';
        wrapper.innerHTML = html;
        
        contentEl.appendChild(wrapper);
        contentEl.scrollTop = 0;
        
        // Inject preview styles if not already present
        this._injectPreviewStyles();
    }
    
    _updateStatus(status) {
        const statusEl = this.element.querySelector('.texyla-preview__status');
        if (!statusEl) return;
        
        statusEl.className = `texyla-preview__status texyla-preview__status--${status}`;
        
        switch (status) {
            case 'success':
                statusEl.textContent = '✓';
                statusEl.title = 'Náhled aktualizován';
                break;
            case 'error':
                statusEl.textContent = '✗';
                statusEl.title = 'Chyba při generování náhledu';
                break;
            case 'loading':
                statusEl.textContent = '⟳';
                statusEl.title = 'Načítám...';
                break;
        }
    }
    
    _showError(error) {
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
        
        const retryBtn = contentEl.querySelector('.texyla-preview__retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.update(true));
        }
    }
    
    _showEmptyState() {
        const contentEl = this.element.querySelector('.texyla-preview__content');
        if (!contentEl) return;
        
        contentEl.innerHTML = `
            <div class="texyla-preview__empty">
                <p>Zadejte text pro zobrazení náhledu</p>
                <p><small>Použijte formátování Texy! syntaxe</small></p>
            </div>
        `;
        
        this.lastContent = '';
        this._updateStatus('idle');
    }
    
    toggle(visible = null) {
        const newState = visible !== null ? visible : !this.isVisible;
        return this.setVisible(newState);
    }
    
    setVisible(visible) {
        this.isVisible = visible;
        
        if (this.element) {
            this.element.classList.toggle('texyla-preview--visible', visible);
            
            // Update toggle button icon
            const toggleBtn = this.element.querySelector('.texyla-preview__toggle');
            if (toggleBtn) {
                toggleBtn.textContent = visible ? '▲' : '▼';
                toggleBtn.title = visible ? 'Skrýt náhled' : 'Zobrazit náhled';
            }
            
            // Update status
            this._updateStatus(visible ? 'idle' : 'hidden');
            
            // If showing and we have content → update
            if (visible && this.editor.getContent().trim()) {
                this.update(true);
            }
        }
        
        this.events.emit('visibility-changed', { visible });
        return visible;
    }
    
    destroy() {
        clearTimeout(this.debounceTimer);
        
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        
        this.events.emit('destroyed');
    }
    
    // Helper metody pro toolbar
    isActive() {
        return this.isVisible;
    }
}

export default Preview;