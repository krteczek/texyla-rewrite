<?php
declare(strict_types=1);

if (!defined('TEXYLA_ENTRY')) {
    http_response_code(404);
    exit;
}

/**
 * Načte Composer autoload. Hledá vendor/autoload.php o několik úrovní výš.
 */
function loadAutoload(): bool
{
    foreach ([
        __DIR__ . '/../../../vendor/autoload.php',
        __DIR__ . '/../../../../vendor/autoload.php',
        __DIR__ . '/../../../../../vendor/autoload.php',
    ] as $path) {
        if (is_file($path)) {
            require_once $path;
            return true;
        }
    }
    return false;
}

/**
 * Zkontroluje, zda je Texy dostupná.
 * Vrací null, pokud je vše v pořádku, jinak chybovou hlášku.
 */
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