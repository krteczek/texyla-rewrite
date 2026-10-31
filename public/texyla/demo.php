<?php
declare(strict_types=1);

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);


define('TEXYLA_ENTRY', true);

use Texy\Texy;

require_once __DIR__ . '/texyla/Php/Src/helpers.php';
require_once __DIR__ . '/texyla/Php/Src/Config.php';

$error = checkTexy();
if ($error !== null) {
    http_response_code(500);
    echo '<div class="texyla-error"><p>❌ Texyla nemůže běžet</p><small>'
        . htmlspecialchars($error, ENT_QUOTES, 'UTF-8')
        . '</small></div>';
    exit;
}
/**
 * Inicializace Texy
 */
$texyDemo = new Texy();

/** Začátek
 * ***************************************************************************************************************
 *     Následující řádky jsou důležité jen pro funkci našeho dema, v reálné aplikaci je nejspíše nepoužijete
 * ***************************************************************************************************************
 */

/** 2.vyčistíme nastavení: vše false */
$cleaner = require_once __DIR__ . '/demoTexyCleaner.php';
if (is_array($cleaner) && isset($cleaner['allowed']) && is_array($cleaner['allowed'])) {
    foreach ($cleaner['allowed'] as $key => $value) {
        $texyDemo->allowed[$key] = $value;
    }
}


/** Načteme nastavení demo profilů: */
$profiles = require_once(__DIR__ . '/demoTexyProfiles.php');
if(!is_array($profiles)) {
    $profiles = [];
}


// Výběr profilu (pro demo)
$profile = 'default';
if(isset($_GET['profile']) && in_array($_GET['profile'], ['admin', 'forum', 'default'], true)) {
    $profile = $_GET['profile'];
}

$settingsTexy = $profiles[$profile] ?? $profiles['default'];

/**
 * nastavení texy naším nastavením 
 * tohle jen kvuli demo, při implementaci se načítá Vaše nastavení Texy přímo z texy
 */
\Texyla\Config::apply($texyDemo, $settingsTexy);

/** KONEC
 * ***************************************************************************************************************
 *     Předchozí řádky jsou důležité jen pro funkci našeho dema, v reálné aplikaci je nejspíše nepoužijete
 * ***************************************************************************************************************
 */



/** 
 * získání konfigurace texy pro zobrazení tlačítek a 
 * dále pro to aby texyla.php věděla, co má znastavit texy a zpracovat
 */
$config = \Texyla\Config::extract($texyDemo);

/**
 * Načteme Testovací text
 */
$text = file_get_contents(__DIR__ . '/demo.txt');
?><!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <title>Texyla – demo (<?= htmlspecialchars($profile, ENT_QUOTES, 'UTF-8') ?>)</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <h1><a href="./demo.php">Texyla demo — profil: <?= htmlspecialchars($profile, ENT_QUOTES, 'UTF-8') ?></a></h1>

    <p>
        <a href="?profile=admin">admin</a> |
        <a href="?profile=forum">forum</a> |
        <a href="?profile=default">default</a>
    </p>
    <div>
        <textarea
            class="texyla"
            data-texyla-config='<?= \Texyla\Config::toJson($config) ?>'
            data-endpoint="./texyla/Php/texyla.php"
            data-theme="default"
            rows="12"
        ><?= htmlspecialchars($text, ENT_QUOTES, 'UTF-8') ?></textarea>
    </div>

    <script src="texyla/js/config/buttons.js?v=<?= filemtime(__DIR__ . '/texyla/js/config/buttons.js') ?>"></script>
    <script src="texyla/js/config/order.js?v=<?= filemtime(__DIR__ . '/texyla/js/config/order.js') ?>"></script>
    <script src="texyla/js/texyla.js?v=<?= filemtime(__DIR__ . '/texyla/js/texyla.js') ?>"></script>
</body>
</html>