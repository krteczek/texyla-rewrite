/**
 * Project: Texyla Rewrite Dream Team
 * File: /texyla-rewrite/assets/TexylaDialog.js
 * Description: Univerzální dialog komponenta pro Texylu - vanilla JavaScript
 * 
 * @author Dream Team (Petr & Bó)
 * @license MIT
 * @version 1.0.0
 */

/**
 * Univerzální dialogová komponenta pro Texylu
 * 
 * Poskytuje kontextová dialogová okna pro vkládání:
 * - Odkazů (link)
 * - Obrázků (image) 
 * - Nadpisů (heading)
 * - Bloků kódu (code-block)
 * 
 * @example
 * // Vytvoření a zobrazení dialogu pro odkaz
 * const dialog = new TexylaDialog('link', {
 *   onSubmit: (data) => console.log('Uživatel zadal:', data),
 *   defaults: { text: 'vybraný text' }
 * });
 * dialog.show();
 */
class TexylaDialog {
    /**
     * Vytvoří novou instanci Texyla dialogu
     * 
     * @param {string} type Typ dialogu ('link', 'image', 'heading', 'code-block')
     * @param {Object} options Konfigurace dialogu
     * @param {Function} options.onSubmit Callback při potvrzení dialogu
     * @param {Object} options.defaults Výchozí hodnoty pro pole
     * @param {string} options.title Vlastní titulek dialogu (volitelné)
     */
    constructor(type, options = {}) {
        this._validateArguments(type, options);
        
        this.type = type;
        this.callback = options.onSubmit || (() => {});
        this.defaults = options.defaults || {};
        this.customTitle = options.title;
        
        this.overlay = null;
        this.dialogElement = null;
        this.form = null;
        
        this._config = this._getDialogConfig();
        this._isOpen = false;
    }
    
    /**
     * Validuje vstupní argumenty konstruktoru
     * 
     * @private
     * @param {string} type Typ dialogu
     * @param {Object} options Konfigurace
     * @throws {Error} Pokud argumenty nejsou validní
     */
    _validateArguments(type, options) {
        const validTypes = ['link', 'image', 'heading', 'code-block'];
        
        if (!validTypes.includes(type)) {
            throw new Error(`TexylaDialog: Neplatný typ dialogu "${type}". Povolené typy: ${validTypes.join(', ')}`);
        }
        
        if (options.onSubmit && typeof options.onSubmit !== 'function') {
            throw new Error('TexylaDialog: onSubmit musí být funkce');
        }
    }
    
    /**
     * Vrátí konfiguraci dialogu pro daný typ
     * 
     * @private
     * @returns {Object} Konfigurace dialogu
     */
    _getDialogConfig() {
        const configs = {
            'link': {
                title: 'Vložit odkaz',
                fields: [
                    {
                        name: 'text',
                        label: 'Text odkazu:',
                        type: 'text',
                        placeholder: '(nepovinné - použije se URL)',
                        optional: true,
                        defaultValue: this.defaults.text || ''
                    },
                    {
                        name: 'url',
                        label: 'URL adresa:',
                        type: 'url',
                        placeholder: 'https://example.com',
                        required: true,
                        defaultValue: this.defaults.url || ''
                    }
                ],
                template: (data) => `[${data.text || data.url}](${data.url})`
            },
            
            'image': {
                title: 'Vložit obrázek',
                fields: [
                    {
                        name: 'src',
                        label: 'Cesta k obrázku:',
                        type: 'text',
                        placeholder: '/images/photo.jpg nebo https://example.com/obrazek.jpg',
                        required: true,
                        defaultValue: this.defaults.src || ''
                    },
                    {
                        name: 'alt',
                        label: 'Popis obrázku:',
                        type: 'text',
                        placeholder: '(nepovinné)',
                        optional: true,
                        defaultValue: this.defaults.alt || ''
                    },
                    {
                        name: 'width',
                        label: 'Šířka (px):',
                        type: 'number',
                        placeholder: 'auto',
                        optional: true,
                        min: 1,
                        max: 5000,
                        defaultValue: this.defaults.width || ''
                    },
                    {
                        name: 'height',
                        label: 'Výška (px):',
                        type: 'number',
                        placeholder: 'auto',
                        optional: true,
                        min: 1,
                        max: 5000,
                        defaultValue: this.defaults.height || ''
                    }
                ],
                template: (data) => {
                    let syntax = `[* ${data.src}`;
                    if (data.alt) syntax += ` .(${data.alt})`;
                    if (data.width || data.height) {
                        syntax += ` ${data.width || ''}${data.height ? 'x' + data.height : ''}`;
                    }
                    syntax += ' *]';
                    return syntax;
                }
            },
            
            'heading': {
                title: 'Vložit nadpis',
                fields: [
                    {
                        name: 'level',
                        label: 'Úroveň nadpisu:',
                        type: 'select',
                        required: true,
                        defaultValue: this.defaults.level || 3,
                        options: [
                            { value: 1, label: 'H1 - Nejvyšší (##)' },
                            { value: 2, label: 'H2 (##)' },
                            { value: 3, label: 'H3 - Doporučené (###)' },
                            { value: 4, label: 'H4 (####)' },
                            { value: 5, label: 'H5 (#####)' },
                            { value: 6, label: 'H6 - Nejnižší (######)' }
                        ]
                    },
                    {
                        name: 'text',
                        label: 'Text nadpisu:',
                        type: 'text',
                        placeholder: 'Název kapitoly nebo sekce',
                        required: true,
                        defaultValue: this.defaults.text || ''
                    }
                ],
                template: (data) => `${'#'.repeat(data.level)} ${data.text}`
            },
            
            'code-block': {
                title: 'Vložit blok kódu',
                fields: [
                    {
                        name: 'language',
                        label: 'Programovací jazyk:',
                        type: 'select',
                        required: false,
                        defaultValue: this.defaults.language || '',
                        options: [
                            { value: '', label: 'Žádný (čistý text)' },
                            { value: 'php', label: 'PHP' },
                            { value: 'javascript', label: 'JavaScript' },
                            { value: 'html', label: 'HTML' },
                            { value: 'css', label: 'CSS' },
                            { value: 'sql', label: 'SQL' },
                            { value: 'bash', label: 'Bash/Shell' },
                            { value: 'python', label: 'Python' },
                            { value: 'json', label: 'JSON' },
                            { value: 'xml', label: 'XML' }
                        ]
                    },
                    {
                        name: 'content',
                        label: 'Kód:',
                        type: 'textarea',
                        placeholder: '// Vložte zde svůj kód',
                        required: true,
                        rows: 8,
                        defaultValue: this.defaults.content || ''
                    }
                ],
                template: (data) => {
                    if (data.language) {
                        return `/--code ${data.language}\n${data.content}\n\\--`;
                    }
                    return `/--\n${data.content}\n\\--`;
                }
            }
        };
        
        return configs[this.type];
    }
    
    /**
     * Zobrazí dialogové okno
     * 
     * @returns {void}
     */
    show() {
        if (this._isOpen) {
            console.warn('TexylaDialog: Dialog je již otevřený');
            return;
        }
        
        this._createOverlay();
        this._renderDialog();
        this._setupEventListeners();
        this._isOpen = true;
        
        // Auto-focus na první pole
        setTimeout(() => {
            const firstInput = this.form.querySelector('input, select, textarea');
            if (firstInput) firstInput.focus();
        }, 10);
    }
    
    /**
     * Vytvoří overlay (překryv celé obrazovky)
     * 
     * @private
     */
    _createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'texyla-dialog-overlay';
        this.overlay.setAttribute('role', 'dialog');
        this.overlay.setAttribute('aria-modal', 'true');
        this.overlay.setAttribute('aria-label', this._config.title);
        
        document.body.appendChild(this.overlay);
        
        // Zabraň scrollování stránky pod dialogem
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Vykreslí dialogové okno s formulářem
     * 
     * @private
     */
    _renderDialog() {
        const title = this.customTitle || this._config.title;
        
        const dialogHTML = `
            <div class="texyla-dialog">
                <div class="texyla-dialog__header">
                    <h3 class="texyla-dialog__title">${this._escapeHtml(title)}</h3>
                    <button type="button" class="texyla-dialog__close" aria-label="Zavřít dialog">
                        &times;
                    </button>
                </div>
                
                <form class="texyla-dialog__form" novalidate>
                    ${this._config.fields.map(field => this._renderField(field)).join('')}
                    
                    <div class="texyla-dialog__footer">
                        <button type="button" class="texyla-dialog__button texyla-dialog__button--cancel">
                            Zrušit
                        </button>
                        <button type="submit" class="texyla-dialog__button texyla-dialog__button--submit">
                            Vložit
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        this.overlay.innerHTML = dialogHTML;
        this.dialogElement = this.overlay.querySelector('.texyla-dialog');
        this.form = this.overlay.querySelector('.texyla-dialog__form');
    }
    
    /**
     * Vykreslí pole formuláře podle konfigurace
     * 
     * @private
     * @param {Object} field Konfigurace pole
     * @returns {string} HTML pole
     */
    _renderField(field) {
        const fieldId = `texyla-dialog-${this.type}-${field.name}`;
        const isRequired = field.required && !field.optional;
        const value = field.defaultValue !== undefined ? field.defaultValue : '';
        
        let fieldHTML = `
            <div class="texyla-dialog__field">
                <label for="${fieldId}" class="texyla-dialog__label">
                    ${field.label}
                    ${!isRequired && field.optional ? ' <span class="texyla-dialog__optional">(nepovinné)</span>' : ''}
                </label>
        `;
        
        if (field.type === 'select') {
            fieldHTML += `
                <select id="${fieldId}" name="${field.name}" class="texyla-dialog__input texyla-dialog__select"
                        ${isRequired ? 'required' : ''}>
                    ${field.options.map(opt => `
                        <option value="${this._escapeHtml(opt.value)}" ${value == opt.value ? 'selected' : ''}>
                            ${this._escapeHtml(opt.label)}
                        </option>
                    `).join('')}
                </select>
            `;
        } else if (field.type === 'textarea') {
            fieldHTML += `
                <textarea id="${fieldId}" name="${field.name}" class="texyla-dialog__input texyla-dialog__textarea"
                          placeholder="${field.placeholder || ''}" 
                          rows="${field.rows || 4}"
                          ${isRequired ? 'required' : ''}>${this._escapeHtml(value)}</textarea>
            `;
        } else {
            const inputType = field.type === 'number' ? 'number' : 'text';
            const extraAttrs = field.type === 'url' ? 'inputmode="url"' : '';
            
            if (field.type === 'number') {
                extraAttrs += field.min ? ` min="${field.min}"` : '';
                extraAttrs += field.max ? ` max="${field.max}"` : '';
            }
            
            fieldHTML += `
                <input type="${inputType}" id="${fieldId}" name="${field.name}" 
                       class="texyla-dialog__input" 
                       placeholder="${field.placeholder || ''}" 
                       value="${this._escapeHtml(value)}"
                       ${isRequired ? 'required' : ''}
                       ${extraAttrs}>
            `;
        }
        
        fieldHTML += `</div>`;
        return fieldHTML;
    }
    
    /**
     * Nastaví event listenery pro dialog
     * 
     * @private
     */
    _setupEventListeners() {
        // Submit formuláře
        this.form.addEventListener('submit', (event) => {
            event.preventDefault();
            this._handleSubmit();
        });
        
        // Tlačítko Zrušit
        const cancelBtn = this.overlay.querySelector('.texyla-dialog__button--cancel');
        cancelBtn.addEventListener('click', () => this.close());
        
        // Tlačítko Zavřít (X)
        const closeBtn = this.overlay.querySelector('.texyla-dialog__close');
        closeBtn.addEventListener('click', () => this.close());
        
        // Kliknutí mimo dialog
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) {
                this.close();
            }
        });
        
        // Klávesa ESC
        const escHandler = (event) => {
            if (event.key === 'Escape') {
                this.close();
            }
        };
        document.addEventListener('keydown', escHandler);
        this._escHandler = escHandler; // Uložíme pro pozdější odstranění
    }
    
    /**
     * Zpracuje odeslání formuláře
     * 
     * @private
     */
    _handleSubmit() {
        if (!this.form.checkValidity()) {
            this.form.reportValidity();
            return;
        }
        
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        
        // Konverze číselných hodnot
        if (this.type === 'image') {
            if (data.width) data.width = parseInt(data.width);
            if (data.height) data.height = parseInt(data.height);
        }
        if (this.type === 'heading') {
            data.level = parseInt(data.level);
        }
        
        // Vygenerovat Texy! syntaxi
        const syntax = this._config.template(data);
        
        // Zavolat callback s daty a vygenerovanou syntaxí
        this.callback({
            data: data,
            syntax: syntax
        });
        
        this.close();
    }
    
    /**
     * Zavře dialogové okno
     * 
     * @returns {void}
     */
    close() {
        if (!this._isOpen) return;
        
        // Odstranění event listenerů
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
        }
        
        // Odstranění overlay z DOM
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        // Obnovení scrollování stránky
        document.body.style.overflow = '';
        
        this.overlay = null;
        this.dialogElement = null;
        this.form = null;
        this._isOpen = false;
    }
    
    /**
     * Escape HTML speciálních znaků
     * 
     * @private
     * @param {string} text Text k escapování
     * @returns {string} Escapovaný text
     */
    _escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Zjistí, zda je dialog otevřený
     * 
     * @returns {boolean} True pokud je dialog otevřený
     */
    isOpen() {
        return this._isOpen;
    }
    
    /**
     * Vrátí konfiguraci dialogu (pro debugování)
     * 
     * @returns {Object} Konfigurace dialogu
     */
    getConfig() {
        return this._config;
    }
}

// Export pro globální použití
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TexylaDialog;
} else {
    window.TexylaDialog = TexylaDialog;
}