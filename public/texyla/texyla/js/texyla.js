/**
 * Texyla – editor k textarey pro Texy! syntaxi
 *
 * Toolbar se generuje dynamicky z data-texyla-config (config.allowed).
 * Mapa tlačítek a jejich pořadí se načítá z config/buttons.js a config/order.js.
 * Žádné pevné profily – co je povolené v Texy, to se zobrazí.
 *
 * Všechny stavy konfigurace jsou ošetřeny vlastní hláškou.
 * Zastaralý prohlížeč → textarea bez toolbaru + legacy notice.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Konfigurace – načteno z config/buttons.js a config/order.js
  // ---------------------------------------------------------------------------

  const BUTTONS = window.TexylaButtons || {};
  const ORDER   = window.TexylaOrder   || [];

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
  // Podpora prohlížeče
  // ---------------------------------------------------------------------------

  function isTexylaSupported() {
    return !!(
      window.fetch &&
      window.Promise &&
      Object.assign &&
      document.body &&
      document.body.dataset &&
      typeof document.querySelectorAll === 'function'
    );
  }

  function showLegacyNotice() {
    document.querySelectorAll('textarea.texyla').forEach(function (ta) {
      var prev = ta.previousElementSibling;
      if (prev && prev.classList && prev.classList.contains('texyla-legacy-notice')) {
        return;
      }
      var note = document.createElement('p');
      note.className = 'texyla-legacy-notice';
      note.setAttribute('role', 'status');
      note.textContent =
        'Váš prohlížeč je zastaralý. Editor Texyla není k dispozici; ' +
        'můžete psát přímo do pole níže (Texy! syntax). ' +
        'Pro plný editor použijte aktuální Chrome, Firefox, Edge nebo Safari.';
      ta.parentNode.insertBefore(note, ta);
    });
  }

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
   * @returns {{ bar: HTMLElement, count: number }}
   */
  function buildToolbar(allowed, textarea) {
    const bar = document.createElement('div');
    bar.className = 'texyla-toolbar';
    bar.setAttribute('role', 'toolbar');

    let count = 0;

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
      count++;
    }

    return { bar: bar, count: count };
  }

  // ---------------------------------------------------------------------------
  // Validace konfigurace
  // ---------------------------------------------------------------------------

  /**
   * @returns {{ config: object|null, state: string|null }}
   */
  function parseConfig(textarea) {
    const raw = textarea.dataset.texylaConfig;

    if (raw === undefined) {
      return { config: null, state: 'missing' };
    }
    if (raw.trim() === '') {
      return { config: null, state: 'empty' };
    }

    let config;
    try {
      config = JSON.parse(raw);
    } catch (e) {
      return { config: null, state: 'invalid-json' };
    }

    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
      return { config: null, state: 'not-object' };
    }
    if (!('allowed' in config)) {
      return { config: config, state: 'missing-allowed' };
    }
    if (
      typeof config.allowed !== 'object' ||
      config.allowed === null ||
      Array.isArray(config.allowed)
    ) {
      return { config: config, state: 'invalid-allowed' };
    }

    return { config: config, state: null };
  }

  /**
   * @returns {HTMLElement|null}
   */
  function buildNotice(state, allowed, buttonCount) {
    if (buttonCount > 0) {
      return null;
    }

    const notice = document.createElement('p');
    notice.className = 'texyla-notice';

    if (state === 'missing') {
      notice.textContent =
        'Konfigurace Texy nebyla načtena. Aplikace nepředala data-texyla-config. ' +
        'Zkontrolujte, že aplikace předává nastavení Texy do textarey.';
      return notice;
    }

    if (state === 'empty') {
      notice.textContent =
        'Konfigurace Texy je prázdná. Aplikace předala prázdný data-texyla-config. ' +
        'Zkontrolujte, že aplikace generuje platný JSON.';
      return notice;
    }

    if (state === 'invalid-json') {
      notice.textContent =
        'Konfigurace Texy je neplatná (data-texyla-config nelze parsovat jako JSON). ' +
        'Zkontrolujte, že aplikace generuje platný JSON.';
      return notice;
    }

    if (state === 'not-object') {
      notice.textContent =
        'Konfigurace Texy nemá správný tvar (očekáván objekt). ' +
        'Zkontrolujte, že aplikace posílá objekt, ne pole ani skalární hodnotu.';
      return notice;
    }

    if (state === 'missing-allowed') {
      notice.textContent =
        'Konfigurace Texy neobsahuje klíč "allowed". ' +
        'Zkontrolujte, že aplikace předává allowed z Texy instance.';
      return notice;
    }

    if (state === 'invalid-allowed') {
      notice.textContent =
        'Konfigurace Texy má neplatný klíč "allowed" (očekáván objekt). ' +
        'Zkontrolujte, že aplikace posílá allowed jako objekt, ne pole ani skalár.';
      return notice;
    }

    const allowedKeys = Object.keys(allowed);
    const allowedTrue = Object.values(allowed).some(function (v) { return v === true; });

    if (allowedKeys.length === 0) {
      notice.textContent =
        'Konfigurace Texy neobsahuje žádné elementy v "allowed". ' +
        'Zkontrolujte, že aplikace předává allowed z Texy instance.';
    } else if (!allowedTrue) {
      notice.textContent =
        'Nastavení Texy je úplně vypnuto. Povolte v Texy to, co potřebujete, ' +
        'a tlačítka se doplní do toolbaru.';
    } else {
      notice.textContent =
        'Texy je nakonfigurovaná, ale pro povolené elementy nejsou v toolbaru ' +
        'definována tlačítka. Zkontrolujte config/buttons.js a config/order.js.';
    }

    return notice;
  }

  // ---------------------------------------------------------------------------
  // Náhled
  // ---------------------------------------------------------------------------

  function createPreviewUI(textarea, toolbar, notice) {
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

    wrap.appendChild(notice || toolbar);
    wrap.appendChild(textarea);
    wrap.appendChild(btn);
    wrap.appendChild(preview);

    return { btn: btn, preview: preview, toolbar: toolbar, notice: notice };
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

    const parsed = parseConfig(textarea);
    const config = parsed.config;
    const configState = parsed.state;

    const allowed = (configState === null && config && config.allowed)
      ? config.allowed
      : {};

    const built = buildToolbar(allowed, textarea);
    const toolbar = built.bar;
    const buttonCount = built.count;

    const notice = buildNotice(configState, allowed, buttonCount);

    loadTheme(theme);

    const ui = createPreviewUI(textarea, toolbar, notice);
    let showingPreview = false;

    ui.btn.addEventListener('click', async function () {
      if (showingPreview) {
        ui.preview.hidden = true;
        textarea.hidden = false;
        if (ui.notice) {
          ui.notice.hidden = false;
        } else {
          ui.toolbar.hidden = false;
        }
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
        if (ui.notice) {
          ui.notice.hidden = true;
        } else {
          ui.toolbar.hidden = true;
        }
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
    if (!isTexylaSupported()) {
      showLegacyNotice();
      return;
    }
    document.querySelectorAll('textarea.texyla').forEach(init);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();