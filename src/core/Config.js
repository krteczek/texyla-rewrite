// src/core/Config.js
export class Config {
    static DEFAULTS = {
        debug: false,
        context: 'default',
        previewEndpoint: null,
        showErrors: 'user-only', // 'none' | 'user-only' | 'all'
        autoInit: true,
        texyAvailable: true
    };

    constructor(textarea, userOptions = {}) {
        this.textarea = textarea;
        this.userOptions = userOptions;
        this.config = this._loadConfig();
    }

    _loadConfig() {
        // 1. Načíst z data atributů
        const dataConfig = this._parseDataAttributes();
        
        // 2. Merge: defaults → data attributes → user options
        return {
            ...Config.DEFAULTS,
            ...dataConfig,
            ...this.userOptions
        };
    }

    _parseDataAttributes() {
        const config = {};
        const dataset = this.textarea.dataset;
        
        // Základní atributy
        if (dataset.context) config.context = dataset.context;
        if (dataset.debug) config.debug = dataset.debug === 'true';
        if (dataset.endpoint) config.previewEndpoint = dataset.endpoint;
        if (dataset.texyAvailable) {
            config.texyAvailable = dataset.texyAvailable === 'true';
        }
        
        // JSON konfigurace
        if (dataset.config) {
            try {
                const jsonConfig = JSON.parse(dataset.config);
                Object.assign(config, jsonConfig);
            } catch (error) {
                console.warn('Invalid Texyla data-config JSON:', error);
            }
        }
        
        return config;
    }

    get(key, defaultValue = null) {
        return key in this.config ? this.config[key] : defaultValue;
    }

    set(key, value) {
        this.config[key] = value;
    }

    getAll() {
        return { ...this.config };
    }

    // Validace kritické konfigurace
    validate() {
        const errors = [];
        
        if (!this.config.texyAvailable) {
            errors.push({
                code: 'TEXY_MISSING',
                message: 'Texy! PHP library is not available',
                userMessage: 'Editor requires Texy! library. Please contact administrator.'
            });
        }
        
        return errors;
    }
}

export default Config;