(function () {
  function loadTheme(theme) {
    // relativně k demo.php → texyla/themes/...
    const href = 'texyla/themes/' + theme + '/theme.css';
    if (document.querySelector('link[data-texyla-theme="' + theme + '"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.texylaTheme = theme;
    document.head.appendChild(link);
  }

  function init(textarea) {
    const profile  = textarea.dataset.profile  || 'default';
    const theme    = textarea.dataset.theme    || 'default';
    const endpoint = textarea.dataset.endpoint || 'texyla/texyla.php';

    loadTheme(theme);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Náhled';
    btn.style.display = 'block';
    btn.style.marginTop = '0.5rem';
    textarea.after(btn);

    const preview = document.createElement('div');
    preview.className = 'texyla-preview';
    preview.style.marginTop = '1rem';
    preview.style.border = '1px solid #ccc';
    preview.style.padding = '1rem';
    btn.after(preview);

    btn.addEventListener('click', async () => {
      preview.textContent = 'Načítám…';
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'text/html' },
          body: JSON.stringify({
            texy_source: textarea.value,
            profile: profile
          })
        });
        // preview.innerHTML = await res.text();
btn.addEventListener('click', async () => {
  preview.textContent = 'Načítám…';
  const debug = textarea.dataset.debug === '1';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/html' },
      body: JSON.stringify({
        texy_source: textarea.value,
        profile: profile
      })
    });
    const html = await res.text();

    // vykreslený náhled
    const rendered = document.createElement('div');
    rendered.className = 'texyla-preview-rendered';
    rendered.innerHTML = html || '<p class="texyla-empty">Žádný obsah</p>';

    // surové HTML (jen pro vývoj)
    const source = document.createElement('pre');
    source.className = 'texyla-preview-source';
    source.textContent = html; // textContent = uvidíš tagy, ne render

    preview.innerHTML = '';
    preview.appendChild(rendered);
if (debug) {
  

    const label = document.createElement('p');
    label.className = 'texyla-preview-source-label';
    label.textContent = 'Vygenerované HTML (debug):';
    preview.appendChild(label);
    preview.appendChild(source);
}
  } catch (e) {
    preview.innerHTML = '<p class="texyla-error">Chyba sítě: ' + e.message + '</p>';
  }
});        
      } catch (e) {
        preview.innerHTML = '<p class="texyla-error">Chyba sítě: ' + e.message + '</p>';
      }
    });
  }

  document.querySelectorAll('textarea.texyla').forEach(init);
})();