// /assets/TexylaDialog.js
class TexylaDialog {
  constructor(type, options = {}) {
    this.type = type;
    this.callback = options.onSubmit;
    this.defaults = options.defaults || {};
    this.overlay = null;
  }
  
  show() {
    this._createOverlay();
    this._renderForm();
    this._setupEvents();
  }
  
  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'texyla-dialog-overlay';
    document.body.appendChild(this.overlay);
  }
  
  _renderForm() {
    const config = this._getConfig();
    const html = `
      <div class="texyla-dialog">
        <h3>${config.title}</h3>
        <form class="texyla-dialog-form">
          ${config.fields.map(f => this._renderField(f)).join('')}
          <div class="texyla-dialog-buttons">
            <button type="button" class="texyla-dialog-cancel">Zrušit</button>
            <button type="submit" class="texyla-dialog-submit">Vložit</button>
          </div>
        </form>
      </div>
    `;
    this.overlay.innerHTML = html;
  }
  
  _renderField(field) {
    const value = this.defaults[field.name] || '';
    const required = field.required ? 'required' : '';
    
    if (field.type === 'select') {
      return `
        <label>${field.label}</label>
        <select name="${field.name}" ${required}>
          ${field.options.map(opt => 
            `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
               ${opt.label}
             </option>`
          ).join('')}
        </select>
      `;
    }
    
    return `
      <label>${field.label}</label>
      <input type="${field.type}" 
             name="${field.name}" 
             value="${value}"
             placeholder="${field.placeholder || ''}"
             ${required}>
    `;
  }
  
  _getConfig() {
    const configs = {
      link: {
        title: 'Vložit odkaz',
        fields: [
          { name: 'text', label: 'Text', type: 'text', 
            placeholder: '(nepovinné - použije se URL)' },
          { name: 'url', label: 'URL', type: 'url', required: true,
            placeholder: 'https://...' }
        ]
      },
      image: {
        title: 'Vložit obrázek',
        fields: [
          { name: 'src', label: 'Cesta k obrázku', type: 'text', required: true,
            placeholder: '/images/photo.jpg nebo https://...' },
          { name: 'alt', label: 'Popis obrázku', type: 'text',
            placeholder: '(nepovinné)' }
        ]
      },
      heading: {
        title: 'Vložit nadpis',
        fields: [
          { name: 'level', label: 'Úroveň', type: 'select',
            options: [
              { value: 1, label: 'H1 (největší)' },
              { value: 2, label: 'H2' },
              { value: 3, label: 'H3' },
              { value: 4, label: 'H4' },
              { value: 5, label: 'H5' },
              { value: 6, label: 'H6 (nejmenší)' }
            ]},
          { name: 'text', label: 'Text nadpisu', type: 'text', required: true }
        ]
      }
    };
    return configs[this.type] || configs.link;
  }
  
  _setupEvents() {
    const form = this.overlay.querySelector('.texyla-dialog-form');
    const cancelBtn = this.overlay.querySelector('.texyla-dialog-cancel');
    
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this._submit(form);
    });
    
    cancelBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    
    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    }, { once: true });
    
    // Auto-focus první input
    const firstInput = form.querySelector('input, select');
    if (firstInput) firstInput.focus();
  }
  
  _submit(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    if (this.callback) {
      this.callback(data);
    }
    
    this.close();
  }
  
  close() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}