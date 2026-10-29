<?php
declare(strict_types=1);

header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function loadAutoload(): bool
{
    
    foreach ([
        __DIR__ . '/../../vendor/autoload.php',
        __DIR__ . '/../vendor/autoload.php',
        __DIR__ . '/../../../vendor/autoload.php',
    ] as $path) {
        if (is_file($path)) {
            require_once $path;
            return true;
        }
    }
    return false;
}

function checkTexy(): ?string
{
    if (!loadAutoload()) {
        return 'Composer autoload nenalezen. V kořeni projektu spusť: composer install';
    }
    if (class_exists(\Texy\Texy::class)) {
        return null;
    }
    if (class_exists('Texy', false)) {
        return 'Nalezena Texy 2.x. Texyla vyžaduje Texy 3.x (composer require texy/texy).';
    }
    return 'Texy není dostupná. Nainstaluj: composer require texy/texy';
}

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
    echo '<p class="texyla-error">Povolená je jen metoda POST.</p>';
    exit;
}

require_once __DIR__ . '/src/Factory/TexyFactory.php';

$input = file_get_contents('php://input');
$data = json_decode($input ?: '[]', true) ?? [];
$source  = (string) ($data['texy_source'] ?? '');
$profile = (string) ($data['profile'] ?? $data['context'] ?? 'default');

$allowed = ['admin', 'forum', 'codeforum', 'default'];
if (!in_array($profile, $allowed, true)) {
    $profile = 'default';
}

if ($source === '') {
    echo '';
    exit;
}

try {
    $texy = \Texyla\Factory\TexyFactory::createForProfile($profile);
    echo $texy->process($source);
} catch (Throwable $e) {
    http_response_code(500);
    error_log('Texyla preview: ' . $e->getMessage());
    echo '<div class="texyla-error"><p>❌ Chyba náhledu</p><small>'
        . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8')
        . '</small></div>';
}