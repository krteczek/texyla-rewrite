(function () {
  function loadTheme(theme) {
    const href = `/texyla/themes/${theme}/theme.css`;
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function init(textarea) {
    const profile  = textarea.dataset.profile  || 'default';
    const theme    = textarea.dataset.theme    || 'default';
    const endpoint = textarea.dataset.endpoint || '/texyla/texyla.php';

    loadTheme(theme);

    // dočasně: tlačítko Náhled vedle textarea
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
        preview.innerHTML = await res.text();
      } catch (e) {
        preview.innerHTML = '<p class="texyla-error">Chyba sítě: ' + e.message + '</p>';
      }
    });
  }

  document.querySelectorAll('textarea.texyla').forEach(init);
})();