// src/ui/Toolbar.js

import EventBus from '../core/EventBus.js';

/**
 * @class Toolbar
 * @description Hlavní toolbar komponenta pro Texylu editor
 * @property {HTMLElement} element - DOM element toolbaru
 * @property {Texyla} editor - Reference na hlavní editor
 * @property {Object} buttons - Mapa tlačítek podle markerů
 */
export class Toolbar {
    /**
     * Vytvoří novou toolbar instanci
     * @param {Texyla} editor - Instance Texyla editoru
     */
    constructor(editor) {
        /** @type {Texyla} */
        this.editor = editor;
        
        /** @type {HTMLElement|null} */
        this.element = null;
        
        /** @type {Object} */
        this.buttons = {};
        
        /** @type {EventBus} */
        this.events = new EventBus();
        
        /** @type {boolean} */
        this.isVisible = true;
    }
    
    /**
     * Inicializuje toolbar a vytvoří DOM element
     * @returns {Promise<Toolbar>}
     */
    async initialize() {
        try {
            // Vytvořit DOM element
            this.element = this._createElement();
            
            // Načíst konfiguraci tlačítek
            await this._loadButtons();
            
            // Přidat toolbar do DOM
            this._attachToEditor();
            
            // Nastavit event listeners
            this._setupEventListeners();
            
            console.log(`Toolbar initialized for editor ${this.editor.id}`);
            return this;
            
        } catch (error) {
            console.error('Toolbar initialization failed:', error);
            throw new Error(`Toolbar init failed: ${error.message}`);
        }
    }
    
    /**
     * Vytvoří základní DOM element toolbaru
     * @private
     * @returns {HTMLElement}
     */
    _createElement() {
        const toolbar = document.createElement('div');
        toolbar.className = 'texyla-toolbar';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', 'Text formatting tools');
        
        // Přidat container pro tlačítka
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'texyla-toolbar__buttons';
        toolbar.appendChild(buttonsContainer);
        
        return toolbar;
    }
    
    /**
     * Načte a vytvoří tlačítka podle konfigurace
     * @private
     * @returns {Promise<void>}
     */
    async _loadButtons() {
        // 1. Zkusit načíst konfiguraci z editoru
        let buttonConfigs = this.editor.config.get('buttons');
        
        // 2. Pokud nemáme konfiguraci, použít výchozí
        if (!buttonConfigs || !Array.isArray(buttonConfigs)) {
            console.log('No button config provided, using defaults');
            buttonConfigs = this._getDefaultButtons();
        }
        
        const buttonsContainer = this.element.querySelector('.texyla-toolbar__buttons');
        
        // 3. Vytvořit tlačítka
        buttonConfigs.forEach(config => {
            // Validovat konfiguraci
            if (!this._isValidButtonConfig(config)) {
                console.warn('Invalid button config:', config);
                return;
            }
            
            const button = this._createButton(config);
            buttonsContainer.appendChild(button);
            
            // Uložit referenci (použít marker nebo label jako klíč)
            const key = config.marker || config.label;
            if (key) {
                this.buttons[key] = button;
            }
        });
        
        console.log(`Created ${buttonConfigs.length} toolbar button(s)`);
    }
    
    /**
     * Vrátí výchozí tlačítka pokud není konfigurace
     * @private
     * @returns {Array} Výchozí konfigurace tlačítek
     */
_getDefaultButtons() {
    return [
        { marker: '**', label: 'B', title: 'Tučný text (Ctrl+B)', group: 'inline' },
        { marker: '*', label: 'I', title: 'Kurzíva (Ctrl+I)', group: 'inline' },
        { marker: '`', label: '</>', title: 'Inline kód', group: 'inline' },
        { marker: 'DIALOG:link', label: '🔗', title: 'Vložit odkaz', group: 'dialogs' },
        { marker: 'DIALOG:image', label: '🖼️', title: 'Vložit obrázek', group: 'dialogs' },
        { marker: 'DIALOG:heading', label: 'H', title: 'Vložit nadpis', group: 'dialogs' },
        { marker: 'DIALOG:code-block', label: '</>+', title: 'Blok kódu s jazykem', group: 'dialogs' },
        { marker: 'PREVIEW_TOGGLE', label: '👁️', title: 'Zobrazit/skrýt náhled (Ctrl+P)', group: 'preview' },
        { marker: '---', label: '―', title: 'Horizontální čára', group: 'blocks' },
        { marker: '- ', label: '•', title: 'Odrážkový seznam', group: 'lists' },
        { marker: '1) ', label: '1.', title: 'Číslovaný seznam', group: 'lists' },
        { marker: '> ', label: '💬', title: 'Citace', group: 'blocks' }
    ];
}
    
    /**
     * Validuje konfiguraci tlačítka
     * @private
     * @param {Object} config - Konfigurace tlačítka
     * @returns {boolean} Validity
     */
    _isValidButtonConfig(config) {
        if (!config || typeof config !== 'object') return false;
        
        // Musí mít buď marker nebo label
        if (!config.marker && !config.label) return false;
        
        // Dialog marker musí být správného formátu
        if (config.marker && config.marker.startsWith('DIALOG:')) {
            const dialogType = config.marker.replace('DIALOG:', '');
            const validDialogs = ['link', 'image', 'heading', 'code-block'];
            if (!validDialogs.includes(dialogType)) {
                console.warn(`Invalid dialog type: ${dialogType}`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Vytvoří jednotlivé tlačítko
     * @private
     * @param {Object} config - Konfigurace tlačítka
     * @returns {HTMLButtonElement}
     */
    _createButton(config) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'texyla-toolbar__button';
        button.textContent = config.label || config.marker;
        
        // Title (tooltip)
        if (config.title) {
            button.title = config.title;
        }
        
        // Marker (pro dialog nebo Texy! syntax)
        if (config.marker) {
            button.dataset.marker = config.marker;
            
            // Rozlišit dialogy
            if (config.marker.startsWith('DIALOG:')) {
                button.classList.add('texyla-toolbar__button--dialog');
                button.dataset.dialogType = config.marker.replace('DIALOG:', '');
            }
        }
        
        // CSS třída
        if (config.class) {
            button.classList.add(config.class);
        }
        
        // Group (pro CSS styling)
        if (config.group) {
            button.dataset.group = config.group;
        }
        
        // Event listener
        button.addEventListener('click', (e) => this._handleButtonClick(e, config));
        
        return button;
    }
    
    /**
     * Zpracuje kliknutí na tlačítko
     * @private
     * @param {Event} event - Click event
     * @param {Object} config - Konfigurace tlačítka
     */
_handleButtonClick(event, config) {
    event.preventDefault();
    event.stopPropagation();
    
    const marker = config.marker;
    
    console.log(`Toolbar button clicked: ${marker || config.label}`);
    
    this.events.emit('button-click', { 
        marker, 
        label: config.label,
        button: event.target 
    });
    
    // Speciální logika pro preview toggle
    if (marker === 'PREVIEW_TOGGLE') {
        this._togglePreview();
        return;
    }
    
    // Dialog vs normální marker
    if (marker && marker.startsWith('DIALOG:')) {
        this._openDialog(marker.replace('DIALOG:', ''));
    } else {
        this._insertMarker(marker);
    }
}
    
    /**
     * Otevře dialogové okno
     * @private
     * @param {string} dialogType - Typ dialogu (link, image, heading, code-block)
     */
    _openDialog(dialogType) {
        console.log(`Opening dialog: ${dialogType}`);
        
        // Získat DialogManager z editoru
        const dialogManager = this.editor.modules.get('dialog-manager');
        
        if (!dialogManager) {
            console.error('DialogManager not available');
            this._showError('Dialog features not available');
            return;
        }
        
        // Zkontrolovat zda je dialog dostupný
        if (!dialogManager.hasDialog(dialogType)) {
            console.error(`Dialog type not available: ${dialogType}`);
            this._showError(`Dialog '${dialogType}' not available`);
            return;
        }
        
        // Získat vybraný text pro předvyplnění
        const selectedText = this._getSelectedText();
        const defaults = {};
        
        // Nastavit výchozí hodnoty podle typu dialogu
        switch (dialogType) {
            case 'link':
                defaults.text = selectedText || '';
                if (selectedText && this._isValidUrl(selectedText)) {
                    defaults.url = selectedText;
                }
                break;
                
            case 'image':
                defaults.alt = selectedText || '';
                if (selectedText && this._isValidImageUrl(selectedText)) {
                    defaults.url = selectedText;
                }
                break;
                
            case 'heading':
                defaults.text = selectedText || '';
                defaults.level = 3;
                break;
                
            case 'code-block':
                defaults.content = selectedText || '';
                defaults.language = '';
                break;
        }
        
        // Otevřít dialog
        const success = dialogManager.open(dialogType, defaults);
        
        if (!success) {
            this._showError(`Failed to open ${dialogType} dialog`);
        }
    }
    
    /**
     * Zobrazí chybovou hlášku
     * @private
     * @param {string} message - Chybová zpráva
     */
    _showError(message) {
        // Vytvořit temporary error message
        const errorEl = document.createElement('div');
        errorEl.className = 'texyla-toolbar__error';
        errorEl.textContent = message;
        errorEl.style.cssText = `
            position: absolute;
            background: #fed7d7;
            color: #742a2a;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            z-index: 1000;
            margin-top: 0.5rem;
            animation: fade-in 0.2s ease;
        `;
        
        this.element.appendChild(errorEl);
        
        // Odstranit po 3 sekundách
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.remove();
            }
        }, 3000);
    }
    
    /**
     * Vloží marker kolem vybraného textu
     * @private
     * @param {string} marker - Texy! marker (**, *, `, ---, etc.)
     */
    _insertMarker(marker) {
        const textarea = this.editor.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        // Speciální logika pro různé markery
        let newText;
        let newCursorPos;
        
        if (!marker) {
            console.warn('No marker provided');
            return;
        }
        
        // Speciální případy
        if (marker === '---') {
            // Horizontální čára - vložit na nový řádek
            newText = '\n\n---\n\n';
            newCursorPos = start + 3; // Po ---
        }
        else if (marker === '- ' || marker === '1) ') {
            // Seznamy - vložit na začátek řádku
            newText = marker;
            newCursorPos = start + marker.length;
        }
        else if (marker === '> ') {
            // Citace - vložit na začátek řádku
            newText = marker;
            newCursorPos = start + marker.length;
        }
        else if (selectedText) {
            // Text je vybraný → obalit markery
            newText = marker + selectedText + marker;
            newCursorPos = start + marker.length + selectedText.length + marker.length;
        } else {
            // Nic není vybrané → vložit markery s placeholderem
            newText = marker + marker;
            newCursorPos = start + marker.length;
        }
        
        // Vložit do textarey pomocí editor API
        this.editor.insert(newText);
        
        // Nastavit pozici kurzoru
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        textarea.focus();
        
        // Log pro debug
        console.log(`Inserted marker "${marker}" at position ${start}-${end}`);
    }
    
    /**
     * Získá vybraný text z textarey
     * @private
     * @returns {string} Vybraný text
     */
    _getSelectedText() {
        const textarea = this.editor.textarea;
        return textarea.value.substring(
            textarea.selectionStart,
            textarea.selectionEnd
        );
    }
    
    /**
     * Validuje URL
     * @private
     * @param {string} url - URL k validaci
     * @returns {boolean} Validity
     */
    _isValidUrl(url) {
        try {
            new URL(url);
            return true;
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
        
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
        const lowerUrl = url.toLowerCase();
        return imageExtensions.some(ext => lowerUrl.includes(ext));
    }
    
    /**
     * Připojí toolbar k editoru v DOM
     * @private
     */
    _attachToEditor() {
        const wrapper = this.editor.textarea.closest('.texyla-wrapper');
        if (wrapper) {
            wrapper.insertBefore(this.element, this.editor.textarea);
        }
    }
    
    /**
     * Nastaví event listeners
     * @private
     */
    _setupEventListeners() {
        // Sledovat změny ve výběru textu pro aktivaci/deaktivaci tlačítek
        this.editor.textarea.addEventListener('select', () => this._updateButtonStates());
        this.editor.textarea.addEventListener('click', () => this._updateButtonStates());
        this.editor.textarea.addEventListener('keyup', () => this._updateButtonStates());
        
        // Poslouchat eventy z editoru
        this.editor.events.on('content-changed', () => this._updateButtonStates());
        
        // Poslouchat dialog events pro aktualizaci toolbaru
        this.editor.events.on('dialog-opened', () => {
            // Zakázat toolbar při otevřeném dialogu
            this.element.style.opacity = '0.5';
            this.element.style.pointerEvents = 'none';
        });
        
        this.editor.events.on('dialog-closed', () => {
            // Znovu povolit toolbar
            this.element.style.opacity = '';
            this.element.style.pointerEvents = '';
        });
    }
    
    /**
     * Aktualizuje stavy tlačítek (enabled/disabled)
     * @private
     */
    _updateButtonStates() {
        // TODO: Implementovat logiku podle kontextu a vybraného textu
        // Např. zakázat obrázky ve fóru atd.
        
        // Prozatím základní logika: zakázat dialogy pokud není DialogManager
        const hasDialogManager = !!this.editor.modules.get('dialog-manager');
        
        Object.values(this.buttons).forEach(button => {
            if (button.dataset.marker && button.dataset.marker.startsWith('DIALOG:')) {
                button.disabled = !hasDialogManager;
            }
        });
    }
    
    /**
     * Aktualizuje tlačítka podle nové konfigurace
     * @param {Array} buttonConfigs - Nová konfigurace tlačítek
     */
    updateButtons(buttonConfigs) {
        if (!this.element || !Array.isArray(buttonConfigs)) return;
        
        // Vyčistit stará tlačítka
        const buttonsContainer = this.element.querySelector('.texyla-toolbar__buttons');
        if (buttonsContainer) {
            buttonsContainer.innerHTML = '';
        }
        
        this.buttons = {};
        
        // Vytvořit nová tlačítka
        buttonConfigs.forEach(config => {
            if (this._isValidButtonConfig(config)) {
                const button = this._createButton(config);
                buttonsContainer.appendChild(button);
                
                const key = config.marker || config.label;
                if (key) {
                    this.buttons[key] = button;
                }
            }
        });
        
        console.log(`Toolbar buttons updated: ${buttonConfigs.length} button(s)`);
        this.events.emit('buttons-updated', { buttons: buttonConfigs });
    }
    
    /**
     * Schová/zobrazí toolbar
     * @param {boolean} show - true=zobrazit, false=schovat
     */
    setVisible(show) {
        this.isVisible = show;
        if (this.element) {
            this.element.style.display = show ? 'flex' : 'none';
        }
    }
    
    /**
     * Zničí toolbar a uklidí event listeners
     */
    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
        
        this.buttons = {};
        this.events.emit('destroyed');
    }
}

export default Toolbar;