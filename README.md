# Texyla Rewrite - Dream Team Edition 🚀

Moderní přepis Texyla editoru bez jQuery, postavený na vanilla JavaScript a PHP Texy! 3.2.

## ✨ Funkce

- **Žádné jQuery** – čistý vanilla JavaScript
- **Moderní architektura** – ES6 třídy, modulární design
- **AJAX náhled** – okamžitý preview Texy! syntaxe
- **Kontextové nastavení** – různé úrovně syntaxe pro různé use case
- **Emoji toolbar** – intuitivní ikonky místo textu
- **Responzivní design** – mobile-first přístup
- **Plná dokumentace** – PHP Doc, JSDoc, komentáře

## 🏗️ Struktura projektu
texyla-rewrite/
├── composer.json # PHP závislosti
├── config.php # Konfigurace tlačítek
├── README.md # Tato dokumentace
├── .gitignore # Git ignore
├── src/ # PHP backend
│ ├── TexylaConfigFactory.php
│ ├── TexylaController.php
│ └── TexylaImplementation.php
├── assets/ # Frontend resources
│ ├── texyla.js (24.5KB)
│ └── style.css (8.1KB)
└── demo/ # Ukázková implementace
└── index.php (15.2KB)


## 🚀 Rychlý start

### 1. Instalace

```bash
# Klonovat nebo stáhnout projekt
git clone <repository>
cd texyla-rewrite

# Nainstalovat PHP závislosti
composer install

2. Konfigurace

Uprav config.php pro vlastní sadu tlačítek:
php

'admin' => [
    ['label' => '🔤', 'marker' => '**', 'title' => 'Tučné'],
    ['label' => '🔠', 'marker' => '*', 'title' => 'Kurzíva'],
    // ... další tlačítka
],

3. Použití v HTML
html

<textarea 
    id="myEditor"
    class="texyla-textarea"
    data-context="admin"
    data-texyla-config='<?= $jsonConfig ?>'
></textarea>

<script>
    new TexylaVanilla(document.getElementById('myEditor'), '/path/to/TexylaController.php');
</script>

4. Demo

Otevři demo/index.php v prohlížeči pro kompletní ukázku.
🔧 API
JavaScript třída TexylaVanilla
javascript

const editor = new TexylaVanilla(textareaElement, previewUrl);

// Metody
editor.getValue();        // Vrátí obsah
editor.setValue('text');  // Nastaví obsah
editor.updatePreview();   // Aktualizuje náhled
editor.destroy();         // Zničí instanci

PHP třídy

    TexylaConfigFactory – Továrna pro Texy! instance

    TexylaController – AJAX endpoint pro náhled

    TexylaImplementation – Základní Texy! konfigurace

🎨 Přizpůsobení
CSS proměnné

Uprav assets/style.css pro vlastní vzhled:
css

.texyla {
    --primary-color: #4299e1;
    --border-radius: 0.5rem;
    /* ... další proměnné */
}

Rozšíření funkcionality
Vytvoř vlastní modul děděním z TexylaVanilla:
javascript

class MyTexyla extends TexylaVanilla {
    _insertMarker(marker) {
        // Vlastní implementace
    }
}

🤝 Dream Team

    Petr – Visionář, Product Owner, UX Guru

    Bó – Implementátor, Koder, Problem Solver

📄 Licence

MIT License – viz LICENSE soubor.

"Dream team mode activated!" 🚀
text


---

## **📦 INSTALACE:**
```bash
# 1. Vytvoř strukturu
mkdir -p texyla-rewrite/{src,assets,demo}

# 2. Zkopíruj všechny výše uvedené soubory

# 3. Nainstaluj závislosti
cd texyla-rewrite
composer install

# 4. Otestuj
php -S localhost:8000 -t ./
# Otevři: http://localhost:8000/demo/