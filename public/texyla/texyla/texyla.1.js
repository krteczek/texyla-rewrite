/**
 * Texyla – editor k textarey pro Texy! syntaxi
 *
 * Toolbar se generuje dynamicky z data-texyla-config (config.allowed).
 * Žádné pevné profily – co je povolené v Texy, to se zobrazí.
 */
(function () {
  'use strict';

  /**
   * Mapa: Texy klíč → tlačítko v toolbaru.
   * Pokud klíč v allowed existuje a je true, tlačítko se zobrazí.
   */
  const BUTTONS = {
    'phrase/strong':      { label: 'B',   marker: '**',    title: 'Tučné' },
    'phrase/em':          { label: 'I',   marker: '*',     title: 'Kurzíva' },
    'phrase/code':        { label: '</>', marker: '`',     title: 'Inline kód' },
    'link':               { label: '🔗',  marker: 'LINK',  title: 'Odkaz' },
    'image':              { label: '🖼️',  marker: 'IMAGE', title: 'Obrázek' },
    'heading/surrounded': { label: 'H',   marker: '### ',  title: 'Nadpis' },
    'heading/underlined': { label: 'H',   marker: '### ',  title: 'Nadpis' },
    'blockquote':         { label: '❝',   marker: '> ',    title: 'Citace' },
    'list':               { label: '•',   marker: '- ',    title: 'Seznam' },
    'list/definition':    { label: '≡',   marker: 'DEF',   title: 'Definice' },
    'block/code':         { label: '{ }', marker: 'CODE',  title: 'Blok kódu' },
    'horizline':          { label: '―',   marker: '\n---\n', title: 'Oddělovač' },
    'table':              { label: '▦',   marker: 'TABLE', title: 'Tabulka' },
    'phrase/sup':         { label: 'x²',  marker: '^^',    title: 'Horní index' },
    'phrase/sub':         { label: 'x₂',  marker: '__',    title: 'Dolní index' },
  };

  /**
   * Pevné pořadí tlačítek. Klíče, které tu nejsou, se nezobrazí,
   * i když jsou v allowed. Pořadí odpovídá běžnému workflow.
   */
  const ORDER = [
    'phrase/strong',
    'phrase/em',
    'phrase/code',
    'phrase/sup',
    'phrase/sub',
    'link',
    'image',
    'heading/surrounded',
    'blockquote',
    'list',
    'list/definition',
    'block/code',
    'horizline',
    'table',
  ];

  /** Výchozí sada, když data-texyla-config chybí. */
  const DEFAULT_ALLOWED = {
    'phrase/strong': true,
    'phrase/em':     true,
    'phrase/code':   true,
    'link':          true,
  };

  /** Markery, které se vkládají jako pár (prefix + suffix). */
  const PAIR_MARKERS = {
    '**': true,
    '*':  true,
    '`':  true,
    '//': true,
    '^^': true,
    '__': true,
  };

  // ---------------------------------------------------------------------------
  // Téma
  // ---------------------------------------------------------------------------

  function loadTheme(theme) {
    const href = 'texyla/themes/' + theme + '/theme.css';
    if (document.querySelector('link[data-texyla-theme="' + theme + '"]')) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.texylaTheme = theme;
    document.head.appendChild(link);
  }

  // ---------------------------------------------------------------------------
  // Vkládání markerů
  // ---------------------------------------------------------------------------

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
      cursor = start + insert.length - 1;
    } else if (marker === 'IMAGE') {
      insert = '[* https:// .(popisek) *]';
      cursor = start + 3;
    } else if (marker === 'CODE') {
      insert = '/---code\n' + (selected || '') + '\n\\---';
      cursor = start + ('/---code\n').length;
    } else if (marker === 'TABLE') {
      insert = '| sloupec 1 | sloupec 2\n|-----------|----------\n| buňka     | buňka';
      cursor = start + 2;
    } else if (marker === 'DEF') {
      insert = 'termín:\n  - vysvětlení';
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

  // ---------------------------------------------------------------------------
  // Toolbar
  // ---------------------------------------------------------------------------

  function makeButton(def) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'texyla-toolbar__btn';
    b.title = def.title;
    b.textContent = def.label;
    return b;
  }

  /**
   * Sestaví toolbar z allowed.
   * Projde ORDER, a pokud je klíč v allowed true a existuje BUTTONS[klíč],
   * přidá tlačítko. Tím je zaručeno pevné pořadí i to, že se nezobrazí
   * tlačítko, které Texy nezná.
   */
  function buildToolbar(allowed, textarea) {
    const bar = document.createElement('div');
    bar.className = 'texyla-toolbar';
    bar.setAttribute('role', 'toolbar');

    for (const key of ORDER) {
      if (!allowed[key]) {
        continue;
      }
      const def = BUTTONS[key];
      if (!def) {
        continue;
      }
      const btn = makeButton(def);
      btn.dataset.id = key;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        wrapOrInsert(textarea, def.marker);
      });
      bar.appendChild(btn);
    }

    return bar;
  }

  // ---------------------------------------------------------------------------
  // Náhled
  // ---------------------------------------------------------------------------

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

  async function fetchPreview(endpoint, source, config) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/html',
      },
      body: JSON.stringify({
        texy_source: source,
        config: config,
      }),
    });
    return res.text();
  }

  // ---------------------------------------------------------------------------
  // Inicializace jedné textarey
  // ---------------------------------------------------------------------------

  function init(textarea) {
    const theme = textarea.dataset.theme || 'default';
    const endpoint = textarea.dataset.endpoint || 'texyla/texyla.php';
    const debug = textarea.dataset.debug === '1';

    let config = {};
    if (textarea.dataset.texylaConfig) {
      try {
        config = JSON.parse(textarea.dataset.texylaConfig);
      } catch (e) {
        console.warn('Texyla: neplatný data-texyla-config', e);
        config = {};
      }
    }

    const allowed = config.allowed || DEFAULT_ALLOWED;

    loadTheme(theme);

    const toolbar = buildToolbar(allowed, textarea);
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
        const html = await fetchPreview(endpoint, textarea.value, config);

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

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  function boot() {
    document.querySelectorAll('textarea.texyla').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();