// src/ui/DialogManager.js
export class DialogManager {
    constructor(editor) {
        this.editor = editor;
        this.dialogs = new Map();
        this._registerCoreDialogs();
    }
    
    _registerCoreDialogs() {
        // Core dialogy podle TexylaConfigFactory
        this.register('link', {
            title: 'Vložit odkaz',
            template: () => `
                <div class="texyla-dialog">
                    <label>Text odkazu: <input type="text" name="text"></label>
                    <label>URL: <input type="url" name="url" required></label>
                    <button type="submit">Vložit</button>
                </div>
            `,
            onSubmit: (data) => `[${data.text}](${data.url})`
        });
        
        this.register('image', {
            title: 'Vložit obrázek',
            template: () => `...`,
            onSubmit: (data) => `[* ${data.alt} *]`
        });
        
        this.register('heading', {
            title: 'Vložit nadpis',
            template: () => `
                <div class="texyla-dialog">
                    <label>Text: <input type="text" name="text" required></label>
                    <label>Úroveň: 
                        <select name="level">
                            ${[1,2,3].map(l => `<option value="${l}">H${l}</option>`).join('')}
                        </select>
                    </label>
                </div>
            `,
            onSubmit: (data) => `${'#'.repeat(data.level)} ${data.text}`
        });
        
        this.register('code-block', {
            title: 'Blok kódu s jazykem',
            template: () => `...`,
            onSubmit: (data) => `/--code ${data.language}\n${data.code}\n\\--`
        });
    }
}