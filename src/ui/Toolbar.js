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
        // Toto bude načítat konfiguraci z Texy! nebo data atributů
        // Prozatím hardcoded demo buttons
        
        const buttonConfigs = [
            { marker: '**', label: 'Bold', title: 'Tučný text (Ctrl+B)' },
            { marker: '*', label: 'Italic', title: 'Kurzíva (Ctrl+I)' },
            { marker: '`', label: 'Code', title: 'Inline kód' },
            { marker: 'DIALOG:link', label: '🔗', title: 'Vložit odkaz' },
            { marker: 'DIALOG:image', label: '🖼️', title: 'Vložit obrázek' }
        ];
        
        const buttonsContainer = this.element.querySelector('.texyla-toolbar__buttons');
        
        buttonConfigs.forEach(config => {
            const button = this._createButton(config);
            buttonsContainer.appendChild(button);
            this.buttons[config.marker] = button;
        });
    }
    
    /**
     * Vytvoří jednotlivé tlačítko
     * @private
     * @param {Object} config - Konfigurace tlačítka
     * @param {string} config.marker - Texy! marker nebo DIALOG:type
     * @param {string} config.label - Zobrazený label
     * @param {string} config.title - Tooltip text
     * @returns {HTMLButtonElement}
     */
    _createButton(config) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'texyla-toolbar__button';
        button.textContent = config.label;
        button.title = config.title;
        button.dataset.marker = config.marker;
        
        // Rozlišit mezi normálními tlačítky a dialogy
        if (config.marker.startsWith('DIALOG:')) {
            button.classList.add('texyla-toolbar__button--dialog');
            button.dataset.dialogType = config.marker.replace('DIALOG:', '');
        }
        
        // Event listener
        button.addEventListener('click', (e) => this._handleButtonClick(e, config.marker));
        
        return button;
    }
    
    /**
     * Zpracuje kliknutí na tlačítko
     * @private
     * @param {Event} event - Click event
     * @param {string} marker - Marker tlačítka
     */
    _handleButtonClick(event, marker) {
        event.preventDefault();
        
        // Emitovat event pro editor
        this.events.emit('button-click', { marker, button: event.target });
        
        // Rozlišit dialog vs normální marker
        if (marker.startsWith('DIALOG:')) {
            const dialogType = marker.replace('DIALOG:', '');
            this._openDialog(dialogType);
        } else {
            this._insertMarker(marker);
        }
    }
    
    /**
     * Vloží marker kolem vybraného textu
     * @private
     * @param {string} marker - Texy! marker (**, *, `, etc.)
     */
    _insertMarker(marker) {
        const textarea = this.editor.textarea;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        // Vložit marker podle toho, jestli je text vybraný
        let newText;
        let newCursorPos;
        
        if (selectedText) {
            // Text je vybraný → obalit markery
            newText = marker + selectedText + marker;
            newCursorPos = start + marker.length + selectedText.length + marker.length;
        } else {
            // Nic není vybrané → vložit markery s placeholderem
            newText = marker + marker;
            newCursorPos = start + marker.length;
        }
        
        // Vložit do textarey
        this.editor.insert(newText);
        
        // Nastavit pozici kurzoru
        textarea.selectionStart = textarea.selectionEnd = newCursorPos;
        textarea.focus();
    }
    
    /**
     * Otevře dialogové okno
     * @private
     * @param {string} type - Typ dialogu (link, image, heading, etc.)
     */
    _openDialog(type) {
        console.log(`Opening dialog: ${type}`);
        
        // Emitovat event - dialog manager to zachytí
        this.editor.events.emit('dialog-open', {
            type,
            editor: this.editor
        });
        
        // Prozatím jen log
        alert(`Dialog ${type} would open here. Implementation coming soon.`);
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
    }
    
    /**
     * Aktualizuje stavy tlačítek (enabled/disabled)
     * @private
     */
    _updateButtonStates() {
        // TODO: Implementovat logiku podle kontextu a vybraného textu
        // Např. zakázat obrázky ve fóru atd.
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