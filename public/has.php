<?php
// demo/has-texy.php
echo '<h1>🕵️‍♂️ Texy Detective</h1>';

// Zkusíme všechny možné cesty
$paths = [
    __DIR__ . '/vendor/autoload.php',
    __DIR__ . '/../vendor/texyla/libs/texy/src/Texy.php',
    __DIR__ . '/../vendor/dg/texy/src/Texy.php',
    __DIR__ . '/../vendor/texy/texy/src/Texy.php',
];

foreach ($paths as $path) {
    echo "Test: " . htmlspecialchars($path) . " → ";
    
    if (file_exists($path)) {
        echo '<span style="color:green">✅ EXISTUJE</span><br>';
        
        // Zkusíme načíst
        try {
            require_once $path;
            echo "&nbsp;&nbsp;Načteno<br>";
        } catch (Exception $e) {
            echo '<span style="color:red">&nbsp;&nbsp;❌ ' . htmlspecialchars($e->getMessage()) . '</span><br>';
        }
    } else {
        echo '<span style="color:gray">❌ NE</span><br>';
    }
}

echo '<hr><h2>Výsledek:</h2>';

if (class_exists('Texy\Texy')) {
    echo '<div style="background:green;color:white;padding:2rem;">';
    echo '🎉 TEXY 3.x NALEZENA! (s namespace)<br>';
    echo 'Verze: ' . Texy\Texy::VERSION;
    echo '</div>';
} elseif (class_exists('Texy')) {
    echo '<div style="background:orange;color:white;padding:2rem;">';
    echo '⚠️ TEXY 2.x NALEZENA! (bez namespace)<br>';
    echo 'Pozor: Texyla potřebuje Texy 3.x s namespace';
    echo '</div>';
} else {
    echo '<div style="background:red;color:white;padding:2rem;">';
    echo '💀 TEXY NENALEZENA!<br>';
    echo 'Texyla bez Texy nemůže fungovat.';
    echo '</div>';
    
    echo '<h3>Možná řešení:</h3>';
    echo '<ol>';
    echo '<li><code>composer require dg/texy</code></li>';
    echo '<li>Stáhnout Texy ručně z GitHubu</li>';
    echo '<li>Použít fallback (ale to není Texyla)</li>';
    echo '</ol>';
}
?>