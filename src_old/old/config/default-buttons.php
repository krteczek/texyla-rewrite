<?php
//  /src/config/default-buttons.php
/**
 * Default button mapping for Texy! modules
 * 
 * This file contains the default mapping between Texy! module names
 * and Texyla toolbar button configurations.
 * 
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @copyright (c) 2024
 * @license MIT
 */

declare(strict_types=1);

return [
    /* ======================================================================
       INLINE FORMATTING (PHRASE MODULES)
       ====================================================================== */
    
    /**
     * Bold text: **text**
     * @see https://texy.info/en/syntax#bold
     */
    'phrase/strong' => [
        'label' => 'B',
        'marker' => '**',
        'title' => 'Tučný text (Ctrl+B)',
        'group' => 'inline',
        'priority' => 100,
        'keyboard' => 'Ctrl+B'
    ],
    
    /**
     * Italic text: *text* or //text//
     * @see https://texy.info/en/syntax#italic
     */
    'phrase/em' => [
        'label' => 'I',
        'marker' => '*',
        'title' => 'Kurzíva (Ctrl+I)',
        'group' => 'inline',
        'priority' => 90,
        'keyboard' => 'Ctrl+I'
    ],
    
    /**
     * Alternative italic: //text//
     */
    'phrase/em-alt' => [
        'label' => 'I',
        'marker' => '//',
        'title' => 'Kurzíva (//)',
        'group' => 'inline',
        'priority' => 89
    ],
    
    /**
     * Inline code: `code`
     * @see https://texy.info/en/syntax#code
     */
    'phrase/code' => [
        'label' => '</>',
        'marker' => '`',
        'title' => 'Inline kód',
        'group' => 'inline',
        'priority' => 80
    ],
    
    /**
     * Superscript: ^^text^^
     */
    'phrase/sup' => [
        'label' => '^',
        'marker' => '^^',
        'title' => 'Horní index',
        'group' => 'inline',
        'priority' => 70
    ],
    
    /**
     * Subscript: __text__
     */
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
    
    /**
     * Reference link: [text](url)
     * @see https://texy.info/en/syntax#links
     */
    'link/reference' => [
        'label' => '🔗',
        'marker' => 'DIALOG:link',
        'title' => 'Vložit odkaz',
        'group' => 'dialogs',
        'priority' => 200,
        'dialog' => 'link',
        'keyboard' => 'Ctrl+K'
    ],
    
    /**
     * Email link (auto-detected)
     */
    'link/email' => [
        'label' => '📧',
        'marker' => null, // Auto-detected, no button
        'title' => 'Email odkaz',
        'group' => 'auto',
        'priority' => 190,
        'auto' => true,
        'hidden' => true
    ],
    
    /* ======================================================================
       IMAGES
       ====================================================================== */
    
    /**
     * Image: [* alt *](url)
     * @see https://texy.info/en/syntax#images
     */
    'image' => [
        'label' => '🖼️',
        'marker' => 'DIALOG:image',
        'title' => 'Vložit obrázek',
        'group' => 'dialogs',
        'priority' => 300,
        'dialog' => 'image'
    ],
    
    /**
     * Figure (image with caption)
     */
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
    
    /**
     * Heading: ### Text
     * @see https://texy.info/en/syntax#toc
     */
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
    
    /**
     * Code block: ```code```
     * @see https://texy.info/en/syntax#code-block
     */
    'block/code' => [
        'label' => '</>',
        'marker' => '```',
        'title' => 'Blok kódu',
        'group' => 'blocks',
        'priority' => 500
    ],
    
    /**
     * Code block with language: /--code php ... \--
     */
    'block/code-language' => [
        'label' => '</>+',
        'marker' => 'DIALOG:code-block',
        'title' => 'Blok kódu s jazykem',
        'group' => 'dialogs',
        'priority' => 510,
        'dialog' => 'code-block'
    ],
    
    /* ======================================================================
       QUOTES
       ====================================================================== */
    
    /**
     * Blockquote: > text
     * @see https://texy.info/en/syntax#blockquote
     */
    'block/quote' => [
        'label' => '💬',
        'marker' => '> ',
        'title' => 'Citace',
        'group' => 'blocks',
        'priority' => 600
    ],
    
    /* ======================================================================
       LISTS
       ====================================================================== */
    
    /**
     * Bullet list: - item
     * @see https://texy.info/en/syntax#lists
     */
    'list' => [
        'label' => '•',
        'marker' => '- ',
        'title' => 'Odrážkový seznam',
        'group' => 'lists',
        'priority' => 700
    ],
    
    /**
     * Numbered list: 1) item
     */
    'list/numbered' => [
        'label' => '1.',
        'marker' => '1) ',
        'title' => 'Číslovaný seznam',
        'group' => 'lists',
        'priority' => 690
    ],
    
    /* ======================================================================
       TABLES
       ====================================================================== */
    
    /**
     * Table: | cell | cell |
     * @see https://texy.info/en/syntax#tables
     */
    'table' => [
        'label' => '┃',
        'marker' => '| ',
        'title' => 'Tabulka',
        'group' => 'tables',
        'priority' => 800
    ],
    
    /* ======================================================================
       HORIZONTAL RULES
       ====================================================================== */
    
    /**
     * Horizontal rule: ---
     * @see https://texy.info/en/syntax#horizontal-line
     */
    'horizline' => [
        'label' => '―',
        'marker' => '---',
        'title' => 'Horizontální čára',
        'group' => 'dividers',
        'priority' => 900
    ],
    
    /* ======================================================================
       AUTOMATIC FEATURES (no buttons)
       ====================================================================== */
    
    /**
     * Typography (automatic)
     */
    'typography' => [
        'label' => '¶',
        'marker' => null,
        'title' => 'Typografické úpravy',
        'group' => 'auto',
        'priority' => 950,
        'auto' => true,
        'hidden' => true
    ],
    
    /**
     * Long words (automatic)
     */
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