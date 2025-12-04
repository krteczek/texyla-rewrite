<?php
/**
 * Project: Texyla Rewrite Dream Team
 * File: /texyla-rewrite/demo/index.php
 * Description: Demo stránka pro prezentaci funkcionality Texyla editoru
 * 
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @license MIT
 */

declare(strict_types=1);

// 1. NAČTENÍ AUTOLOADERU A ZÁKLADNÍHO NASTAVENÍ
require_once __DIR__ . '/../vendor/autoload.php';

// Development nastavení - zobrazovat všechny chyby
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');

use Texyla\TexylaConfigFactory;

// 2. DEFINE KONTEXTŮ PRO EDITORY
$contextAdmin = 'admin';   // Plná syntaxe pro administrátory
$contextForum = 'forum';   // Omezená syntaxe pro diskuse

// 3. ZPRACOVÁNÍ FORMULÁŘE (POKUD BYL ODESLÁN)
$processedOutput = [];
$originalInput = [];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Zpracování editoru Admin
    $originalInput['admin'] = $_POST['content_admin'] ?? '';
    [$texyAdmin, ] = TexylaConfigFactory::getContextSetup($contextAdmin);
    $processedOutput['admin'] = $texyAdmin->process($originalInput['admin']);

    // Zpracování editoru Forum
    $originalInput['forum'] = $_POST['content_forum'] ?? '';
    [$texyForum, ] = TexylaConfigFactory::getContextSetup($contextForum);
    $processedOutput['forum'] = $texyForum->process($originalInput['forum']);
}

// 4. PŘÍPRAVA KONFIGURACE PRO JAVASCRIPT
[, $jsonConfigAdmin] = TexylaConfigFactory::getContextSetup($contextAdmin);
[, $jsonConfigForum] = TexylaConfigFactory::getContextSetup($contextForum);

// 5. HTML VÝSTUP
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Texyla Demo – Dream Team Edition</title>
    <meta name="description" content="Ukázka moderního Texyla editoru bez jQuery">
    
    <!-- Styly Texyla editoru -->
    <link rel="stylesheet" href="../assets/style.css">
    
    <!-- Demo-specifické styly -->
    <style>
        /* Základní reset a typografie */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background-color: #f7fafc;
            padding: 2rem 1rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        /* Hlavička demo stránky */
        .demo-header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background-color: #ffffff;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 2px solid #e2e8f0;
        }
        
        .demo-header h1 {
            font-size: 2.5rem;
            color: #2d3748;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .demo-header .subtitle {
            font-size: 1.125rem;
            color: #718096;
            margin-bottom: 1.5rem;
        }
        
        .dream-team-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 0.5rem 1.5rem;
            border-radius: 2rem;
            font-weight: 600;
            margin: 1rem 0;
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
        }
        
        /* Sekce editorů */
        .demo-section {
            background-color: #ffffff;
            padding: 2rem;
            margin-bottom: 2.5rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border: 2px solid #e2e8f0;
        }
        
        .demo-section h2 {
            font-size: 1.5rem;
            color: #2d3748;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 3px solid #4299e1;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        
        .context-badge {
            display: inline-block;
            background-color: #edf2f7;
            color: #4a5568;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            border: 1px solid #cbd5e0;
        }
        
        /* Návod k použití */
        .demo-instructions {
            background-color: #f0fff4;
            border-left: 4px solid #38a169;
            padding: 1.25rem;
            margin: 1.5rem 0;
            border-radius: 0.5rem;
        }
        
        .demo-instructions h3 {
            color: #276749;
            margin-bottom: 0.75rem;
            font-size: 1.125rem;
        }
        
        .demo-instructions ul {
            list-style-position: inside;
            margin-left: 0.5rem;
        }
        
        .demo-instructions li {
            margin-bottom: 0.375rem;
            color: #2f855a;
        }
        
        /* Výsledky zpracování */
        .result-box {
            background-color: #ebf8ff;
            padding: 1.5rem;
            margin-top: 2rem;
            border-radius: 0.75rem;
            border: 2px solid #bee3f8;
        }
        
        .result-box h3 {
            color: #2c5282;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .result-box pre {
            background-color: #2d3748;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 0.875rem;
            margin-top: 1rem;
        }
        
        /* Tlačítko pro odeslání */
        .submit-btn {
            display: block;
            width: 100%;
            background-color: #38a169;
            color: #ffffff;
            border: none;
            padding: 1rem 2rem;
            font-size: 1.125rem;
            font-weight: 600;
            border-radius: 0.75rem;
            cursor: pointer;
            margin-top: 3rem;
            transition: background-color 200ms ease;
        }
        
        .submit-btn:hover {
            background-color: #2f855a;
        }
        
        .submit-btn:active {
            transform: translateY(1px);
        }
        
        /* Patička */
        .footer-info {
            text-align: center;
            margin-top: 4rem;
            padding-top: 2rem;
            color: #718096;
            font-size: 0.875rem;
            border-top: 1px solid #e2e8f0;
        }
        
        /* Responzivní design */
        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }
            
            .demo-header h1 {
                font-size: 2rem;
            }
            
            .demo-section {
                padding: 1.5rem;
            }
            
            .demo-section h2 {
                font-size: 1.25rem;
            }
        }
        
        @media (max-width: 480px) {
            .demo-header {
                padding: 1.5rem 1rem;
            }
            
            .demo-header h1 {
                font-size: 1.75rem;
            }
            
            .dream-team-badge {
                font-size: 0.875rem;
                padding: 0.375rem 1rem;
            }
        }
    </style>
</head>
<body>
    <!-- Hlavička demo stránky -->
    <header class="demo-header">
        <h1>🚀 Texyla Rewrite Demo</h1>
        <p class="subtitle">Moderní WYSIWYM editor bez jQuery</p>
        <div class="dream-team-badge">Petr & Bó Dream Team</div>
        <p>Ukázka dvou nezávislých editorů s různou úrovní syntaxe a funkčním AJAX náhledem.</p>
    </header>

    <!-- Hlavní formulář -->
    <form method="post" action="" novalidate>
        <!-- EDITOR 1: ADMIN (plná syntaxe) -->
        <section class="demo-section">
            <h2>
                📝 Editor: Článek / Admin
                <span class="context-badge">context: '<?= htmlspecialchars($contextAdmin) ?>'</span>
            </h2>
            
            <div class="demo-instructions">
                <h3>📋 Dostupné formátování:</h3>
                <ul>
                    <li><strong>🔤 Tučné</strong> – **tučný text**</li>
                    <li><strong>🔠 Kurzíva</strong> – *kurzíva*</li>
                    <li><strong>📷 Obrázek</strong> – [* obrazek.jpg *]</li>
                    <li><strong>🔗 Odkaz</strong> – [text](URL)</li>
                    <li><strong>📋 Blok kódu</strong> – ```php kód ```</li>
                    <li><strong>🔢 Nadpis</strong> – ### Nadpis 3. úrovně</li>
                    <li><strong>💬 Citace</strong> – > text citace</li>
                </ul>
            </div>
            
            <label for="editor1" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                Text článku:
            </label>
            
            <textarea 
                id="editor1" 
                name="content_admin" 
                class="texyla-textarea"
                rows="12"
                data-context="<?= htmlspecialchars($contextAdmin) ?>"
                data-texyla-config="<?= $jsonConfigAdmin ?>"
                aria-label="Editor pro články s plnou syntaxí"
            ><?= htmlspecialchars($originalInput['admin'] ?? "# Ukázkový článek

## Úvodní odstavec

Toto je **tučný text** a toto je *kurzíva*. 

Vložení obrázku: [* ukazkovy-obrazek.jpg *]

### Odkazy a reference

Navštivte naši [domovskou stránku](https://example.com).

### Kódové bloky

```php
<?php
class Ukazka {
    public function metoda(): string {
        return 'Hello World!';
    }
}

```
Citace

    „Software je jako sex: je lepší, když je zdarma.\"
    – Linus Torvalds

Seznamy

    První položka

    Druhá položka

        Vnořená položka

    Třetí položka

    Číslovaný seznam

    Druhá položka

    Třetí položka") ?></textarea>
    
     <!-- Panel pro náhled (bude naplněn JavaScriptem) -->
     <div class="texyla__preview" data-for="editor1" aria-live="polite"></div>

     <!-- Výsledek zpracování na serveru -->
     <?php if (isset($processedOutput['admin'])): ?>
         <div class="result-box">
             <h3>✅ Výsledek zpracování na serveru (PHP Texy!):</h3>
             <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #cbd5e0;">
                 <?= $processedOutput['admin'] ?>
             </div>
             <details>
                 <summary style="cursor: pointer; color: #4299e1; font-weight: 500;">
                     📄 Zobrazit HTML zdroj
                 </summary>
                 <pre><?= htmlspecialchars($processedOutput['admin']) ?></pre>
             </details>
         </div>
     <?php endif; ?>
 </section>

 <!-- EDITOR 2: FORUM (omezená syntaxe) -->
 <section class="demo-section">
     <h2>
         💬 Editor: Diskuze / Forum
         <span class="context-badge">context: '<?= htmlspecialchars($contextForum) ?>'</span>
     </h2>
     
     <div class="demo-instructions">
         <h3>⚠️ Omezená syntaxe (bez obrázků a kódových bloků):</h3>
         <ul>
             <li><strong>🔤 Tučné</strong> – **tučný text**</li>
             <li><strong>🔠 Kurzíva</strong> – *kurzíva*</li>
             <li><strong>💬 Citace</strong> – > text citace</li>
         </ul>
     </div>
     
     <label for="editor2" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
         Váš komentář:
     </label>
     
     <textarea 
         id="editor2" 
         name="content_forum" 
         class="texyla-textarea"
         rows="8"
         data-context="<?= htmlspecialchars($contextForum) ?>"
         data-texyla-config="<?= $jsonConfigForum ?>"
         aria-label="Editor pro diskuse s omezenou syntaxí"
     ><?= htmlspecialchars($originalInput['forum'] ?? "**Dobrý den**, 
     mám dotaz ohledně funkčnosti editoru:

    Cituji předchozí příspěvek na toto téma.

Mohu používat i inline kód jako echo 'test';.

Děkuji za odpověď!") ?></textarea>   
        <!-- Panel pro náhled (bude naplněn JavaScriptem) -->
        <div class="texyla__preview" data-for="editor2" aria-live="polite"></div>

        <!-- Výsledek zpracování na serveru -->
        <?php if (isset($processedOutput['forum'])): ?>
            <div class="result-box">
                <h3>✅ Výsledek zpracování na serveru (PHP Texy!):</h3>
                <div style="margin: 1rem 0; padding: 1rem; background: white; border-radius: 0.5rem; border: 1px solid #cbd5e0;">
                    <?= $processedOutput['forum'] ?>
                </div>
                <details>
                    <summary style="cursor: pointer; color: #4299e1; font-weight: 500;">
                        📄 Zobrazit HTML zdroj
                    </summary>
                    <pre><?= htmlspecialchars($processedOutput['forum']) ?></pre>
                </details>
            </div>
        <?php endif; ?>
    </section>

    <!-- Tlačítko pro odeslání -->
    <button type="submit" class="submit-btn" aria-label="Odeslat formulář a zpracovat obsah editorů">
        📤 Odeslat a zpracovat na serveru
    </button>
</form>

<!-- JavaScript pro inicializaci editorů -->
<script src="../assets/texyla.js"></script>
<script>
    /**
     * Inicializace Texyla editorů po načtení DOM
     */
    document.addEventListener('DOMContentLoaded', () => {
        const previewEndpoint = '../src/TexylaController.php';
        const editors = document.querySelectorAll('.texyla-textarea');
        
        console.info(`Inicializace ${editors.length} Texyla editorů...`);
        
        editors.forEach((textareaEl, index) => {
            try {
                new TexylaVanilla(textareaEl, previewEndpoint);
                console.debug(`Editor #${index + 1} inicializován: ${textareaEl.id || 'unnamed'}`);
            } catch (error) {
                console.error(`Chyba při inicializaci editoru #${index + 1}:`, error);
                textareaEl.style.borderColor = '#dc2626';
                textareaEl.title = `Chyba: ${error.message}`;
            }
        });
        
        console.info('Všechny editory úspěšně inicializovány.');
    });
</script>

<!-- Patička -->
<footer class="footer-info">
    <p>© <?= date('Y') ?> Texyla Rewrite Dream Team</p>
    <p>
        <small>
            Verze 1.0.0 | PHP <?= phpversion() ?> | 
            <a href="https://github.com/texy/texy" style="color: #4299e1;">Texy! <?= \Texy\Texy::VERSION ?? '3.x' ?></a>
        </small>
    </p>
</footer>
</body> </html>