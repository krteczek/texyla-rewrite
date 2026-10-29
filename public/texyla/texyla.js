/**
 * Texyla – preview + toolbar podle profilu
 */
(function () {
  'use strict';

  /** @type {Record<string, Array<{id:string,label:string,marker:string,title:string}>>} */
  const PROFILES = {
    admin: [
      { id: 'bold',    label: 'B',   marker: '**',    title: 'Tučné' },
      { id: 'italic',  label: 'I',   marker: '*',     title: 'Kurzíva' },
      { id: 'code',    label: '</>', marker: '`',     title: 'Inline kód' },
      { id: 'link',    label: '🔗',  marker: 'LINK',  title: 'Odkaz' },
      { id: 'image',   label: '🖼️',  marker: 'IMAGE', title: 'Obrázek' },
      { id: 'heading', label: 'H',   marker: '### ',  title: 'Nadpis' },
      { id: 'quote',   label: '❝',   marker: '> ',    title: 'Citace' },
      { id: 'ul',      label: '•',   marker: '- ',    title: 'Seznam' },
      { id: 'ol',      label: '1.',  marker: '1) ',   title: 'Číslovaný seznam' },
      { id: 'codeblock', label: '{ }', marker: 'CODE', title: 'Blok kódu' },
      { id: 'hr',      label: '―',   marker: '\n---\n', title: 'Oddělovač' },
      { id: 'table',   label: '▦',   marker: 'TABLE', title: 'Tabulka' },
    ],
    forum: [
      { id: 'bold',   label: 'B',   marker: '**', title: 'Tučné' },
      { id: 'italic', label: 'I',   marker: '*',  title: 'Kurzíva' },
      { id: 'code',   label: '</>', marker: '`',  title: 'Inline kód' },
      { id: 'link',   label: '🔗',  marker: 'LINK', title: 'Odkaz' },
      { id: 'quote',  label: '❝',   marker: '> ', title: 'Citace' },
      { id: 'ul',     label: '•',   marker: '- ', title: 'Seznam' },
      { id: 'ol',     label: '1.',  marker: '1) ', title: 'Číslovaný seznam' },
    ],
    codeforum: [
      { id: 'bold',   label: 'B',   marker: '**', title: 'Tučné' },
      { id: 'italic', label: 'I',   marker: '*',  title: 'Kurzíva' },
      { id: 'code',   label: '</>', marker: '`',  title: 'Inline kód' },
      { id: 'link',   label: '🔗',  marker: 'LINK', title: 'Odkaz' },
      { id: 'quote',  label: '❝',   marker: '> ', title: 'Citace' },
      { id: 'ul',     label: '•',   marker: '- ', title: 'Seznam' },
      { id: 'ol',     label: '1.',  marker: '1) ', title: 'Číslovaný seznam' },
      { id: 'codeblock', label: '{ }', marker: 'CODE', title: 'Blok kódu' },
    ],
    default: [
      { id: 'bold',   label: 'B',   marker: '**', title: 'Tučné' },
      { id: 'italic', label: 'I',   marker: '*',  title: 'Kurzíva' },
      { id: 'code',   label: '</>', marker: '`',  title: 'Inline kód' },
      { id: 'link',   label: '🔗',  marker: 'LINK', title: 'Odkaz' },
    ],
  };

  const PAIR_MARKERS = {
    '**': true,
    '*': true,
    '`': true,
    '//': true,
    '^^': true,
    '__': true,
  };

  function loadTheme(theme) {
    const href = 'texyla/themes/' + theme + '/theme.css';
    if (document.querySelector('link[data-texyla-theme="' + theme + '"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.texylaTheme = theme;
    document.head.appendChild(link);
  }

  function wrapOrInsert(textarea, marker) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);

    let insert = '';
    let cursor = start;

    if (marker === 'LINK') {
      const text = selected || 'text';
      insert = '"' + text + '":[https://]';
      cursor = start + insert.length - 1; // kurzor před ]
    } else if (marker === 'IMAGE') {
      insert = '[* https:// .(popisek) *]';
      cursor = start + 3;
    } else if (marker === 'CODE') {
      insert = '/---code\n' + (selected || '') + '\n\\---';
      cursor = start + 10;
    } else if (marker === 'TABLE') {
      insert = '| sloupec 1 | sloupec 2\n|-----------|----------\n| buňka     | buňka';
      cursor = start + 2;
    } else if (PAIR_MARKERS[marker]) {
      if (selected) {
        insert = marker + selected + marker;
        cursor = start + insert.length;
      } else {
        insert = marker + marker;
        cursor = start + marker.length;
      }
    } else {
      // prefix na začátek řádku / výběru
      if (selected && selected.indexOf('\n') !== -1) {
        insert = selected
          .split('\n')
          .map(function (line) { return marker + line; })
          .join('\n');
      } else if (selected) {
        insert = marker + selected;
      } else {
        insert = marker;
      }
      cursor = start + insert.length;
    }

    textarea.value = value.slice(0, start) + insert + value.slice(end);
    textarea.focus();
    textarea.setSelectionRange(cursor, cursor);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function createToolbar(textarea, profile) {
    const buttons = PROFILES[profile] || PROFILES.default;
    const bar = document.createElement('div');
    bar.className = 'texyla-toolbar';
    bar.setAttribute('role', 'toolbar');

    buttons.forEach(function (btn) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'texyla-toolbar__btn';
      b.dataset.id = btn.id;
      b.title = btn.title;
      b.textContent = btn.label;
      b.addEventListener('click', function (e) {
        e.preventDefault();
        wrapOrInsert(textarea, btn.marker);
      });
      bar.appendChild(b);
    });

    return bar;
  }

  function createPreviewUI(textarea, toolbar) {
    const wrap = document.createElement('div');
    wrap.className = 'texyla-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'texyla-preview-btn';
    btn.textContent = 'Náhled';

    const preview = document.createElement('div');
    preview.className = 'texyla-preview';
    preview.hidden = true;

    const parent = textarea.parentNode;
    parent.insertBefore(wrap, textarea);
    wrap.appendChild(toolbar);
    wrap.appendChild(textarea);
    wrap.appendChild(btn);
    wrap.appendChild(preview);

    return { btn: btn, preview: preview };
  }

  async function fetchPreview(endpoint, source, profile) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/html',
      },
      body: JSON.stringify({
        texy_source: source,
        profile: profile,
      }),
    });
    return res.text();
  }

  function init(textarea) {
    const profile = textarea.dataset.profile || 'default';
    const theme = textarea.dataset.theme || 'default';
    const endpoint = textarea.dataset.endpoint || 'texyla/texyla.php';
    const debug = textarea.dataset.debug === '1';

    loadTheme(theme);

    const toolbar = createToolbar(textarea, profile);
    const ui = createPreviewUI(textarea, toolbar);
    let showingPreview = false;

    ui.btn.addEventListener('click', async function () {
      if (showingPreview) {
        ui.preview.hidden = true;
        textarea.hidden = false;
        toolbar.hidden = false;
        ui.btn.textContent = 'Náhled';
        showingPreview = false;
        return;
      }

      ui.btn.disabled = true;
      ui.btn.textContent = 'Načítám…';

      try {
        const html = await fetchPreview(endpoint, textarea.value, profile);

        ui.preview.innerHTML = '';
        const rendered = document.createElement('div');
        rendered.className = 'texyla-preview-rendered';
        rendered.innerHTML = html || '<p class="texyla-empty">Žádný obsah</p>';
        ui.preview.appendChild(rendered);

        if (debug) {
          const label = document.createElement('p');
          label.className = 'texyla-preview-source-label';
          label.textContent = 'Vygenerované HTML (debug):';
          const pre = document.createElement('pre');
          pre.className = 'texyla-preview-source';
          pre.textContent = html;
          ui.preview.appendChild(label);
          ui.preview.appendChild(pre);
        }

        textarea.hidden = true;
        toolbar.hidden = true;
        ui.preview.hidden = false;
        ui.btn.textContent = 'Editovat';
        showingPreview = true;
      } catch (err) {
        ui.preview.innerHTML =
          '<div class="texyla-error"><p>❌ Chyba sítě</p><small>' +
          (err && err.message ? err.message : String(err)) +
          '</small></div>';
        ui.preview.hidden = false;
        ui.btn.textContent = 'Náhled';
      } finally {
        ui.btn.disabled = false;
      }
    });
  }

  function boot() {
    document.querySelectorAll('textarea.texyla').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();