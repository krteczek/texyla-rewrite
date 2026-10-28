<?php
/**
 * Default button mapping for Texy! modules
 *
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @license MIT
 */

declare(strict_types=1);

return [
    /* ======================================================================
       INLINE FORMATTING
       ====================================================================== */

    'phrase/strong' => [
        'label' => 'B',
        'marker' => '**',
        'title' => 'Tučný text (Ctrl+B)',
        'group' => 'inline',
        'priority' => 100,
        'keyboard' => 'Ctrl+B'
    ],

    'phrase/em' => [
        'label' => 'I',
        'marker' => '*',
        'title' => 'Kurzíva (Ctrl+I)',
        'group' => 'inline',
        'priority' => 90,
        'keyboard' => 'Ctrl+I'
    ],

    'phrase/em-alt' => [
        'label' => 'I',
        'marker' => '//',
        'title' => 'Kurzíva (//)',
        'group' => 'inline',
        'priority' => 89
    ],

    'phrase/code' => [
        'label' => '</>',
        'marker' => '`',
        'title' => 'Inline kód',
        'group' => 'inline',
        'priority' => 80
    ],

    'phrase/sup' => [
        'label' => '^',
        'marker' => '^^',
        'title' => 'Horní index',
        'group' => 'inline',
        'priority' => 70
    ],

    'phrase/sub' => [
        'label' => '_',
        'marker' => '__',
        'title' => 'Dolní index',
        'group' => 'inline',
        'priority' => 69
    ],

    /* ======================================================================
       LINKS
       ====================================================================== */

    'link/reference' => [
        'label' => '🔗',
        'marker' => 'DIALOG:link',
        'title' => 'Vložit odkaz',
        'group' => 'dialogs',
        'priority' => 200,
        'dialog' => 'link',
        'keyboard' => 'Ctrl+K'
    ],

    'link/email' => [
        'label' => '📧',
        'marker' => null,
        'title' => 'Email odkaz',
        'group' => 'auto',
        'priority' => 190,
        'auto' => true,
        'hidden' => true
    ],

    /* ======================================================================
       IMAGES
       ====================================================================== */

    'image' => [
        'label' => '🖼️',
        'marker' => 'DIALOG:image',
        'title' => 'Vložit obrázek',
        'group' => 'dialogs',
        'priority' => 300,
        'dialog' => 'image'
    ],

    'figure' => [
        'label' => '🖼️💬',
        'marker' => 'DIALOG:image',
        'title' => 'Obrázek s popiskou',
        'group' => 'dialogs',
        'priority' => 290,
        'dialog' => 'image'
    ],

    /* ======================================================================
       HEADINGS
       ====================================================================== */

    'heading/surrounded' => [
        'label' => 'H',
        'marker' => 'DIALOG:heading',
        'title' => 'Vložit nadpis',
        'group' => 'dialogs',
        'priority' => 400,
        'dialog' => 'heading'
    ],

    /* ======================================================================
       CODE BLOCKS
       ====================================================================== */

    'block/code' => [
        'label' => '</>',
        'marker' => '```',
        'title' => 'Blok kódu',
        'group' => 'blocks',
        'priority' => 500
    ],

    'block/code-language' => [
        'label' => '</>+',
        'marker' => 'DIALOG:code-block',
        'title' => 'Blok kódu s jazykem',
        'group' => 'dialogs',
        'priority' => 510,
        'dialog' => 'code-block'
    ],

    /* ======================================================================
       QUOTES / LISTS / TABLES / HR
       ====================================================================== */

    'block/quote' => [
        'label' => '💬',
        'marker' => '> ',
        'title' => 'Citace',
        'group' => 'blocks',
        'priority' => 600
    ],

    'list' => [
        'label' => '•',
        'marker' => '- ',
        'title' => 'Odrážkový seznam',
        'group' => 'lists',
        'priority' => 700
    ],

    'list/numbered' => [
        'label' => '1.',
        'marker' => '1) ',
        'title' => 'Číslovaný seznam',
        'group' => 'lists',
        'priority' => 690
    ],

    'table' => [
        'label' => '┃',
        'marker' => '| ',
        'title' => 'Tabulka',
        'group' => 'tables',
        'priority' => 800
    ],

    'horizline' => [
        'label' => '―',
        'marker' => '---',
        'title' => 'Horizontální čára',
        'group' => 'dividers',
        'priority' => 900
    ],

    /* ======================================================================
       AUTOMATIC (hidden)
       ====================================================================== */

    'typography' => [
        'label' => '¶',
        'marker' => null,
        'title' => 'Typografické úpravy',
        'group' => 'auto',
        'priority' => 950,
        'auto' => true,
        'hidden' => true
    ],

    'longwords' => [
        'label' => '✂️',
        'marker' => null,
        'title' => 'Dělení dlouhých slov',
        'group' => 'auto',
        'priority' => 940,
        'auto' => true,
        'hidden' => true
    ]
];