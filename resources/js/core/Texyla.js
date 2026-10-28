// src/core/Texyla.js

import EventBus from './EventBus.js';
import ErrorHandler from './ErrorHandler.js';
import Config from './Config.js';
import Toolbar from '../ui/Toolbar.js';
import Preview from '../ui/Preview.js';
import DialogManager from '../ui/DialogManager.js';

/**
 * @class Texyla
 * @description Hlavní třída Texyla editoru. Orchestruje všechny komponenty a poskytuje API.
 * @property {string} id - Unikátní ID instance
 * @property {HTMLTextAreaElement} textarea - Reference na textarea element
 * @property {EventBus} events - Event systém pro komunikaci
 * @property {Config} config - Správce konfigurace
 * @property {ErrorHandler} errors - Správce chyb
 * @property {Map} modules - Registry načtených modulů
 * @property {boolean} isInitialized - Stav inicializace
 * @property {Toolbar|null} toolbar - Reference na toolbar komponentu
 * @property {Preview|null} preview - Reference na preview komponentu
 * @property {DialogManager|null} dialogManager - Reference na správce dialogů
 */
export class Texyla {
    /** @type {Map<string, Texyla>} Statická registry všech instancí */
    static instances = new Map();
    
    /** @type {string} Verze API */
    static VERSION = '1.0.0';
    
    /**
     * Vytvoří novou instanci Texyla editoru
     * @param {HTMLTextAreaElement} textarea - Textarea element
     * @param {Object} [options={}] - Uživatelské volby konfigurace
     */
    constructor(textarea, options = {}) {
        /** @type {HTMLTextAreaElement} */
        this.textarea = textarea;
        
        /** @type {string} */
        this.id = `texyla-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        /** @type {EventBus} */
        this.events = new EventBus();
        
        /** @type {Config} */
        this.config = new Config(textarea, options);
        
        /** @type {ErrorHandler} */
        this.errors = new ErrorHandler(this);
        
        /** @type {Map<string, Object>} */
        this.modules = new Map();
        
        /** @type {boolean} */
        this.isInitialized = false;
        
        /** @type {Toolbar|null} */
        this.toolbar = null;
        
        /** @type {Preview|null} */
        this.preview = null;
        
        /** @type {DialogManager|null} */
        this.dialogManager = null;
        
        // Uložit do statické registry
        Texyla.instances.set(this.id, this);
        
        console.log(`Texyla instance created: ${this.id}`);
    }
    
    /* ============================================
       STATICKÉ METODY (PUBLIC API)
       ============================================ */
    
    /**
     * Inicializuje Texyla editor pro daný element
     * @static
     * @param {string|HTMLTextAreaElement} selector - CSS selektor nebo element
     * @param {Object} [options={}] - Konfigurační volby
     * @returns {Promise<Texyla|null>} Instance editoru nebo null při chybě
     * @example
     * // Inicializace pomocí selektoru
     * Texyla.init('#myEditor', { context: 'admin' });
     * 
     * // Inicializace pomocí elementu
     * Texyla.init(document.getElementById('editor'), { debug: true });
     */
    static async init(selector, options = {}) {
        // Získat element
        const element = typeof selector === 'string' 
            ? document.querySelector(selector)
            : selector;
            
        if (!element) {
            console.error(`Texyla.init: Element not found: ${selector}`);
            return null;
        }
        
        // Zkontrolovat zda už není inicializovaný
        if (element.classList.contains('texyla-initialized')) {
            console.warn(`Texyla.init: Element already initialized: ${selector}`);
            return Texyla.getInstance(element) || null;
        }
        
        try {
            // Vytvořit instanci
            const editor = new Texyla(element, options);
            
            // Inicializovat
            const result = await editor.initialize();
            
            return result;
            
        } catch (error) {
            console.error(`Texyla.init failed for ${selector}:`, error);
            return null;
        }
    }
    
    /**
     * Automaticky inicializuje všechny .texyla elementy na stránce
     * @static
     * @param {Object} [globalOptions={}] - Globální konfigurační volby
     * @returns {Promise<Array<Texyla>>} Pole inicializovaných editorů
     * @example
     * // Auto-inicializace všech editorů na stránce
     * Texyla.autoInit();
     * 
     * // Auto-inicializace s globálními volbami
     * Texyla.autoInit({ debug: true, context: 'admin' });
     */
    static async autoInit(globalOptions = {}) {
        const elements = document.querySelectorAll('.texyla:not(.texyla-initialized)');
        const instances = [];
        
        console.log(`Texyla.autoInit: Found ${elements.length} editor(s) to initialize`);
        
        for (const element of elements) {
            try {
                // Kombinovat globální volby s data atributy elementu
                const elementOptions = { ...globalOptions };
                
                // Inicializovat
                const instance = await Texyla.init(element, elementOptions);
                
                if (instance) {
                    instances.push(instance);
                }
                
            } catch (error) {
                console.error(`Texyla.autoInit failed for element:`, element, error);
            }
        }
        
        console.log(`Texyla.autoInit: Successfully initialized ${instances.length} editor(s)`);
        
        // Dispatch globální event
        if (instances.length > 0) {
            document.dispatchEvent(new CustomEvent('texyla:auto-init-complete', {
                detail: { instances }
            }));
        }
        
        return instances;
    }
    
    /**
     * Vrátí instanci Texyla podle elementu nebo selektoru
     * @static
     * @param {string|HTMLTextAreaElement} selector - CSS selektor nebo element
     * @returns {Texyla|null} Instance editoru nebo null
     * @example
     * // Podle selektoru
     * const editor = Texyla.getInstance('#myEditor');
     * 
     * // Podle elementu
     * const editor = Texyla.getInstance(document.getElementById('editor'));
     */
    static getInstance(selector) {
        const element = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;
            
        if (!element) {
            return null;
        }
        
        // Najít instanci podle elementu
        for (const instance of Texyla.instances.values()) {
            if (instance.textarea === element) {
                return instance;
            }
        }
        
        return null;
    }
    
    /**
     * Vrátí všechny aktivní instance Texyla
     * @static
     * @returns {Array<Texyla>} Pole instancí
     * @example
     * // Získat všechny editory
     * const allEditors = Texyla.getAllInstances();
     */
    static getAllInstances() {
        return Array.from(Texyla.instances.values());
    }
    
    /**
     * Vrátí debug informace o všech instancích
     * @static
     * @returns {Object} Debug informace
     * @example
     * // Získat debug info
     * console.table(Texyla.debug());
     */
    static debug() {
        return {
            version: Texyla.VERSION,
            instances: Texyla.getAllInstances().map(inst => ({
                id: inst.id,
                element: inst.textarea.id || inst.textarea.name || 'anonymous',
                context: inst.config.get('context'),
                initialized: inst.isInitialized,
                modules: Array.from(inst.modules.keys())
            }))
        };
    }
    
    /* ============================================
       INSTANČNÍ METODY (INITIALIZACE)
       ============================================ */
    
    /**
     * Inicializuje editor a všechny jeho komponenty
     * @async
     * @returns {Promise<Texyla|null>} this nebo null při chybě
     * @private
     */
    async initialize() {
        console.log(`Texyla ${this.id}: Initializing...`);
        
        try {
            // 1. Validace a kontrola Texy! dostupnosti
            if (!await this._validateEnvironment()) {
                return null;
            }
            
            // 2. Setup základního UI wrapperu
            this._setupUIWrapper();
            
            // 3. Načíst konfiguraci tlačítek
            await this._loadButtonConfig();
            
            // 4. Inicializovat toolbar (pokud není zakázán)
            if (this.config.get('toolbar', true) !== false) {
                await this._initToolbar();
            }
            
            // 5. Inicializovat preview (pokud máme endpoint)
            if (this.config.get('previewEndpoint')) {
                await this._initPreview();
            }
            
            // 6. Inicializovat dialog manager
            if (this.config.get('dialogs', true) !== false) {
                await this._initDialogManager();
            }
            
            // 7. Nastavit event listeners
            this._setupGlobalEventListeners();
            
            // 8. Označit jako inicializovaný
            this.textarea.classList.add('texyla-initialized');
            this.isInitialized = true;
            
            // 9. Emitovat inicializační event
            this.events.emit('initialized', {
                id: this.id,
                element: this.textarea,
                config: this.config.getAll(),
                timestamp: Date.now()
            });
            
            console.log(`Texyla ${this.id}: Initialization complete`);
            return this;
            
        } catch (error) {
            // Fatální chyba inicializace
            this.errors.fatal({
                code: 'INIT_FAILED',
                message: error.message,
                userMessage: 'Failed to initialize editor'
            });
            
            console.error(`Texyla ${this.id}: Initialization failed:`, error);
            return null;
        }
    }
    
    /**
     * Validuje prostředí a kontroluje Texy! dostupnost
     * @private
     * @returns {Promise<boolean>} true pokud může pokračovat
     */
    async _validateEnvironment() {
        const texyAvailable = this.config.get('texyAvailable', true);
        
        // Texy! není dostupná → zobrazit error a vrátit false
        if (!texyAvailable) {
            const texyError = this.textarea.dataset.texyError || 
                             'Texy! PHP library is not available';
            
            this.errors.fatal({
                code: 'TEXY_MISSING',
                message: texyError,
                userMessage: 'Editor requires Texy! PHP library',
                fallback: true
            });
            
            return false;
        }
        
        // Validovat konfiguraci
        const configErrors = this.config.validate();
        if (configErrors.length > 0) {
            configErrors.forEach(error => this.errors.warning(error));
            
            // Ne fatální, ale logujeme
            console.warn(`Texyla ${this.id}: Config validation warnings:`, configErrors);
        }
        
        return true;
    }
    
    /**
     * Vytvoří základní UI wrapper kolem textarey
     * @private
     */
    _setupUIWrapper() {
        // Pokud už wrapper existuje, přeskočit
        if (this.textarea.closest('.texyla-wrapper')) {
            return;
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'texyla-wrapper';
        wrapper.dataset.texylaId = this.id;
        
        // Obalit textareu
        this.textarea.parentNode.insertBefore(wrapper, this.textarea);
        wrapper.appendChild(this.textarea);
        
        // Přidat status indikátor
        this._addStatusIndicator(wrapper);
    }
    
    /**
     * Přidá status indikátor do wrapperu
     * @private
     * @param {HTMLElement} wrapper - Wrapper element
     */
    _addStatusIndicator(wrapper) {
        const indicator = document.createElement('div');
        indicator.className = 'texyla-status';
        indicator.innerHTML = `
            <span class="texyla-status__icon">✓</span>
            <span class="texyla-status__text">Texyla Ready</span>
        `;
        
        // Toggle na kliknutí (debug feature)
        indicator.addEventListener('click', () => {
            console.log(`Texyla ${this.id} debug:`, {
                config: this.config.getAll(),
                modules: Array.from(this.modules.keys()),
                contentLength: this.getContent().length
            });
        });
        
        wrapper.appendChild(indicator);
    }
    
    /**
     * Načte konfiguraci tlačítek z data atributu
     * @private
     * @returns {Promise<void>}
     */
    async _loadButtonConfig() {
        const jsonConfig = this.textarea.dataset.config;
        
        if (!jsonConfig) {
            console.log(`Texyla ${this.id}: No button config provided, using defaults`);
            return;
        }
        
        try {
            const buttons = JSON.parse(jsonConfig);
            
            // Validovat strukturu
            if (!Array.isArray(buttons)) {
                throw new Error('Button config must be an array');
            }
            
            // Uložit do konfigurace
            this.config.set('buttons', buttons);
            
            console.log(`Texyla ${this.id}: Loaded ${buttons.length} button(s) from config`);
            
        } catch (error) {
            console.warn(`Texyla ${this.id}: Invalid button config:`, error);
            
            this.errors.warning({
                code: 'CONFIG_PARSE_ERROR',
                message: error.message,
                userMessage: 'Invalid button configuration'
            });
        }
    }
    
    /**
     * Inicializuje toolbar komponentu
     * @private
     * @returns {Promise<void>}
     */
    async _initToolbar() {
        try {
            this.toolbar = new Toolbar(this);
            await this.toolbar.initialize();
            
            // Uložit referenci
            this.modules.set('toolbar', this.toolbar);
            
            // Event forwardování
            this.toolbar.events.on('button-click', (data) => {
                this.events.emit('toolbar-button-click', data);
            });
            
            this.events.emit('toolbar-ready', { toolbar: this.toolbar });
            
            console.log(`Texyla ${this.id}: Toolbar initialized`);
            
        } catch (error) {
            this.errors.warning({
                code: 'TOOLBAR_INIT_FAILED',
                message: error.message,
                userMessage: 'Toolbar could not be loaded'
            });
            
            console.warn(`Texyla ${this.id}: Toolbar init failed:`, error);
        }
    }
    
    /**
     * Inicializuje preview komponentu
     * @private
     * @returns {Promise<void>}
     */
    async _initPreview() {
        try {
            this.preview = new Preview(this);
            await this.preview.initialize();
            
            // Uložit referenci
            this.modules.set('preview', this.preview);
            
            // Event forwardování
            this.preview.events.on('visibility-changed', (data) => {
                this.events.emit('preview-visibility-changed', data);
            });
            
            this.events.emit('preview-ready', { preview: this.preview });
            
            console.log(`Texyla ${this.id}: Preview initialized`);
            
        } catch (error) {
            this.errors.warning({
                code: 'PREVIEW_INIT_FAILED',
                message: error.message,
                userMessage: 'Live preview unavailable'
            });
            
            console.warn(`Texyla ${this.id}: Preview init failed:`, error);
        }
    }
    
    /**
     * Inicializuje dialog manager
     * @private
     * @returns {Promise<void>}
     */
    async _initDialogManager() {
        try {
            this.dialogManager = new DialogManager(this);
            
            // Uložit referenci
            this.modules.set('dialog-manager', this.dialogManager);
            
            // Event forwardování
            this.dialogManager.events.on('dialog-opened', (data) => {
                this.events.emit('dialog-opened', data);
            });
            
            this.dialogManager.events.on('dialog-submitted', (data) => {
                this.events.emit('dialog-submitted', data);
                this.events.emit('content-inserted', {
                    text: data.syntax,
                    source: 'dialog',
                    dialogType: data.type
                });
            });
            
            this.events.emit('dialog-manager-ready', { 
                dialogManager: this.dialogManager 
            });
            
            console.log(`Texyla ${this.id}: DialogManager initialized`);
            
        } catch (error) {
            this.errors.warning({
                code: 'DIALOG_MANAGER_INIT_FAILED',
                message: error.message,
                userMessage: 'Dialog features unavailable'
            });
            
            console.warn(`Texyla ${this.id}: DialogManager init failed:`, error);
        }
    }
    
    /**
     * Nastaví globální event listeners
     * @private
     */
    _setupGlobalEventListeners() {
        // Window unload - cleanup
        window.addEventListener('beforeunload', () => {
            this.destroy();
        });
        
        // Resize - aktualizovat UI pokud potřebné
        window.addEventListener('resize', () => {
            this.events.emit('window-resize');
        });
        
        // Textarea specific events
        this.textarea.addEventListener('focus', () => {
            this.events.emit('editor-focused');
        });
        
        this.textarea.addEventListener('blur', () => {
            this.events.emit('editor-blurred');
        });
    }
    
    /* ============================================
       PUBLIC API METODY
       ============================================ */
    
    /**
     * Vrátí obsah editoru
     * @returns {string} Obsah textarey
     * @example
     * const content = editor.getContent();
     */
    getContent() {
        return this.textarea.value;
    }
    
    /**
     * Nastaví obsah editoru
     * @param {string} content - Nový obsah
     * @example
     * editor.setContent('# Nový obsah');
     */
    setContent(content) {
        const oldContent = this.textarea.value;
        this.textarea.value = content;
        
        // Emitovat event pouze pokud se obsah změnil
        if (oldContent !== content) {
            this.events.emit('content-changed', { 
                content, 
                oldContent,
                source: 'api' 
            });
        }
    }
    
    /**
     * Vloží text na pozici kurzoru
     * @param {string} text - Text k vložení
     * @param {Object} [options] - Volby vložení
     * @param {boolean} [options.selectInserted=false] - Vybrat vložený text
     * @returns {boolean} Úspěch operace
     * @example
     * // Vložit tučný text
     * editor.insert('**tučný text**');
     * 
     * // Vložit a vybrat
     * editor.insert('placeholder', { selectInserted: true });
     */
    insert(text, options = {}) {
        if (!this.textarea) return false;
        
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const content = this.textarea.value;
        
        // Vložit text
        this.textarea.value = 
            content.substring(0, start) + 
            text + 
            content.substring(end);
        
        // Nastavit pozici kurzoru
        const newCursorPos = start + text.length;
        
        if (options.selectInserted) {
            this.textarea.selectionStart = start;
            this.textarea.selectionEnd = newCursorPos;
        } else {
            this.textarea.selectionStart = this.textarea.selectionEnd = newCursorPos;
        }
        
        // Focus na textareu
        this.textarea.focus();
        
        // Emitovat event
        this.events.emit('content-inserted', { 
            text, 
            position: start,
            length: text.length,
            selected: options.selectInserted || false
        });
        
        return true;
    }
    
    /**
     * Přepne viditelnost preview panelu
     * @returns {boolean} Nový stav
     * @example
     * // Toggle preview
     * const isVisible = editor.togglePreview();
     * 
     * // Explicitně nastavit
     * editor.togglePreview(true); // zobrazit
     * editor.togglePreview(false); // skrýt
     */
    togglePreview(visible = null) {
        if (!this.preview) {
            console.warn('Texyla: Preview not available');
            return false;
        }
        
        return this.preview.toggle(visible);
    }
    
    /**
     * Manuálně aktualizuje preview
     * @param {boolean} [force=false] - Přinutit refresh i při stejném obsahu
     * @returns {Promise<boolean>} Úspěch operace
     * @example
     * // Aktualizovat preview
     * await editor.updatePreview();
     * 
     * // Vynutit refresh
     * await editor.updatePreview(true);
     */
    async updatePreview(force = false) {
        if (!this.preview) {
            console.warn('Texyla: Preview not available');
            return false;
        }
        
        try {
            await this.preview.update(force);
            return true;
        } catch (error) {
            console.error('Texyla: Preview update failed:', error);
            return false;
        }
    }
    
    /**
     * Otevře dialog
     * @param {string} type - Typ dialogu ('link', 'image', 'heading', 'code-block')
     * @param {Object} [defaults={}] - Výchozí hodnoty pro formulář
     * @returns {boolean} Úspěch otevření
     * @example
     * // Otevřít link dialog
     * editor.openDialog('link', { text: 'Klikněte zde' });
     * 
     * // Otevřít heading dialog s vybraným textem
     * editor.openDialog('heading', { text: selectedText });
     */
    openDialog(type, defaults = {}) {
        if (!this.dialogManager) {
            console.warn('Texyla: DialogManager not available');
            return false;
        }
        
        return this.dialogManager.open(type, defaults);
    }
    
    /**
     * Zavře aktuálně otevřený dialog
     * @returns {boolean} Úspěch zavření
     * @example
     * editor.closeDialog();
     */
    closeDialog() {
        if (!this.dialogManager) {
            return false;
        }
        
        return this.dialogManager.close();
    }
    
    /**
     * Zkontroluje zda je dialog typu dostupný
     * @param {string} type - Typ dialogu
     * @returns {boolean} Dostupnost
     * @example
     * if (editor.hasDialog('image')) {
     *     editor.openDialog('image');
     * }
     */
    hasDialog(type) {
        return this.dialogManager ? this.dialogManager.hasDialog(type) : false;
    }
    
    /**
     * Zničí editor a uklidí všechny resources
     * @example
     * // Zničit editor
     * editor.destroy();
     */
    destroy() {
        console.log(`Texyla ${this.id}: Destroying...`);
        
        // Emitovat před-destroy event
        this.events.emit('before-destroy');
        
        // Zničit moduly
        this.modules.forEach(module => {
            if (module.destroy && typeof module.destroy === 'function') {
                try {
                    module.destroy();
                } catch (error) {
                    console.warn(`Error destroying module:`, error);
                }
            }
        });
        
        // Odstranit UI wrapper
        const wrapper = this.textarea.closest('.texyla-wrapper');
        if (wrapper) {
            wrapper.parentNode.insertBefore(this.textarea, wrapper);
            wrapper.remove();
        }
        
        // Odstranit třídy
        this.textarea.classList.remove('texyla-initialized');
        
        // Odstranit event listeners
        this.events.emit('destroyed');
        
        // Odstranit z registry
        Texyla.instances.delete(this.id);
        
        // Nullovat reference pro GC
        this.toolbar = null;
        this.preview = null;
        this.dialogManager = null;
        this.modules.clear();
        
        console.log(`Texyla ${this.id}: Destroyed`);
    }
    
    /**
     * Vrátí konfiguraci editoru
     * @returns {Object} Kompletní konfigurace
     */
    getConfig() {
        return this.config.getAll();
    }
    
    /**
     * Aktualizuje konfiguraci za běhu
     * @param {Object} newConfig - Nová konfigurace
     * @returns {boolean} Úspěch aktualizace
     */
    updateConfig(newConfig) {
        try {
            this.config.update(newConfig);
            this.events.emit('config-updated', { config: this.config.getAll() });
            return true;
        } catch (error) {
            console.error('Texyla: Config update failed:', error);
            return false;
        }
    }
}

// Globální export
if (typeof window !== 'undefined') {
    window.Texyla = Texyla;
}

export default Texyla;