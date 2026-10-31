<?php
declare(strict_types=1);

define('TEXYLA_ENTRY', true);

ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/Src/helpers.php';
require_once __DIR__ . '/Src/Config.php';

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// 1. Kontrola Texy
$error = checkTexy();
if ($error !== null) {
    http_response_code(500);
    echo '<div class="texyla-error"><p>❌ Texyla nemůže běžet</p><small>'
        . htmlspecialchars($error, ENT_QUOTES, 'UTF-8')
        . '</small></div>';
    exit;
}

// 2. Jen POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo '<p class="texyla-error">Povolená je jen metoda POST.</p>';
    exit;
}

// 3. Parsování JSONu — JEDNOU
$input = file_get_contents('php://input');
$data = json_decode((string) $input, true);

if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo '<p class="texyla-error">❌ Neplatný JSON formát požadavku.</p>';
    exit;
}

$source = (string) ($data['texy_source'] ?? '');
$config = is_array($data['config'] ?? null) ? $data['config'] : [];

if ($source === '') {
    exit; // prázdný výstup, 200
}

// 4. Slepá instance + aplikace configu
try {
    $texy = new \Texy\Texy();
    \Texyla\Config::apply($texy, $config);
    echo $texy->process($source);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('Texyla preview error: ' . $e->getMessage());
    echo '<div class="texyla-error"><p>❌ Chyba náhledu</p><small>'
        . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8')
        . '</small></div>';
}