<?php
declare(strict_types=1);

require_once(dirname(__FILE__) . '/helpers.php');

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');


$error = checkTexy();
if ($error !== null) {
    http_response_code(500);
    echo '<div class="texyla-error"><p>❌ Texyla nemůže běžet</p><small>'
        . htmlspecialchars($error, ENT_QUOTES, 'UTF-8')
        . '</small></div>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo '<p class="texyla-error">Povolená je jen metoda POST.</p>';
    exit;
}

// Kontrola validity JSON vstupu
$input = file_get_contents('php://input');
$data = json_decode((string) $input, true);

if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo '<p class="texyla-error">❌ Neplatný JSON formát požadavku.</p>';
    exit;
}

$source  = (string) ($data['texy_source'] ?? '');
$profile = (string) ($data['profile'] ?? $data['context'] ?? 'default');

$allowed = ['admin', 'forum', 'codeforum', 'default'];
if (!in_array($profile, $allowed, true)) {
    $profile = 'default';
}

if ($source === '') {
    exit; // Vrací prázdný řetězec s kódem 200
}

// Načtení továrny až ve chvíli, kdy máme validní data
require_once __DIR__ . '/src/Factory/TexyFactory.php';

require_once __DIR__ . '/src/Config.php'; // nebo přes autoload

$data = json_decode(file_get_contents('php://input') ?: '[]', true) ?? [];
$source = (string) ($data['texy_source'] ?? '');
$config = is_array($data['config'] ?? null) ? $data['config'] : [];

$texy = new \Texy\Texy();          // slepá instance
\Texyla\Config::apply($texy, $config); // jen validované nastavení

echo $texy->process($source);

try {
    $texy = \Texyla\Factory\TexyFactory::createForProfile($profile);
    echo $texy->process($source);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('Texyla preview error: ' . $e->getMessage());
    echo '<div class="texyla-error"><p>❌ Chyba náhledu</p><small>'
        . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8')
        . '</small></div>';
}
