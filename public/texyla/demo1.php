<?php
declare(strict_types=1);

use Texy\Texy;

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/src/Config.php';

$error = checkTexy();
if ($error !== null) {
    http_response_code(500);
    echo '<div class="texyla-error"><p>❌ Texyla nemůže běžet</p><small>'
        . htmlspecialchars($error, ENT_QUOTES, 'UTF-8')
        . '</small></div>';
    exit;
}
        /** 
         * nastavení pro Texy instanci. co se zde povolí, to bude texy 
         * na druhé straně zpracovávat 
         * tohle je nastavení čistě pro Demo! aby šlo vidět, jak se má chovat texyla
         * Demo nemá ovlivněnou instanci, musíme ji nastavit sami
         * */
        $settingsTexy = [
            'allowed' => [
                    // --- phrase ---
                    'phrase/strong'          => false,
                    'phrase/strong+em'       => false,
                    'phrase/em'              => false,
                    'phrase/em-alt'          => false,
                    'phrase/em-alt2'         => false,
                    'phrase/ins'             => false,
                    'phrase/del'             => false,
                    'phrase/sup'             => false,
                    'phrase/sup-alt'         => false,
                    'phrase/sub'             => false,
                    'phrase/sub-alt'         => false,
                    'phrase/span'            => false,
                    'phrase/span-alt'        => false,
                    'phrase/quote'           => false,
                    'phrase/acronym'         => false,
                    'phrase/acronym-alt'     => false,
                    'phrase/notexy'          => false,
                    'phrase/code'            => false,
                    'phrase/quicklink'       => false,
                    'phrase/wikilink'        => false,
                    'phrase/markdown'        => false,
                    'phrase/escaped-asterix' => false,

                    // --- odkazy ---
                    'link'                   => false,
                    'link/definition'        => false,
                    'link/reference'         => false,
                    'link/url'               => false,
                    'link/email'             => false,

                    // --- obrázky ---
                    'image'                  => false,
                    'image/definition'       => false,
                    'figure'                 => false,

                    // --- bloky ---
                    'block/default'          => false,
                    'block/pre'              => false,
                    'block/code'             => false,
                    'block/html'             => false,
                    'block/text'             => false,
                    'block/texysource'       => false,
                    'block/comment'          => false,
                    'block/div'              => false,
                    'blocks'                 => false,
                    'horizline'              => false,
                    'blockquote'             => false,
                    'table'                  => false,

                    // --- nadpisy ---
                    'heading/underlined'     => false,
                    'heading/surrounded'     => false,

                    // --- seznamy ---
                    'list'                   => false,
                    'list/definition'        => false,

                    // --- ostatní ---
                    'script'                 => false,
                    'html/tag'               => false,
                    'html/comment'           => false,
                    'emoticon'               => false,
                    'typography'             => false,
                    'longwords'              => false,
            ],

            'headingModule' => ['top' => 3],
            'mergeLines' => true,
            'obfuscateEmail' => true,
        ];
/**
 * Inicializace Texy
 */
$texyDemo = new Texy();

/**
 * nastavení texy naším nastavením 
 * tohle jen kvuli demo, při implementaci se načítá Vaše nastavení Texy přímo z texy
 */
\Texyla\Config::apply($texyDemo, $settingsTexy);

/** 
 * získání konfigurace texy pro zobrazení tlačítek a 
 * dále pro to aby texyla.php věděla, co má znastavit texy a zpracovat
 */
$config = \Texyla\Config::extract($texyDemo);

/**
 * Testovací text
 */
$text = <<<'EOT'
### Hlavní nadpis

## Podnadpis

**Tučný text**, *kurzíva*, ***tučná kurzíva***, `inline kód`.

Horní index: 2^^10^^, dolní index: H__2__O.

Odkaz s popiskem: "Texy oficiálně":[https://texy.info]
Holý odkaz: https://texy.info
Email: someone@example.com


> Toto je citace.
> Druhý řádek citace.
> "Autor citace"


"(cite=https://wikipedia.org)
Kdo chce hýbat světem, musí nejprve pohnout sám sebou.
" -- Sokrates


Neuspořádaný seznam:

- první položka
- druhá **s tučným**
- třetí s odkazem "sem":[https://example.com]
  - vnořená A
  - vnořená B

Číslovaný seznam:

1) jedna
2) dvě
3) tři

Definice:

termín:
  - vysvětlení jedna
  - vysvětlení dvě


Příklad tabulky:

| Jméno | Věk | Město
|-------|-----|------
| Ana   |  28 | Praha
| Bořek |  35 | Brno

Horizontální čára:

---

Blok kódu (ploténková syntax):

/---code php
<?php
echo "Ahoj z Texy";
$x = 1 + 2;
\---

Alternativní code fence:
/---
function hello() {
return "world";
}
\---

Obrázek (admin):

[* https://texy.deegee.dev/favicon.ico .(Logo Texy) *]

Obrázek s odkazem:

[* https://texy.deegee.dev/favicon.ico .(Logo) *]:[https://texy.info]

Dlouhý odstavec s typografií: "uvozovky", pomlčka - ať se projeví, výpustka..., násobení 5 x 3, nezlomitelná mezera u jednotek 10 kg.

kód
uvnitř
fence

Konec testu.
EOT;
?><!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <title>Texyla – demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <h1>Texyla demo</h1>

    <div id="admin">
        <textarea
            class="texyla"
            data-texyla-config='<?= \Texyla\Config::toJson($config) ?>'
            data-endpoint="texyla/texyla.php"
            rows="12"
        ><?= htmlspecialchars($text, ENT_QUOTES, 'UTF-8') ?></textarea>
    </div>

    <script src="texyla/texyla.1.js"></script>
</body>
</html>