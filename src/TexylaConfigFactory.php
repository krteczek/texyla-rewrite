<?php
/**
 * Project: Texyla Rewrite Dream Team
 * File: /texyla-rewrite/src/TexylaConfigFactory.php
 * Description: Automatická konfigurace Texyly z Texy! instance
 * 
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @license MIT
 * @version 1.1.0
 */

declare(strict_types=1);

namespace Texyla;

/**
 * Továrna pro automatické vytváření Texyly konfigurací z Texy! instancí
 * 
 * Hlavní funkcionalita:
 * 1. Čte co Texy umí ($texy->allowed[])
 * 2. Automaticky generuje toolbar tlačítka
 * 3. Vytváří JSON konfiguraci pro Texylu
 * 4. Podporuje dialogová tlačítka pro komplexní syntaxe
 */
class TexylaConfigFactory
{
    /**
     * KOMPLETNÍ MAPA všech Texy! 3.2 syntaxí → Texyla tlačítek
     * Podle oficiální dokumentace: https://texy.info/cs/konfigurace
     */
    private static $completeSyntaxMap = [
        // === PHRASE / INLINE FORMÁTOVÁNÍ ===
        'phrase/strong' => [          // **tučné**
            'label' => 'B', 
            'marker' => '**', 
            'class' => 'texyla-bold',
            'title' => 'Tučné (Ctrl+B)',
            'group' => 'inline',
            'priority' => 100
        ],
        'phrase/em' => [              // *kurzíva* (primární)
            'label' => 'I', 
            'marker' => '*', 
            'class' => 'texyla-italic',
            'title' => 'Kurzíva (*) (Ctrl+I)', 
            'group' => 'inline',
            'priority' => 90
        ],
        'phrase/em-alt' => [          // //kurzíva// (alternativní)
            'label' => 'I', 
            'marker' => '//', 
            'class' => 'texyla-italic',
            'title' => 'Kurzíva (//)',
            'group' => 'inline', 
            'priority' => 89
        ],
        'phrase/code' => [            // `kód`
            'label' => '`', 
            'marker' => '`', 
            'class' => 'texyla-code',
            'title' => 'Inline kód',
            'group' => 'inline',
            'priority' => 80
        ],
        'phrase/sup' => [             // ^^horní index^^
            'label' => '^', 
            'marker' => '^^', 
            'title' => 'Horní index',
            'group' => 'inline',
            'priority' => 70
        ],
        'phrase/sub' => [             // __dolní index__
            'label' => '_', 
            'marker' => '__', 
            'title' => 'Dolní index',
            'group' => 'inline',
            'priority' => 69
        ],
        'phrase/ins' => [             // ++vložené++
            'label' => '+', 
            'marker' => '++', 
            'title' => 'Vložený text',
            'group' => 'inline',
            'priority' => 60
        ],
        'phrase/del' => [             // --smazané--
            'label' => '−', 
            'marker' => '--', 
            'title' => 'Smazaný text',
            'group' => 'inline',
            'priority' => 59
        ],
        
        // === ODKAZY ===
        'link/reference' => [         // [odkaz](url)
            'label' => '🔗', 
            'marker' => 'DIALOG:link', // Dialog místo markeru
            'class' => 'texyla-link',
            'title' => 'Vložit odkaz (Ctrl+K)',
            'group' => 'dialogs',
            'priority' => 200,
            'dialog' => 'link'
        ],
        'link/email' => [             // email@example.com (automatické)
            'label' => '📧', 
            'marker' => null,         // žádný marker - automatická detekce
            'title' => 'Email odkaz',
            'group' => 'links',
            'priority' => 190,
            'auto' => true            // speciální - automatická detekce
        ],
        'link/url' => [               // https://example.com (automatické)
            'label' => '🌐', 
            'marker' => null,         // žádný marker - automatická detekce
            'title' => 'URL odkaz',
            'group' => 'links', 
            'priority' => 189,
            'auto' => true            // speciální - automatická detekce
        ],
        'link/definition' => [        // definice referencí [ref]: url
            'label' => '📎', 
            'marker' => null,         // žádný marker v toolbaru
            'title' => 'Definice odkazu',
            'group' => 'links',
            'priority' => 188,
            'hidden' => true          // nezobrazovat v toolbaru
        ],
        
        // === OBRAZKY ===
        'image' => [                  // [* obrázek *]
            'label' => '🖼️', 
            'marker' => 'DIALOG:image', // Dialog místo markeru
            'class' => 'texyla-image',
            'title' => 'Vložit obrázek',
            'group' => 'dialogs',
            'priority' => 300,
            'dialog' => 'image'
        ],
        'figure' => [                 // obrázek s popiskou (rozšíření image)
            'label' => '🖼️💬', 
            'marker' => 'DIALOG:image', // stejný dialog jako image
            'title' => 'Obrázek s popiskou',
            'group' => 'dialogs',
            'priority' => 290,
            'dialog' => 'image'
        ],
        
        // === BLOKOVÉ ELEMENTY ===
        'block/code' => [             // ```blok kódu```
            'label' => '</>', 
            'marker' => '```', 
            'class' => 'texyla-code',
            'title' => 'Blok kódu',
            'group' => 'blocks',
            'priority' => 400
        ],
        'block/code-language' => [    // /--code php
            'label' => '</>+', 
            'marker' => 'DIALOG:code-block', // Dialog pro výběr jazyka
            'title' => 'Blok kódu s jazykem',
            'group' => 'dialogs',
            'priority' => 395,
            'dialog' => 'code-block'
        ],
        'block/quote' => [            // > citace
            'label' => '💬', 
            'marker' => '>', 
            'class' => 'texyla-quote',
            'title' => 'Citace',
            'group' => 'blocks',
            'priority' => 390
        ],
        'blocks' => [                 // /-- \-- obecné bloky
            'label' => '▦', 
            'marker' => '/--', 
            'title' => 'Obecný blok',
            'group' => 'blocks',
            'priority' => 385
        ],
        
        // === NADPISY ===
        'heading/surrounded' => [     // ### nadpis (ohraničené)
            'label' => 'H', 
            'marker' => 'DIALOG:heading', // Dialog pro výběr úrovně
            'class' => 'texyla-heading',
            'title' => 'Vložit nadpis',
            'group' => 'dialogs',
            'priority' => 500,
            'dialog' => 'heading'
        ],
        'heading/underlined' => [     // podtržené nadpisy
            'label' => 'H_', 
            'marker' => null,         // žádný marker - jen syntaxe
            'title' => 'Podtržený nadpis',
            'group' => 'headings',
            'priority' => 490,
            'hidden' => true          // nezobrazovat v toolbaru
        ],
        
        // === SEZNAMY ===
        'list' => [                   // - seznam (odrážkový)
            'label' => '•', 
            'marker' => '-', 
            'title' => 'Odrážkový seznam',
            'group' => 'lists',
            'priority' => 600
        ],
        'list/numbered' => [          // 1) seznam (číslovaný)
            'label' => '1.', 
            'marker' => '1)', 
            'title' => 'Číslovaný seznam',
            'group' => 'lists',
            'priority' => 590
        ],
        'list/definition' => [        // definiční seznam
            'label' => '📖', 
            'marker' => ':', 
            'title' => 'Definiční seznam',
            'group' => 'lists',
            'priority' => 580
        ],
        
        // === TABULKY ===
        'table' => [                  // | tabulka |
            'label' => '┃', 
            'marker' => '|', 
            'title' => 'Tabulka (2×2)',
            'group' => 'tables',
            'priority' => 700
        ],
        
        // === HORIZONTÁLNÍ ČÁRY ===
        'horizline' => [              // ---
            'label' => '―', 
            'marker' => '---', 
            'title' => 'Horizontální čára',
            'group' => 'dividers',
            'priority' => 800
        ],
        
        // === HTML VE VSTUPU ===
        'html/tag' => [               // HTML tagy ve vstupu
            'label' => '</>', 
            'marker' => null,         // žádný marker
            'title' => 'HTML tag',
            'group' => 'html',
            'priority' => 900,
            'hidden' => true          // bezpečnost - nezobrazovat
        ],
        'html/comment' => [           // HTML komentáře ve vstupu
            'label' => '💬', 
            'marker' => null,         // žádný marker
            'title' => 'HTML komentář',
            'group' => 'html', 
            'priority' => 890,
            'hidden' => true          // bezpečnost - nezobrazovat
        ],
        
        // === AUTOMATICKÉ ÚPRAVY ===
        'typography' => [             // typografické úpravy
            'label' => '¶', 
            'marker' => null,         // automatické
            'title' => 'Typografie',
            'group' => 'auto',
            'priority' => 950,
            'auto' => true,           // automatické
            'hidden' => true          // nezobrazovat v toolbaru
        ],
        'longwords' => [              // dělení dlouhých slov
            'label' => '✂️', 
            'marker' => null,         // automatické
            'title' => 'Dělení slov',
            'group' => 'auto',
            'priority' => 940,
            'auto' => true,           // automatické
            'hidden' => true          // nezobrazovat v toolbaru
        ],
        'emoticon' => [               // emotikony :-)
            'label' => '😊', 
            'marker' => null,         // automatické
            'title' => 'Emotikony',
            'group' => 'auto',
            'priority' => 930,
            'auto' => true,           // automatické
            'hidden' => true          // nezobrazovat v toolbaru
        ],
    ];

    /**
     * Vrátí Texy! instanci a JSON konfiguraci pro daný kontext
     * 
     * @param string $context Název kontextu ('admin', 'forum', 'default')
     * @return array [\Texy\Texy, string] Texy objekt a JSON konfigurace tlačítek
     * @throws \RuntimeException Pokud se nepodaří vytvořit Texy instanci
     */
    public static function getContextSetup(string $context): array
    {
        // 1. Vytvoření Texy! instance pro daný kontext
        $texyObject = self::createTexyForContext($context);
        
        // 2. AUTOMATICKÉ generování tlačítek z Texy configu
        $markers = self::autoGenerateFromTexy($texyObject);
        
        // 3. Příprava JSON konfigurace pro frontend
        $jsonConfig = self::prepareJsonConfig($markers);
        
        return [$texyObject, $jsonConfig];
    }

    /**
     * Hlavní metoda pro integraci Texyly do existujících aplikací
     * 
     * @param \Texy\Texy $texy Existující Texy! instance
     * @param array $options Volby pro generování tlačítek
     * @return array [\Texy\Texy, string] Původní Texy + JSON konfigurace
     */
    public static function createForExistingTexy(\Texy\Texy $texy, array $options = []): array
    {
        // 1. Automaticky vygenerovat tlačítka z existující Texy
        $markers = self::autoGenerateFromTexy($texy, $options);
        
        // 2. Připravit JSON pro frontend
        $jsonConfig = self::prepareJsonConfig($markers);
        
        // 3. Vrátit původní Texy + konfiguraci (Texy zůstává původní instance!)
        return [$texy, $jsonConfig];
    }

    /**
     * Automaticky vygeneruje Texyla konfiguraci z Texy instance
     * 
     * @param \Texy\Texy $texy Texy! instance
     * @param array $options Volby generování
     * @return array Konfigurace tlačítek pro Texylu
     */
    public static function autoGenerateFromTexy(\Texy\Texy $texy, array $options = []): array
    {
        $defaultOptions = [
            'show_auto' => false,     // nezobrazovat automatické funkce
            'show_hidden' => false,   // nezobrazovat skryté
            'show_advanced' => false, // nezobrazovat pokročilé
            'groups' => null,         // všechny skupiny (null = všechny)
            'include_dialogs' => true, // zahrnout dialogová tlačítka
        ];
        $options = array_merge($defaultOptions, $options);
        
        $buttons = [];
        
        foreach (self::$completeSyntaxMap as $syntax => $config) {
            // 1. Kontrola zda je syntaxe povolena v Texy
            if (!isset($texy->allowed[$syntax]) || $texy->allowed[$syntax] !== true) {
                continue;
            }
            
            // 2. Filtry podle options
            if (!$options['show_auto'] && !empty($config['auto'])) {
                continue;
            }
            if (!$options['show_hidden'] && !empty($config['hidden'])) {
                continue;
            }
            if (!$options['show_advanced'] && !empty($config['advanced'])) {
                continue;
            }
            if ($options['groups'] && !in_array($config['group'], $options['groups'])) {
                continue;
            }
            
            // 3. Přeskočit pokud nemá marker pro toolbar
            if ($config['marker'] === null) {
                continue;
            }
            
            $button = $config;
            
            // 4. Dynamické hodnoty pro nadpisy
            if (!empty($config['dynamic'])) {
                $level = $texy->headingModule->top ?? 3;
                $button['label'] = 'H' . $level;
                $button['marker'] = str_repeat('#', $level);
                $button['title'] = "Nadpis {$level}. úrovně";
            }
            
            // 5. Dialogová tlačítka - zkontrolovat zda máme TexylaDialog
            if (!empty($config['dialog']) && !$options['include_dialogs']) {
                continue;
            }
            
            // 6. Odstranit interní metadata před vrácením
            unset($button['priority'], $button['group'], $button['auto'], 
                  $button['hidden'], $button['advanced'], $button['dynamic'],
                  $button['dialog']);
            
            $buttons[] = $button;
        }
        
        // 7. Seřadit podle priority (vyšší = dříve)
        usort($buttons, function($a, $b) {
            $priorityA = $a['priority'] ?? 999;
            $priorityB = $b['priority'] ?? 999;
            return $priorityA <=> $priorityB;
        });
        
        // 8. Odebrat priority z finálního výstupu
        foreach ($buttons as &$button) {
            unset($button['priority']);
        }
        
        return $buttons;
    }

    /**
     * Vytvoří Texy! instanci specifickou pro kontext
     * 
     * @param string $context Název kontextu
     * @return \Texy\Texy Nakonfigurovaná Texy! instance
     */
    private static function createTexyForContext(string $context): \Texy\Texy
    {
        $texy = new \Texy\Texy();
        
        // ZÁKLADNÍ NASTAVENÍ DLE DOKUMENTACE TEXY! 3.2
        $texy->mergeLines = true;           // Spojování řádků v odstavcích
        $texy->obfuscateEmail = true;       // Ochrana emailů před spamboty
        $texy->removeSoftHyphens = true;    // Odstranění měkkých spojovníků
        
        // NADPISY: H1-H3 místo H1-H6
        $texy->headingModule->top = 3;
        
        // BEZPEČNOST: Žádné HTML, CSS třídy ani inline styly
        $texy->allowedTags = \Texy\Texy::NONE;
        $texy->allowedClasses = \Texy\Texy::NONE;
        $texy->allowedStyles = \Texy\Texy::NONE;
        
        // Kontextové nastavení povolených syntaxí
        self::configureAllowedElements($texy, $context);
        
        return $texy;
    }

    /**
     * Nakonfiguruje povolené elementy podle kontextu
     * 
     * @param \Texy\Texy $texy Texy! instance
     * @param string $context Název kontextu
     */
    private static function configureAllowedElements(\Texy\Texy $texy, string $context): void
    {
        $allowedConfig = self::getAllowedConfig($context);
        
        foreach ($allowedConfig as $element => $isAllowed) {
            $texy->allowed[$element] = $isAllowed;
        }
    }

    /**
     * Vrátí konfiguraci povolených elementů pro daný kontext
     * 
     * @param string $context Název kontextu
     * @return array Konfigurace povolených elementů
     */
    private static function getAllowedConfig(string $context): array
    {
        $configs = [
            'admin' => [
                'phrase/strong' => true,
                'phrase/em' => true,
                'phrase/em-alt' => true,
                'phrase/code' => true,
                'phrase/sup' => true,
                'phrase/sub' => true,
                'phrase/ins' => true,
                'phrase/del' => true,
                'link/reference' => true,
                'link/email' => true,
                'link/url' => true,
                'link/definition' => true,
                'image' => true,
                'figure' => true,
                'block/code' => true,
                'block/code-language' => true,
                'block/quote' => true,
                'blocks' => true,
                'heading/surrounded' => true,
                'heading/underlined' => false,
                'list' => true,
                'list/numbered' => true,
                'list/definition' => true,
                'table' => true,
                'horizline' => true,
                'html/tag' => false,
                'html/comment' => false,
                'typography' => true,
                'longwords' => true,
                'emoticon' => false,
            ],
            'forum' => [
                'phrase/strong' => true,
                'phrase/em' => true,
                'phrase/em-alt' => true,
                'phrase/code' => true,
                'phrase/sup' => false,
                'phrase/sub' => false,
                'phrase/ins' => false,
                'phrase/del' => false,
                'link/reference' => true,
                'link/email' => true,
                'link/url' => true,
                'link/definition' => false,
                'image' => false,
                'figure' => false,
                'block/code' => false,
                'block/code-language' => false,
                'block/quote' => true,
                'blocks' => false,
                'heading/surrounded' => false,
                'heading/underlined' => false,
                'list' => true,
                'list/numbered' => false,
                'list/definition' => false,
                'table' => false,
                'horizline' => false,
                'html/tag' => false,
                'html/comment' => false,
                'typography' => true,
                'longwords' => true,
                'emoticon' => false,
            ],
            'default' => [
                'phrase/strong' => true,
                'phrase/em' => true,
                'phrase/em-alt' => true,
                'phrase/code' => true,
                'phrase/sup' => false,
                'phrase/sub' => false,
                'phrase/ins' => false,
                'phrase/del' => false,
                'link/reference' => true,
                'link/email' => true,
                'link/url' => true,
                'link/definition' => false,
                'image' => false,
                'figure' => false,
                'block/code' => false,
                'block/code-language' => false,
                'block/quote' => false,
                'blocks' => false,
                'heading/surrounded' => false,
                'heading/underlined' => false,
                'list' => false,
                'list/numbered' => false,
                'list/definition' => false,
                'table' => false,
                'horizline' => false,
                'html/tag' => false,
                'html/tag' => false,
                'html/comment' => false,
                'typography' => true,
                'longwords' => true,
                'emoticon' => false,
            ]
        ];
        
        return $configs[$context] ?? $configs['default'];
    }

    /**
     * Připraví JSON konfiguraci pro frontend
     * 
     * @param array $markers Konfigurace tlačítek
     * @return string JSON konfigurace bezpečně escapovaná pro HTML atribut
     */
    private static function prepareJsonConfig(array $markers): string
    {
        if (empty($markers)) {
            return '[]';
        }
        
        $json = json_encode(
            $markers,
            JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE
        );
        
        if ($json === false) {
            error_log('TexylaConfigFactory: JSON encode failed for markers: ' . print_r($markers, true));
            return '[]';
        }
        
        // NEescapujeme zde - to udělá texyla_escape_attr v template
        return $json;
    }

    /**
     * Ladící metoda pro zobrazení povolených elementů
     * 
     * @param \Texy\Texy $texy Texy! instance
     * @return array Seznam povolených elementů
     */
    public static function debugAllowedElements(\Texy\Texy $texy): array
    {
        return array_filter($texy->allowed ?? []);
    }

    /**
     * Vrátí počet tlačítek vygenerovaných z Texy instance
     * 
     * @param \Texy\Texy $texy Texy! instance
     * @return array [celkem, zobrazeno, skryto]
     */
    public static function getButtonStats(\Texy\Texy $texy): array
    {
        $allButtons = self::autoGenerateFromTexy($texy, ['show_hidden' => true, 'show_auto' => true]);
        $visibleButtons = self::autoGenerateFromTexy($texy);
        
        return [
            'total' => count($allButtons),
            'visible' => count($visibleButtons),
            'hidden' => count($allButtons) - count($visibleButtons)
        ];
    }
    
    /**
     * Vrátí seznam všech dostupných dialogů pro daný kontext
     * 
     * @param string $context Název kontextu
     * @return array Seznam dostupných dialogů
     */
    public static function getAvailableDialogs(string $context): array
    {
        $texy = self::createTexyForContext($context);
        $buttons = self::autoGenerateFromTexy($texy);
        
        $dialogs = [];
        foreach ($buttons as $button) {
            if (isset($button['marker']) && strpos($button['marker'], 'DIALOG:') === 0) {
                $dialogType = substr($button['marker'], 7); // odstranit "DIALOG:"
                $dialogs[$dialogType] = $button['title'] ?? $dialogType;
            }
        }
        
        return $dialogs;
    }
}