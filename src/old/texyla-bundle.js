// src/texyla-bundle.js - hlavní entry point
(function() {
    'use strict';
    
    const MODULES = {
        'core/Texyla': () => import('./core/Texyla.js'),
        'core/EventBus': () => import('./core/EventBus.js'),
        'ui/Toolbar': () => import('./ui/Toolbar.js'),
        // ... další moduly
    };
    
    const loadedModules = new Map();
    
    // Dynamický loader
    async function loadModule(name) {
        if (loadedModules.has(name)) {
            return loadedModules.get(name);
        }
        
        if (!MODULES[name]) {
            throw new Error(`Texyla module not found: ${name}`);
        }
        
        try {
            const module = await MODULES[name]();
            loadedModules.set(name, module);
            return module;
        } catch (error) {
            throw new Error(`Failed to load Texyla module ${name}: ${error.message}`);
        }
    }
    
    // Hlavní Texyla object s lazy loadingem
    window.Texyla = {
        // Inicializace editoru
        async init(selector, options = {}) {
            const { Texyla: TexylaClass } = await loadModule('core/Texyla');
            return TexylaClass.init(selector, options);
        },
        
        // Auto-inicializace
        async autoInit() {
            const { Texyla: TexylaClass } = await loadModule('core/Texyla');
            return TexylaClass.autoInit();
        },
        
        // Debug info
        debug() {
            return {
                modules: Array.from(loadedModules.keys()),
                version: '1.0.0'
            };
        }
    };
    
    // Auto-init po načtení DOM
    if (document.readyState !== 'loading') {
        window.Texyla.autoInit();
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            window.Texyla.autoInit();
        });
    }
})();