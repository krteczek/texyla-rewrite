<?php
/**
 * Texyla Demo - KOMPLETNÍ VERZE S DIALOGY
 * 100% automatická konfigurace z Texy! pomocí TexylaConfigFactory
 * S podporou dialogů pro odkazy, obrázky, nadpisy a bloky kódu
 * 
 * URL: /texyla-rewrite/demo/index.php
 */

// ============================================
// 1. ZÁKLADNÍ NASTAVENÍ A BEZPEČNOST
// ============================================

error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

session_start();

// Definice konstant pro prostředí
define('TEXYLA_DEMO_VERSION', '1.1.0');
define('TEXYLA_DEMO_ENV', $_SERVER['SERVER_NAME'] === 'localhost' ? 'development' : 'production');

// Funkce pro bezpečné escapování textarey
function texyla_escape_textarea(string $text): string {
    return htmlspecialchars(
        $text,
        ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5,
        'UTF-8',
        false
    );
}

// Funkce pro bezpečné escapování atributů (s kontrolou double escaping)
function texyla_escape_attr(string $text): string {
    // Pokud text už obsahuje HTML entity, neescapuj znovu
    if (preg_match('/&(?:[a-z]+|#\d+);/i', $text)) {
        return $text;
    }
    return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

// ============================================
// 2. NAČTENÍ ZÁVISLOSTÍ (S FALLBACKY)
// ============================================

$hasTexy = false;
$hasTexylaFactory = false;
$configAdmin = '[]';
$configForum = '[]';
$demoAdminContent = '';
$demoForumContent = '';
$systemStatus = [];
$availableDialogs = [];

// Načíst autoloader
$autoloadPath = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoloadPath)) {
    require_once $autoloadPath;
    
    // Kontrola Texy
    if (class_exists('Texy\Texy')) {
        $hasTexy = true;
        $systemStatus['texy_version'] = \Texy\Texy::VERSION;
        
        // Pokus o načtení TexylaConfigFactory
        $factoryPath = __DIR__ . '/../src/TexylaConfigFactory.php';
        if (file_exists($factoryPath)) {
            require_once $factoryPath;
            
            if (class_exists('Texyla\TexylaConfigFactory')) {
                $hasTexylaFactory = true;
                
                try {
                    // AUTOMATICKÁ KONFIGURACE - žádný config.php!
                    list($texyAdmin, $configAdmin) = \Texyla\TexylaConfigFactory::getContextSetup('admin');
                    list($texyForum, $configForum) = \Texyla\TexylaConfigFactory::getContextSetup('forum');
                    
                    // Debug info - ROBUSTNÍ VERZE
                    if (empty($configAdmin) || $configAdmin === '[]') {
                        $configAdmin = '[]';
                    }
                    
                    if (empty($configForum) || $configForum === '[]') {
                        $configForum = '[]';
                    }
                    
                    try {
                        $adminArray = json_decode($configAdmin, true);
                        $forumArray = json_decode($configForum, true);
                        
                        $systemStatus['admin_buttons'] = is_array($adminArray) ? count($adminArray) : 0;
                        $systemStatus['forum_buttons'] = is_array($forumArray) ? count($forumArray) : 0;
                        
                        // Získat dostupné dialogy
                        $availableDialogs = \Texyla\TexylaConfigFactory::getAvailableDialogs('admin');
                        
                    } catch (Exception $e) {
                        $systemStatus['admin_buttons'] = 0;
                        $systemStatus['forum_buttons'] = 0;
                        error_log('Texyla Demo: Error counting buttons: ' . $e->getMessage());
                    }
                    
                    // Demo obsah
                    $demoAdminContent = file_exists(__DIR__ . '/../demos/admin-demo.texy') 
                        ? file_get_contents(__DIR__ . '/../demos/admin-demo.texy')
                        : "# Admin Demo\n\n**Toto** je *demo* pro admin kontext.\n\nOdkaz na [Texy!](https://texy.info)\n\n> Citace\n\n- Seznam\n- Položky\n\n\`inline kód\`\n\n```\n// blok kódu\nfunction test() {\n    return 'Hello';\n}\n```";
                    
                    $demoForumContent = file_exists(__DIR__ . '/../demos/forum-demo.texy')
                        ? file_get_contents(__DIR__ . '/../demos/forum-demo.texy')
                        : "**Fórum** demo\n\n> Citace od uživatele\n\n\`inline kód\`\n\nOdkaz na [GitHub](https://github.com)";
                    
                } catch (Exception $e) {
                    $error = $e->getMessage();
                    $systemStatus['error'] = $error;
                }
            }
        }
    }
}

// System status
$systemStatus['php_version'] = phpversion();
$systemStatus['has_texy'] = $hasTexy;
$systemStatus['has_factory'] = $hasTexylaFactory;
$systemStatus['texyla_version'] = TEXYLA_DEMO_VERSION;
$systemStatus['environment'] = TEXYLA_DEMO_ENV;

// ============================================
// 3. ZPRACOVÁNÍ FORMULÁŘE
// ============================================

$processedOutput = [];
$originalInput = [
    'admin' => $demoAdminContent,
    'forum' => $demoForumContent
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // BEZPEČNÉ načtení POST dat
    $originalInput['admin'] = $_POST['content_admin'] ?? $demoAdminContent;
    $originalInput['forum'] = $_POST['content_forum'] ?? $demoForumContent;
    
    if ($hasTexy && $hasTexylaFactory) {
        try {
            list($texyAdmin, ) = \Texyla\TexylaConfigFactory::getContextSetup('admin');
            list($texyForum, ) = \Texyla\TexylaConfigFactory::getContextSetup('forum');
            
            $processedOutput['admin'] = $texyAdmin->process($originalInput['admin']);
            $processedOutput['forum'] = $texyForum->process($originalInput['forum']);
            
            $systemStatus['processed_admin'] = true;
            $systemStatus['processed_forum'] = true;
            
        } catch (Exception $e) {
            $error = $e->getMessage();
            $systemStatus['processing_error'] = $error;
        }
    }
}

// ============================================
// 4. HTML VÝSTUP
// ============================================
?>
<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Texyla Demo <?= TEXYLA_DEMO_VERSION ?> - Automatická konfigurace s dialogy</title>
    
    <!-- TEXYLA CORE CSS (jádro knihovny) -->
    <link rel="stylesheet" href="../assets/style.css">
    
    <!-- DEMO SPECIFIC STYLES -->
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 2rem 1rem;
        }
        
        .demo-container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .demo-header {
            text-align: center;
            margin-bottom: 3rem;
            color: white;
        }
        
        .demo-header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .demo-header p {
            font-size: 1.125rem;
            opacity: 0.9;
        }
        
        .dream-team {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 0.5rem 1.5rem;
            border-radius: 2rem;
            margin: 1rem 0;
            font-weight: 600;
            backdrop-filter: blur(10px);
        }
        
        .version-badge {
            display: inline-block;
            background: #2ecc71;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            margin-left: 0.5rem;
            vertical-align: middle;
        }
        
        .dialog-badge {
            display: inline-block;
            background: #9b59b6;
            color: white;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            font-weight: 500;
            margin-left: 0.5rem;
            vertical-align: middle;
        }
        
        .demo-editors {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        @media (max-width: 1024px) {
            .demo-editors {
                grid-template-columns: 1fr;
            }
        }
        
        .editor-card {
            background: white;
            border-radius: 1rem;
            padding: 1.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
        }
        
        .editor-card h2 {
            color: #2d3748;
            margin-bottom: 1rem;
            padding-bottom: 0.75rem;
            border-bottom: 3px solid #4299e1;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .editor-info {
            background: #f0fff4;
            border-left: 4px solid #38a169;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0.5rem;
            font-size: 0.875rem;
        }
        
        .editor-info h3 {
            color: #276749;
            margin-bottom: 0.5rem;
        }
        
        .dialogs-info {
            background: #e6fffa;
            border-left: 4px solid #81e6d9;
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0.5rem;
            font-size: 0.875rem;
        }
        
        .dialogs-info h3 {
            color: #234e52;
            margin-bottom: 0.5rem;
        }
        
        .dialogs-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        
        .dialog-tag {
            background: #81e6d9;
            color: #234e52;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .submit-btn {
            display: block;
            width: 100%;
            background: #2ecc71;
            color: white;
            border: none;
            padding: 1rem 2rem;
            font-size: 1.125rem;
            font-weight: 600;
            border-radius: 0.75rem;
            cursor: pointer;
            transition: background 0.2s;
            margin-top: 2rem;
        }
        
        .submit-btn:hover {
            background: #27ae60;
        }
        
        .results {
            background: white;
            border-radius: 1rem;
            padding: 1.5rem;
            margin-top: 2rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        
        .results h2 {
            color: #2d3748;
            margin-bottom: 1rem;
        }
        
        .result-item {
            margin: 1.5rem 0;
            padding: 1rem;
            background: #f8fafc;
            border-radius: 0.5rem;
        }
        
        .status-bar {
            background: white;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-bottom: 2rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            justify-content: space-between;
        }
        
        .status-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .status-badge--success {
            background: #c6f6d5;
            color: #22543d;
        }
        
        .status-badge--warning {
            background: #fed7d7;
            color: #742a2a;
        }
        
        .status-badge--info {
            background: #bee3f8;
            color: #2c5282;
        }
        
        .status-badge--purple {
            background: #e9d8fd;
            color: #44337a;
        }
        
        .footer {
            text-align: center;
            margin-top: 3rem;
            color: white;
            opacity: 0.8;
        }
        
        .footer a {
            color: #90cdf4;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .auto-config-info {
            background: #e6fffa;
            border: 2px solid #81e6d9;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1.5rem 0;
        }
        
        .auto-config-info h3 {
            color: #234e52;
            margin-bottom: 0.5rem;
        }
        
        .warning-box {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1.5rem 0;
            color: #856404;
        }
        
        .keyboard-shortcuts {
            background: #fffaf0;
            border: 2px solid #ed8936;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1.5rem 0;
            font-size: 0.875rem;
        }
        
        .keyboard-shortcuts h3 {
            color: #c05621;
            margin-bottom: 0.5rem;
        }
        
        .shortcut-item {
            display: flex;
            justify-content: space-between;
            margin: 0.5rem 0;
            padding: 0.25rem 0;
            border-bottom: 1px dashed #e2e8f0;
        }
        
        .shortcut-key {
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            background: #edf2f7;
            padding: 0.125rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.75rem;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <!-- HLAVIČKA -->
        <header class="demo-header">
            <h1>🎯 Texyla Demo 
                <span class="version-badge">v<?= TEXYLA_DEMO_VERSION ?></span>
                <span class="dialog-badge">+DIALOGY</span>
            </h1>
            <p>Moderní WYSIWYM editor pro Texy! syntax s univerzálními dialogy</p>
            <div class="dream-team">Petr & Bó Dream Team</div>
        </header>
        
        <!-- INFO O AUTOMATICKÉ KONFIGURACI -->
        <div class="auto-config-info">
            <h3>🚀 100% Automatická konfigurace + Dialogový systém</h3>
            <p>Žádný <code>config.php</code>! Texyla se automaticky nakonfiguruje z Texy! instance pomocí <code>TexylaConfigFactory</code>.</p>
            <p><strong>Nové:</strong> Dialogová tlačítka (🔗, 🖼️, H, </>+) otevírají uživatelsky přívětivé formuláře.</p>
        </div>
        
        <!-- STATUS BAR -->
        <div class="status-bar">
            <div class="status-item">
                <span>PHP <?= phpversion() ?></span>
            </div>
            
            <div class="status-item">
                <span>Texy!:</span>
                <span class="status-badge <?= $hasTexy ? 'status-badge--success' : 'status-badge--warning' ?>">
                    <?= $hasTexy ? '✅ ' . ($systemStatus['texy_version'] ?? '3.x') : '⚠️ Nedostupné' ?>
                </span>
            </div>
            
            <div class="status-item">
                <span>Automatická konfigurace:</span>
                <span class="status-badge <?= $hasTexylaFactory ? 'status-badge--success' : 'status-badge--warning' ?>">
                    <?= $hasTexylaFactory ? '✅ Dostupné' : '⚠️ Základní' ?>
                </span>
            </div>
            
            <div class="status-item">
                <span>Dialogy:</span>
                <span class="status-badge status-badge--purple">
                    <?= count($availableDialogs) ?> typů
                </span>
            </div>
            
            <?php if (isset($systemStatus['admin_buttons'])): ?>
            <div class="status-item">
                <span>Tlačítka Admin:</span>
                <span class="status-badge status-badge--info">
                    <?= $systemStatus['admin_buttons'] ?>
                </span>
            </div>
            <?php endif; ?>
            
            <?php if (isset($systemStatus['forum_buttons'])): ?>
            <div class="status-item">
                <span>Tlačítka Forum:</span>
                <span class="status-badge status-badge--info">
                    <?= $systemStatus['forum_buttons'] ?>
                </span>
            </div>
            <?php endif; ?>
            
            <?php if (isset($error)): ?>
            <div class="status-item">
                <span class="status-badge status-badge--warning">
                    ⚠️ Chyba: <?= htmlspecialchars($error) ?>
                </span>
            </div>
            <?php endif; ?>
        </div>
        
        <!-- KEYBOARD SHORTCUTS -->
        <div class="keyboard-shortcuts">
            <h3>⌨️ Klávesové zkratky</h3>
            <div class="shortcut-item">
                <span>Přepnout náhled</span>
                <code class="shortcut-key">Ctrl + P</code>
            </div>
            <div class="shortcut-item">
                <span>Tučný text (coming soon)</span>
                <code class="shortcut-key">Ctrl + B</code>
            </div>
            <div class="shortcut-item">
                <span>Kurzíva (coming soon)</span>
                <code class="shortcut-key">Ctrl + I</code>
            </div>
            <div class="shortcut-item">
                <span>Odkaz (coming soon)</span>
                <code class="shortcut-key">Ctrl + K</code>
            </div>
        </div>
        
        <?php if (!$hasTexy): ?>
        <div class="warning-box">
            <h3>⚠️ Texy! není nainstalována</h3>
            <p>Pro plnou funkcionalitu nainstalujte Texy! přes Composer:</p>
            <pre style="background: rgba(0,0,0,0.05); padding: 0.75rem; border-radius: 0.25rem; margin-top: 0.5rem;">
composer require texy/texy</pre>
            <p><small>Demo bude fungovat i bez Texy!, ale nebude generovat náhledy a toolbar bude prázdný.</small></p>
        </div>
        <?php endif; ?>
        
        <!-- HLAVNÍ FORMULÁŘ -->
        <form method="post" action="">
            <div class="demo-editors">
                <!-- EDITOR 1: ADMIN -->
                <div class="editor-card">
                    <h2>
                        📝 Editor: Admin (plná syntaxe + dialogy)
                        <?php if (isset($systemStatus['admin_buttons'])): ?>
                        <span class="status-badge status-badge--info">
                            <?= $systemStatus['admin_buttons'] ?> tlačítek
                        </span>
                        <?php endif; ?>
                    </h2>
                    
                    <div class="editor-info">
                        <h3>📊 Automaticky vygenerováno z Texy! konfigurace:</h3>
                        <?php if ($hasTexylaFactory): ?>
                        <ul>
                            <li><strong>Plná syntaxe</strong> (nadpisy, obrázky, tabulky, kód)</li>
                            <li><strong>4 dialogy</strong> (odkazy, obrázky, nadpisy, bloky kódu)</li>
                            <li><strong>Bezpečnostní filtry</strong> (žádné HTML, CSS, JS)</li>
                        </ul>
                        <?php else: ?>
                        <p><em>Základní konfigurace (TexylaConfigFactory není dostupný)</em></p>
                        <?php endif; ?>
                    </div>
                    
                    <?php if (!empty($availableDialogs)): ?>
                    <div class="dialogs-info">
                        <h3>🎯 Dialogová tlačítka (klikni pro otevření):</h3>
                        <div class="dialogs-list">
                            <?php foreach ($availableDialogs as $dialogType => $dialogTitle): ?>
                            <span class="dialog-tag" title="<?= htmlspecialchars($dialogTitle) ?>">
                                <?= htmlspecialchars($dialogType) ?>
                            </span>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <label for="editor1" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                        Obsah článku:
                    </label>
                    
                    <textarea 
                        id="editor1" 
                        name="content_admin" 
                        class="texyla-textarea"
                        rows="15"
                        data-context="admin"
                        data-texyla-config="<?= $configAdmin ?>"
                        style="width: 100%; padding: 1rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; font-family: 'Courier New', monospace; resize: vertical;"
                    ><?= texyla_escape_textarea($originalInput['admin']) ?></textarea>
                    
                    <div class="texyla__preview" data-for="editor1" style="margin-top: 1rem;"></div>
                </div>
                
                <!-- EDITOR 2: FORUM -->
                <div class="editor-card">
                    <h2>
                        💬 Editor: Forum (omezená syntaxe)
                        <?php if (isset($systemStatus['forum_buttons'])): ?>
                        <span class="status-badge status-badge--info">
                            <?= $systemStatus['forum_buttons'] ?> tlačítek
                        </span>
                        <?php endif; ?>
                    </h2>
                    
                    <div class="editor-info">
                        <h3>🎯 Omezená syntaxe pro bezpečnost:</h3>
                        <?php if ($hasTexylaFactory): ?>
                        <ul>
                            <li><strong>Základní formátování</strong> (tučné, kurzíva, kód)</li>
                            <li><strong>Odkazy povoleny</strong>, obrázky zakázány</li>
                            <li><strong>Žádné dialogy</strong> - pouze inline markery</li>
                            <li><strong>Žádné bloky kódu</strong>, tabulky nebo nadpisy</li>
                        </ul>
                        <?php else: ?>
                        <p><em>Základní konfigurace (TexylaConfigFactory není dostupný)</em></p>
                        <?php endif; ?>
                    </div>
                    
                    <label for="editor2" style="display: block; margin-bottom: 0.5rem; font-weight: 600;">
                        Komentář:
                    </label>
                    
                    <textarea 
                        id="editor2" 
                        name="content_forum" 
                        class="texyla-textarea"
                        rows="15"
                        data-context="forum"
                        data-texyla-config="<?= $configForum ?>"
                        style="width: 100%; padding: 1rem; border: 2px solid #e2e8f0; border-radius: 0.5rem; font-family: 'Courier New', monospace; resize: vertical;"
                    ><?= texyla_escape_textarea($originalInput['forum']) ?></textarea>
                    
                    <div class="texyla__preview" data-for="editor2" style="margin-top: 1rem;"></div>
                </div>
            </div>
            
            <!-- TLAČÍTKO -->
            <button type="submit" class="submit-btn">
                📤 Odeslat a zpracovat na serveru (Texy! → HTML)
            </button>
        </form>
        
        <!-- VÝSLEDKY ZPRACOVÁNÍ -->
        <?php if (!empty($processedOutput)): ?>
        <div class="results">
            <h2>✅ Výsledky zpracování Texy!</h2>
            <p><small>Níže vidíte HTML výstup z Texy! (to co by se uložilo do databáze)</small></p>
            
            <div class="result-item">
                <h3>Admin výstup (plná syntaxe + dialogy):</h3>
                <div style="padding: 1.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow-x: auto;">
                    <?= $processedOutput['admin'] ?>
                </div>
            </div>
            
            <div class="result-item">
                <h3>Forum výstup (omezená syntaxe):</h3>
                <div style="padding: 1.5rem; background: white; border: 1px solid #e2e8f0; border-radius: 0.5rem; overflow-x: auto;">
                    <?= $processedOutput['forum'] ?>
                </div>
            </div>
        </div>
        <?php endif; ?>
        
        <!-- DEBUG INFO -->
        <div class="status-bar" style="margin-top: 2rem;">
            <div class="status-item">
                <span class="status-badge status-badge--info">
                    🔍 Debug info
                </span>
            </div>
            <div class="status-item">
                <span>Konfigurace generována: <?= $hasTexylaFactory ? 'ANO (TexylaConfigFactory)' : 'NE (základní)' ?></span>
            </div>
            <div class="status-item">
                <span>Editory: 2 (Texyla Vanilla JS + Dialogy)</span>
            </div>
            <div class="status-item">
                <span>Dialogy: <?= count($availableDialogs) ?> (link, image, heading, code-block)</span>
            </div>
            <div class="status-item">
                <span>Endpoint: <code>/src/TexylaController.php</code></span>
            </div>
        </div>
        
        <!-- PATIČKA -->
        <footer class="footer">
            <p>© <?= date('Y') ?> Texyla Rewrite Dream Team • v<?= TEXYLA_DEMO_VERSION ?> • <?= TEXYLA_DEMO_ENV ?></p>
            <p>
                <strong>🚀 100% Automatická konfigurace + Dialogový systém</strong>
            </p>
            <p>
                <a href="https://github.com/your-repo/texyla-rewrite" target="_blank">GitHub</a> | 
                <a href="https://texy.info" target="_blank">Texy! dokumentace</a> | 
                <a href="?debug=1">Debug mode</a> | 
                <a href="?">Znovu načíst</a>
            </p>
        </footer>
    </div>
    
    <!-- TEXYLA JAVASCRIPT KNIHOVNY -->
    <script src="../assets/texyla.js?v=<?= time() ?>"></script>
    <script src="../assets/TexylaDialog.js?v=<?= time() ?>"></script>
    
    <!-- INICIALIZACE EDITORŮ S DIALOGY -->
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 Inicializace Texyla editorů s dialogovým systémem...');
        
        const previewEndpoint = '../src/TexylaController.php';
        const editors = [
            { 
                id: 'editor1', 
                config: <?= json_encode($configAdmin) ?>,
                context: 'admin',
                hasDialogs: true
            },
            { 
                id: 'editor2', 
                config: <?= json_encode($configForum) ?>,
                context: 'forum',
                hasDialogs: false
            }
        ];
        
        let initialized = 0;
        let errors = [];
        
        // Globální reference na editory pro debugování
        window.texylaEditors = {};
        
        editors.forEach(function(editorInfo) {
            const textarea = document.getElementById(editorInfo.id);
            if (!textarea) {
                console.warn('Textarea nenalezena:', editorInfo.id);
                errors.push('Textarea #' + editorInfo.id + ' nenalezena');
                return;
            }
            
            try {
                // Vytvořit editor
                const editor = new TexylaVanilla(textarea, previewEndpoint);
                
                // Rozšířit editor o dialogové funkce
                if (editorInfo.hasDialogs) {
                    enhanceEditorWithDialogs(editor, editorInfo.id);
                }
                
                // Uložit referenci pro debug
                window.texylaEditors[editorInfo.id] = editor;
                
                console.log('✅ Editor inicializován:', editorInfo.id, editorInfo.hasDialogs ? '(s dialogy)' : '(bez dialogů)');
                initialized++;
                
            } catch (error) {
                console.error('❌ Chyba editoru', editorInfo.id, ':', error);
                errors.push('Editor #' + editorInfo.id + ': ' + error.message);
                
                // Zobrazit chybu uživateli
                const errorDiv = document.createElement('div');
                errorDiv.style.cssText = 'background:#fed7d7;color:#c53030;padding:0.75rem;margin-top:0.5rem;border-radius:0.25rem;';
                errorDiv.innerHTML = '⚠️ <strong>Chyba editoru:</strong> ' + error.message;
                textarea.parentNode.appendChild(errorDiv);
            }
        });
        
        // Summary log
        console.log(`🎉 Inicializace dokončena: ${initialized}/${editors.length} editorů`);
        if (errors.length > 0) {
            console.warn('Chyby:', errors);
        }
        
        // Dialogové funkce
        function enhanceEditorWithDialogs(editor, editorId) {
            // Přepsat _handleButtonClick pro podporu dialogů
            const originalHandleButtonClick = editor._handleButtonClick;
            
            editor._handleButtonClick = function(button) {
                const marker = button.dataset.marker;
                
                // Pokud je marker DIALOG:xxx, otevři dialog
                if (marker && marker.startsWith('DIALOG:')) {
                    const dialogType = marker.replace('DIALOG:', '');
                    this._openDialog(dialogType);
                    return;
                }
                
                // Jinak použij původní chování
                originalHandleButtonClick.call(this, button);
            };
            
            // Implementace _openDialog
            editor._openDialog = function(type) {
                console.log('Opening dialog:', type);
                
                const selectedText = this._getSelectedText();
                const defaults = {};
                
                // Nastavit výchozí hodnoty podle typu dialogu
                if (type === 'link') {
                    defaults.text = selectedText;
                } else if (type === 'code-block') {
                    defaults.content = selectedText;
                } else if (type === 'heading') {
                    defaults.text = selectedText;
                    defaults.level = 3;
                }
                
                // Vytvořit a zobrazit dialog
                const dialog = new TexylaDialog(type, {
                    onSubmit: (result) => {
                        console.log('Dialog result:', result);
                        this._wrapSelection(result.syntax);
                    },
                    defaults: defaults
                });
                
                dialog.show();
            };
            
            console.log(`✅ Dialogový systém připojen k editoru ${editorId}`);
        }
        
        // Keyboard shortcuts info
        console.log('⌨️ Klávesové zkratky: Ctrl+P (náhled), dialogy: 🔗, 🖼️, H, </>+');
        
        // Debug funkce pro vývojáře
        window.debugTexyla = function() {
            console.log('=== TEXYLA DEBUG ===');
            console.log('Editors:', window.texylaEditors);
            console.log('TexylaVanilla:', typeof TexylaVanilla);
            console.log('TexylaDialog:', typeof TexylaDialog);
            
            // Test dialogu
            if (window.texylaEditors.editor1) {
                console.log('Test dialogu: otevírám link dialog');
                window.texylaEditors.editor1._openDialog('link');
            }
        };
    });
    </script>
</body>
</html>