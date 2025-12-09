/**
 * Project: Texyla Rewrite Dream Team
 * File: /texyla-rewrite/assets/texyla.js
 * Description: Hlavní třída Texyla editoru s automatickou konfigurací
 * 
 * @author Dream Team (Petr & Bó)
 * @license MIT
 * @version 2.0.0
 */

/**
 * Hlavní třída Texyla editoru
 * 
 * 100% automatická konfigurace z Texy! instance pomocí TexylaConfigFactory
 * Žádný manuální config.php - vše generováno dynamicky
 * 
 * @example
 * // Automatická konfigurace z Texy
 * [$texy, $jsonConfig] = TexylaConfigFactory::getContextSetup('admin');
 * <textarea data-texyla-config="<?= $jsonConfig ?>"></textarea>
 * 
 * const editor = new TexylaVanilla(document.getElementById('editor'), '/preview');
 */
class TexylaVanilla {
    /**
     * Vytvoří novou instanci Texyla editoru
     * 
     * @param {HTMLElement} textareaElement DOM element textarea pro editaci
     * @param {string} previewUrl URL endpointu pro AJAX náhled
     * @throws {Error} Pokud není předán validní HTML element nebo chybí konfigurace
     */
    constructor(textareaElement, previewUrl) {
        this._validateConstructorArguments(textareaElement, previewUrl);
        
        // Inicializace vlastností
        this._textarea = textareaElement;
        this._previewUrl = previewUrl;
        this._wrapper = null;
        this._toolbar = null;
        this._previewPanel = null;
        this._previewButton = null;
        this._markers = [];
        this._isInitialized = false;
        this._backendValidated = false;
        
        // Vývojářské logování
        console.debug(`🔧 TexylaVanilla: Inicializace pro element #${this._textarea.id || 'unnamed'}`);
        
        // 1. Validace backendu před inicializací
        this._validateBackend()
            .then(isValid => {
                if (!isValid) {
                    console.error('❌ Texyla: Backend validace selhala');
                    return;
                }
                
                // 2. Validace konfigurace
                if (!this._validateTexylaConfig()) {
                    throw new Error('Texyla: Není nastavena konfigurace. Použij TexylaConfigFactory.');
                }
                
                // 3. Inicializace editoru
                this._initializeEditor();
                this._isInitialized = true;
                console.info(`✅ Texyla: Editor #${this._textarea.id || 'unnamed'} úspěšně inicializován`);
            })
            .catch(error => {
                console.error('💥 Texyla: Kritická chyba inicializace:', error);
                this._showFatalError({
                    title: '💥 Texyla: Selhala inicializace',
                    message: 'Editor se nepodařilo inicializovat.',
                    details: error.message,
                    fixSteps: [
                        '1. Zkontrolujte, zda má textarea atribut <code>data-texyla-config</code>',
                        '2. Ověřte, že endpoint <code>' + this._previewUrl + '</code> existuje',
                        '3. Použijte <code>TexylaConfigFactory</code> pro automatickou konfiguraci'
                    ]
                });
            });
    }
    
    // === VALIDACE A INICIALIZACE ===
    
    /**
     * Validuje vstupní argumenty konstruktoru
     * 
     * @private
     * @param {HTMLElement} textareaElement DOM element
     * @param {string} previewUrl URL endpointu
     * @throws {Error} Pokud argumenty nejsou validní
     */
    _validateConstructorArguments(textareaElement, previewUrl) {
        if (!(textareaElement instanceof HTMLElement)) {
            throw new Error('TexylaVanilla: První argument musí být HTML element');
        }
        
        if (typeof previewUrl !== 'string' || previewUrl.trim() === '') {
            throw new Error('TexylaVanilla: Druhý argument musí být URL string');
        }
        
        // Uložit originální URL pro debug
        this._originalPreviewUrl = previewUrl;
    }
    
    /**
     * Validuje, že backend endpoint existuje a odpovídá
     * 
     * @private
     * @async
     * @returns {Promise<boolean>} True pokud backend funguje
     */
    async _validateBackend() {
        console.debug(`🌐 Texyla: Validace backendu na ${this._previewUrl}`);
        
        try {
            const test = await fetch(this._previewUrl, {
                method: 'HEAD',
                mode: 'same-origin',
                cache: 'no-cache',
                headers: { 'X-Texyla-Validation': 'true' }
            });
            
            if (!test.ok) {
                throw new Error(`Backend odpověděl s chybou: ${test.status} ${test.statusText}`);
            }
            
            console.debug(`✅ Texyla: Backend validován úspěšně (${test.status})`);
            this._backendValidated = true;
            return true;
            
        } catch (error) {
            console.error('❌ Texyla: Backend validace selhala:', error);
            
            this._showFatalError({
                title: '🌐 Texyla: Backend nenalezen',
                message: `Endpoint <code>${this._previewUrl}</code> neodpovídá.`,
                details: error.message,
                fixSteps: [
                    '1. Zkontrolujte, zda <strong>src/TexylaController.php</strong> existuje',
                    '2. Ověřte práva ke čtení PHP souborů',
                    '3. Zkontrolujte cestu v inicializaci Texyly',
                    '4. Zkuste URL: <code>' + this._previewUrl + '</code> v prohlížeči'
                ],
                technicalInfo: {
                    url: this._previewUrl,
                    method: 'HEAD',
                    error: error.toString()
                }
            });
            
            this._backendValidated = false;
            return false;
        }
    }
    
    /**
     * Validuje konfiguraci Texyly
     * 
     * @private
     * @returns {boolean} True pokud je konfigurace platná
     */
    _validateTexylaConfig() {
        const configJson = this._textarea.dataset.texylaConfig;
        
        if (!configJson) {
            this._showFatalError({
                title: '⚙️ Texyla: Chybí konfigurace',
                message: 'Editor není nakonfigurován. <strong>Použij TexylaConfigFactory</strong>.',
                details: 'Atribut data-texyla-config je prázdný nebo chybí.',
                fixSteps: [
                    '1. V PHP: <code>[$texy, $config] = TexylaConfigFactory::getContextSetup("admin")</code>',
                    '2. V HTML: <code>data-texyla-config="<?= htmlspecialchars($config) ?>"</code>',
                    '3. Žádný manuální config.php - vše je automatické!'
                ],
                migrationNote: 'Tento projekt používá 100% automatickou konfiguraci z Texy instance.'
            });
            return false;
        }
        
        try {
            const parsed = JSON.parse(configJson);
            
            if (!Array.isArray(parsed)) {
                throw new Error('Konfigurace není pole');
            }
            
            if (parsed.length === 0) {
                console.warn('⚠️ Texyla: Konfigurace obsahuje prázdné pole (žádná tlačítka)');
            }
            
            console.debug(`✅ Texyla: Konfigurace validována (${parsed.length} tlačítek)`);
            return true;
            
        } catch (error) {
            console.error('❌ Texyla: Neplatná konfigurace JSON:', error);
            
            this._showFatalError({
                title: '📄 Texyla: Neplatná konfigurace',
                message: 'Konfigurace v <code>data-texyla-config</code> není platný JSON.',
                details: error.message,
                fixSteps: [
                    '1. Zkontrolujte výstup z <code>TexylaConfigFactory</code>',
                    '2. Ověřte, že používáte <code>htmlspecialchars()</code>',
                    '3. Zkuste konfiguraci zvalidovat na: <a href="https://jsonlint.com/" target="_blank">JSONLint.com</a>'
                ],
                jsonSnippet: configJson.substring(0, 200) + '...'
            });
            
            return false;
        }
    }
    
    /**
     * Zobrazí fatální chybu editoru
     * 
     * @private
     * @param {Object} errorInfo Informace o chybě
     */
    _showFatalError(errorInfo) {
        // Pokud už byla zobrazena chyba, nepřidávej další
        if (this._textarea.previousElementSibling?.classList?.contains('texyla-fatal-error')) {
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'texyla-fatal-error';
        
        let html = `
            <div class="texyla-error-box">
                <h3>${errorInfo.title || '⚠️ Texyla Chyba'}</h3>
                <div class="texyla-error-message">
                    ${errorInfo.message || 'Došlo k neočekávané chybě.'}
                </div>`;
        
        if (errorInfo.details) {
            html += `<div class="texyla-error-details">${errorInfo.details}</div>`;
        }
        
        if (errorInfo.fixSteps && Array.isArray(errorInfo.fixSteps)) {
            html += `
                <div class="texyla-error-fix">
                    <h4>🛠️ Možná řešení:</h4>
                    <ul>${errorInfo.fixSteps.map(step => `<li>${step}</li>`).join('')}</ul>
                </div>`;
        }
        
        if (errorInfo.migrationNote) {
            html += `
                <div class="texyla-error-fix" style="background: #e6fffa; border-color: #81e6d9;">
                    <h4>🔄 Migrace na automatickou konfiguraci:</h4>
                    <p>${errorInfo.migrationNote}</p>
                </div>`;
        }
        
        html += `
                <div class="texyla-error-url">
                    <strong>🔗 Endpoint:</strong> <code>${this._previewUrl}</code><br>
                    <strong>🎯 Element:</strong> <code>#${this._textarea.id || 'bez-id'}</code>
                </div>`;
        
        if (errorInfo.technicalInfo) {
            html += `
                <details style="margin-top: 1rem;">
                    <summary style="cursor: pointer; color: #4a5568; font-weight: 500;">
                        🔍 Technické informace
                    </summary>
                    <pre style="background: #f7fafc; padding: 0.75rem; border-radius: 0.375rem; font-size: 0.75rem; margin-top: 0.5rem;">
${JSON.stringify(errorInfo.technicalInfo, null, 2)}</pre>
                </details>`;
        }
        
        html += `</div>`;
        overlay.innerHTML = html;
        
        // Vložit chybu před textarea
        this._textarea.parentNode.insertBefore(overlay, this._textarea);
        
        // Znefunkčnit textareu
        this._textarea.style.opacity = '0.5';
        this._textarea.style.pointerEvents = 'none';
        this._textarea.disabled = true;
        
        console.error('💥 Texyla: Zobrazena fatální chyba:', errorInfo);
    }
    
    /**
     * Inicializuje editor a všechny jeho komponenty
     * 
     * @private
     */
    _initializeEditor() {
        try {
            this._wrapTextarea();
            this._findOrCreatePreviewPanel();
            this._loadButtonConfig();
            this._createToolbar();
            this._addEventListeners();
            
        } catch (error) {
            console.error('TexylaVanilla initialization failed:', error);
            this._showFatalError({
                title: '💥 Texyla: Selhala inicializace komponent',
                message: 'Nepodařilo se vytvořit komponenty editoru.',
                details: error.message
            });
        }
    }
    
    // === DOM MANIPULACE ===