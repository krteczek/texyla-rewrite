// src/core/Texyla.js - hlavní třída
export class Texyla {
    constructor(textarea, options) {
        this.textarea = textarea;
        this.config = this._loadConfig(options);
        this.modules = new Map();
    }
    
    async init() {
        try {
            // Dynamicky načíst potřebné moduly
            await this._loadCoreModules();
            
            // Inicializovat UI komponenty
            await this._initUI();
            
            // Zaregistrovat eventy
            this._setupEvents();
            
            return this;
        } catch (error) {
            this._handleError(error);
            return null;
        }
    }
    
    async _loadCoreModules() {
        const modules = [
            'core/EventBus',
            'core/ErrorHandler',
            'ui/Toolbar',
            'ui/Preview'
        ];
        
        for (const moduleName of modules) {
            const module = await loadModule(moduleName);
            this.modules.set(moduleName, new module.default(this));
        }
    }
}