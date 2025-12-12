// src/ui/Preview.js
export class Preview {
    constructor(editor) {
        this.editor = editor;
        this.element = null;
        this.isVisible = false;
        this.endpoint = editor.config.get('previewEndpoint') || '/src/TexylaController.php';
        this.debounceTimer = null;
    }
    
    async initialize() {
        this.element = this._createElement();
        this._attachToEditor();
        this._setupEventListeners();
        
        // Auto-preview pokud je povoleno
        if (this.editor.config.get('autoPreview', false)) {
            this._setupAutoPreview();
        }
    }
    
    async update() {
        const content = this.editor.getContent();
        const context = this.editor.config.get('context', 'default');
        
        // Debounce pro časté změny
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(async () => {
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
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const html = await response.text();
                this._updateContent(html);
                
            } catch (error) {
                this._showError(error);
            }
        }, this.editor.config.get('previewDebounce', 500));
    }
}