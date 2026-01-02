// src/core/ErrorHandler.js
export class ErrorHandler {
    constructor(editor) {
        this.editor = editor;
        this.errors = [];
    }

    fatal(error, options = {}) {
        const errorObj = {
            type: 'fatal',
            code: error.code || 'UNKNOWN',
            message: error.message,
            timestamp: Date.now(),
            element: this.editor.textarea,
            userMessage: options.userMessage || 'Editor is unavailable',
            fallback: options.fallback !== false
        };

        this.errors.push(errorObj);
        
        // Emitovat event
        this.editor.events.emit('error', errorObj);
        
        // Zobrazit uživateli
        if (options.showToUser !== false) {
            this._showUserError(errorObj);
        }

        // Fallback na textarea
        if (errorObj.fallback) {
            this._enableFallback();
        }

        return errorObj;
    }

    warning(error) {
        const errorObj = {
            type: 'warning',
            message: error.message,
            timestamp: Date.now()
        };

        this.errors.push(errorObj);
        this.editor.events.emit('warning', errorObj);
        
        console.warn('Texyla warning:', error);
        
        return errorObj;
    }

    _showUserError(error) {
        const container = this.editor.textarea.parentElement;
        
        const errorEl = document.createElement('div');
        errorEl.className = 'texyla-error';
        errorEl.innerHTML = `
            <div class="texyla-error__header">
                <span class="texyla-error__icon">⚠️</span>
                <strong class="texyla-error__title">Texyla Editor Error</strong>
            </div>
            <div class="texyla-error__message">
                ${error.userMessage}
                ${this.editor.config.debug ? 
                    `<div class="texyla-error__debug">${error.message}</div>` : ''}
            </div>
        `;
        
        container.insertBefore(errorEl, this.editor.textarea);
    }

    _enableFallback() {
        // Zajistit, že textarea je viditelná a použitelná
        this.editor.textarea.style.display = 'block';
        this.editor.textarea.readOnly = false;
        
        // Odstranit Texyla třídu, aby se znovu neinicializovala
        this.editor.textarea.classList.remove('texyla-initialized');
    }

    getErrors() {
        return [...this.errors];
    }

    clearErrors() {
        this.errors = [];
    }
}

export default ErrorHandler;