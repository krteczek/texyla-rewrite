/**
 * Mapa tlačítek: Texy klíč → definice tlačítka.
 * Tento soubor můžeš libovolně editovat.
 *
 * POZNÁMKA: Některé Texy klíče (např. html/tag, script, typography)
 * nemají smysl jako tlačítko, protože negenerují vložitelný text.
 * Proto zde nejsou. Toolbar se řídí pouze tímto seznamem.
 */
window.TexylaButtons = {
    // --- Základní formátování textu (Phrase) ---
    'phrase/strong':      { label: 'B',   marker: '**',    title: 'Tučné' },
    'phrase/em':          { label: 'I',   marker: '*',     title: 'Kurzíva' },
    'phrase/code':        { label: '</>', marker: '`',     title: 'Inline kód' },
    'phrase/ins':         { label: 'U',   marker: '++',    title: 'Vložený text (Underline)' },
    'phrase/del':         { label: 'S',   marker: '--',    title: 'Přeškrtnutý text (Strike)' },
    'phrase/sup':         { label: 'x²',  marker: '^^',    title: 'Horní index' },
    'phrase/sub':         { label: 'x₂',  marker: '__',    title: 'Dolní index' },

    // --- Odkazy ---
    'link':               { label: '🔗',  marker: 'LINK',  title: 'Odkaz' },
    'link/url':           { label: 'URL', marker: 'URL',   title: 'Holý odkaz' },
    'link/email':         { label: '@',   marker: 'EMAIL', title: 'E-mail' },

    // --- Obrázky ---
    'image':              { label: '🖼️',  marker: 'IMAGE', title: 'Obrázek' },
    'figure':             { label: 'Fig', marker: 'FIGURE', title: 'Obrázek s popisem' },

    // --- Nadpisy ---
    'heading/surrounded': { label: 'H',   marker: '### ',  title: 'Nadpis' },
    'heading/underlined': { label: 'H=',  marker: '=== ',  title: 'Nadpis (podtržený)' },

    // --- Bloky a seznamy ---
    'blockquote':         { label: '❝',   marker: '> ',    title: 'Citace' },
    'list':               { label: '•',   marker: '- ',    title: 'Odrážkový seznam' },
    'list/definition':    { label: '≡',   marker: 'DEF',   title: 'Definiční seznam' },
    'table':              { label: '▦',   marker: 'TABLE', title: 'Tabulka' },
    'horizline':          { label: '―',   marker: '\n---\n', title: 'Vodorovná čára' },
    'block/code':         { label: '{ }', marker: 'CODE',  title: 'Blok kódu' },
    'block/pre':          { label: 'Pre', marker: 'PRE',   title: 'Předformátovaný text' },

    // --- Ostatní (volitelné, často vypnuté) ---
    'emoticon':           { label: '☺',   marker: 'EMO',   title: 'Emotikon' },
};