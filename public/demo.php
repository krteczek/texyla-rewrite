<?php
declare(strict_types=1);
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
> ."Autor citace"

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

Tabulka:

| Jméno | Věk | Město
|-------|----:|------
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
´´´
function hello() {
return "world";
}
´´´

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
<h2>profil admin</h2>
<div id="admin">
    <textarea
        id="editor"
        class="texyla"
        data-profile="admin"
        data-theme="default"
        data-endpoint="texyla/texyla.php"
        data-debug="1"
        rows="12"
        cols="80"
        placeholder="Napiš Texy! syntax…"
    ><?= $text; ?></textarea>

    <!-- JS si podle data-theme / data-endpoint načte CSS a sám se inicializuje -->
    
</div>
<h2>profil forum</h2>
<div id="forum">
    <textarea
        id="editor"
        class="texyla"
        data-profile="forum"
        data-theme="default"
        data-endpoint="texyla/texyla.php"
        data-debug="1"
        rows="12"
        cols="80"
        placeholder="Napiš Texy! syntax…"
    ><?= $text; ?></textarea>

    <!-- JS si podle data-theme / data-endpoint načte CSS a sám se inicializuje -->
    
</div>

<h2>profil CodeForum</h2>
<div id="codeforum">
    <textarea
        id="editor"
        class="texyla"
        data-profile="codeforum"
        data-theme="default"
        data-endpoint="texyla/texyla.php"
        data-debug="1"
        rows="12"
        cols="80"
        placeholder="Napiš Texy! syntax…"
    ><?= $text; ?></textarea>

    <!-- JS si podle data-theme / data-endpoint načte CSS a sám se inicializuje -->
    
</div>

<h2>profil default</h2>
<div id="default">
    <textarea
        id="editor"
        class="texyla"
        data-profile="default"
        data-theme="default"
        data-endpoint="texyla/texyla.php"
        data-debug="1"
        rows="12"
        cols="80"
        placeholder="Napiš Texy! syntax…"
    ><?= $text; ?></textarea>

    <!-- JS si podle data-theme / data-endpoint načte CSS a sám se inicializuje -->
    
</div>
<script src="texyla/texyla.js"></script>
</body>
</html>