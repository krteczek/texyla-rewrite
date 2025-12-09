
<?php
/**
 * Project: Texyla Rewrite Dream Team
 * File: /texyla-rewrite/demo/index.php
 * Description: Demo stránka s 2 editory - 100% automatická konfigurace podle Texy
 * 
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @license MIT
 */

declare(strict_types=1);

// 1. NAČTENÍ AUTOLOADERU A ZÁKLADNÍHO NASTAVENÍ
require_once __DIR__ . '/../vendor/autoload.php';

// Development nastavení
error_reporting(E_ALL);
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');

use Texyla\TexylaConfigFactory;

// 2. KONTEXTY PRO EDITORY
$contextAdmin = 'admin';   // Plná syntaxe
$contextForum = 'forum';   // Omezená syntaxe

// 3. ZPRACOVÁNÍ FORMULÁŘE A NAČTENÍ KONFIGURACÍ
$processedOutput = [];
$originalInput = [];
$jsonConfigAdmin = $jsonConfigForum = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // POST - formulář byl odeslán
    $originalInput['admin'] = $_POST['content_admin'] ?? '';
    $originalInput['forum'] = $_POST['content_forum'] ?? '';
    
    // Načíst configy a zpracovat
    [$texyAdmin, $jsonConfigAdmin] = TexylaConfigFactory::getContextSetup($contextAdmin);
    [$texyForum, $jsonConfigForum] = TexylaConfigFactory::getContextSetup($contextForum);
    
    $processedOutput['admin'] = $texyAdmin->process($originalInput['admin']);
    $processedOutput['forum'] = $texyForum->process($originalInput['forum']);
} else {
    // GET - první načtení stránky
    [$texyAdmin, $jsonConfigAdmin] = TexylaConfigFactory::getContextSetup($contextAdmin);
    [$texyForum, $jsonConfigForum] = TexylaConfigFactory::getContextSetup($contextForum);
}

// 4. HTML VÝSTUP
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Texyla Demo – 100% Automatická konfigurace</title>
    <meta name="description" content="Editor se konfiguruje automaticky z Texy instance">
    
    <!-- Styly Texyla editoru -->
    <link rel="stylesheet" href="../assets/style.css">
    
    <!-- Demo-specifické styly -->
    <style>
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
        
        /* Hlavička */
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
        
        .dream-team-badge {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 0.5rem 1.5rem;
            border-radius: 2rem;
            font-weight: 600;
            margin: 1rem 0;
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
        
        /* Návod */
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
        
        /* Výsledky */
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
        }
        
        .result-box pre {
            background-color: #2d3748;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            font-family: monospace;
            font-size: 0.875rem;
            margin-top: 1rem;
        }
        
        /* Tlačítko */
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
        }
        
        .submit-btn:hover {
            background-color: #2f855a;
        }
        
        /* Debug panel */
        .debug-panel {
            background-color: #f8fafc;
            border: 2px dashed #cbd5e0;
            padding: 1.5rem;
            margin: 2rem 0;
            border-radius: 0.75rem;
            font-family: monospace;
            font-size: 0.875rem;
        }
        
        .debug-panel h3 {
            color: #4a5568;
            margin-bottom: 1rem;
        }
        
        .debug-item {
            margin-bottom: 0.5rem;
            padding: 0.5rem;
            background: white;
            border-radius: 0.375rem;
            border: 1px solid #e2e8f0;
        }
        
        /* Texyla FATÁLNÍ CHYBY */
        .texyla-fatal-error {
            position: relative;
            z-index: 10000;
            margin: 2rem 0;
            padding: 1.5rem;
            background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
            border: 3px solid #fc8181;
            border-radius: 0.75rem;
            box-shadow: 0 10px 25px rgba(252, 129, 129, 0.3);
        }
        
        .texyla-error-box {
            background: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            border: 1px solid #e2e8f0;
        }
        
        .texyla-error-box h3 {
            color: #c53030;
            margin: 0 0 1rem 0;
            font-size: 1.25rem;
            border-bottom: 2px solid #fed7d7;
            padding-bottom: 0.5rem;
        }
        
        .texyla-error-message {
            font-size: 1rem;
            margin: 1rem 0;
            padding: 1rem;
            background: #fff5f5;
            border-radius: 0.375rem;
            border-left: 4px solid #fc8181;
        }
        
        .texyla-error-details {
            font-family: monospace;
            font-size: 0.875rem;
            color: #742a2a;
            background: #fed7d7;
            padding: 0.75rem;
            border-radius: 0.375rem;
            margin: 1rem 0;
            overflow-x: auto;
        }
        
        .texyla-error-fix {
            margin: 1rem 0;
            padding: 1rem;
            background: #f0fff4;
            border-radius: 0.375rem;
            border: 1px solid #9ae6b4;
        }
        
        .texyla-error-fix h4 {
            color: #276749;
            margin: 0 0 0.75rem 0;
        }
        
        .texyla-error-fix ul {
            margin: 0;
            padding-left: 1.5rem;
        }
        
        .texyla-error-fix li {
            margin-bottom: 0.5rem;
            color: #2f855a;
        }
        
        .texyla-error-url {
            margin-top: 1rem;
            padding: 0.75rem;
            background: #ebf8ff;
            border-radius: 0.375rem;
            font-family: monospace;
            font-size: 0.875rem;
        }
        
        /* Responzivní */
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
    </style>
</head>
<body>
    <!-- Hlavička -->
    <header class="demo-header">
        <h1>🚀 Texyla - 100% Automatická konfigurace</h1>
        <p class="subtitle">Žádný config.php! Editor se konfiguruje sám z Texy instance</p>
        <div class="dream-team-badge">Petr & Bó Dream Team</div>
        <p>Každý editor má jinou konfiguraci automaticky vygenerovanou z Texy instance.</p>
    </header>

    <!-- Debug panel -->
    <div class="debug-panel">
        <h3>🔍 DEBUG: Automaticky generované konfigurace</h3>
        <div class="debug-item">
            <strong>Admin config</strong> (délka: <?= strlen($jsonConfigAdmin) ?> znaků)<br>
            <small><?= htmlspecialchars(substr($jsonConfigAdmin, 0, 150)) ?>...</small>
        </div>
        <div class="debug-item">
            <strong>Forum config</strong> (délka: <?= strlen($jsonConfigForum) ?> znaků)<br>
            <small><?= htmlspecialchars(substr($jsonConfigForum, 0, 150)) ?>...</small>
        </div>
        <div class="debug-item">
            <strong>Statistika:</strong><br>
            Admin: <?= count(json_decode($jsonConfigAdmin, true) ?: []) ?> tlačítek<br>
            Forum: <?= count(json_decode($jsonConfigForum, true) ?: []) ?> tlačítek
        </div>
    </div>

    <!-- Hlavní formulář -->
    <form method="post" action="" novalidate>
        <!-- EDITOR 1: ADMIN (plná syntaxe) -->
        <section class="demo-section">
            <h2>
                📝 Editor: Článek / Admin
                <span class="context-badge">context: '<?= htmlspecialchars($contextAdmin) ?>'</span>
            </h2>
            
            <div class="demo-instructions">
                <h3>📋 Automaticky vygenerované tlačítka z Texy:</h3>
                <?php
                $adminButtons = json_decode($jsonConfigAdmin, true) ?: [];
                if (!empty($adminButtons)): 
                ?>
                    <ul>
                        <?php foreach ($adminButtons as $button): ?>
                            <li>
                                <strong><?= htmlspecialchars($button['label'] ?? '?') ?></strong> – 
                                <?= htmlspecialchars($button['title'] ?? $button['marker'] ?? '') ?>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php else: ?>
                    <p style="color: #c53030;">⚠️ Žádná tlačítka - Texy! není správně nakonfigurována</p>
                <?php endif; ?>
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
Citace

„Software je jako sex: je lepší, když je zdarma."
– Linus Torvalds
Seznamy

    První položka

    Druhá položka

        Vnořená položka

    Třetí položka

Číslovaný seznam

    První položka

    Druhá položka

    Třetí položka") ?></textarea>
 <!-- Náhled -->
 <div class="texyla__preview" data-for="editor1" aria-live="polite"></div>

 <!-- Výsledek zpracování -->
 <?php if (isset($processedOutput['admin'])): ?>
     <div class="result-box">
         <h3>✅ Výsledek zpracování na serveru:</h3>
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
         <h3>⚠️ Omezená syntaxe (automaticky vyfiltrovaná):</h3>
         <?php
         $forumButtons = json_decode($jsonConfigForum, true) ?: [];
         if (!empty($forumButtons)): 
         ?>
             <ul>
                 <?php foreach ($forumButtons as $button): ?>
                     <li>
                         <strong><?= htmlspecialchars($button['label'] ?? '?') ?></strong> – 
                         <?= htmlspecialchars($button['title'] ?? $button['marker'] ?? '') ?>
                     </li>
                 <?php endforeach; ?>
             </ul>
         <?php else: ?>
             <p style="color: #c53030;">⚠️ Žádná tlačítka - Texy! není správně nakonfigurována</p>
         <?php endif; ?>
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
    <!-- Náhled -->
    <div class="texyla__preview" data-for="editor2" aria-live="polite"></div>

    <!-- Výsledek zpracování -->
    <?php if (isset($processedOutput['forum'])): ?>
        <div class="result-box">
            <h3>✅ Výsledek zpracování na serveru:</h3>
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
    document.addEventListener('DOMContentLoaded', () => {
        const previewEndpoint = '../src/TexylaController.php';
        const editors = document.querySelectorAll('.texyla-textarea');
        
        console.info(`🚀 Inicializace ${editors.length} Texyla editorů (automatická konfigurace)...`);
        
        editors.forEach((textareaEl, index) => {
            try {
                const editor = new TexylaVanilla(textareaEl, previewEndpoint);
                console.debug(`✅ Editor #${index + 1} inicializován: ${textareaEl.id}`);
                
                // Debug: zobrazit config
                const config = JSON.parse(textareaEl.dataset.texylaConfig || '[]');
                console.log(`📋 Editor ${textareaEl.id} má ${config.length} tlačítek:`, 
                    config.map(b => b.label).join(', '));
                    
            } catch (error) {
                console.error(`❌ Chyba při inicializaci editoru #${index + 1}:`, error);
                textareaEl.style.borderColor = '#dc2626';
                textareaEl.title = `Chyba: ${error.message}`;
                
                // Zobrazit uživatelsky přívětivou chybu
                if (error.message.includes('Není nastavena konfigurace')) {
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'texyla-fatal-error';
                    errorDiv.innerHTML = `
                        <div class="texyla-error-box">
                            <h3>⚠️ Texyla: Chybí konfigurace</h3>
                            <div class="texyla-error-message">
                                Editor <strong>${textareaEl.id}</strong> není nakonfigurován.<br>
                                <small>Použij <code>TexylaConfigFactory</code> pro automatickou konfiguraci z Texy.</small>
                            </div>
                        </div>
                    `;
                    textareaEl.parentNode.insertBefore(errorDiv, textareaEl);
                }
            }
        });
        
        console.info('🎉 Všechny editory úspěšně inicializovány pomocí automatické konfigurace.');
    });
</script>

<!-- Patička -->
<footer class="footer-info" style="text-align: center; margin-top: 3rem; color: #718096;">
    <p>© <?= date('Y') ?> Texyla Rewrite Dream Team | 100% Automatická konfigurace v1.0</p>
    <p>
        <small>
            PHP <?= phpversion() ?> | Texy! <?= \Texy\Texy::VERSION ?? '3.x' ?> | 
            Žádný config.php - vše generováno automaticky z Texy instance
        </small>
    </p>
</footer>
</body> </html>