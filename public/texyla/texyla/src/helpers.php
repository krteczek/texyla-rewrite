<?php
declare(strict_types=1);

function loadAutoload(): bool
{
    foreach ([
        __DIR__ . '/../vendor/autoload.php',
        __DIR__ . '/../../vendor/autoload.php',
        __DIR__ . '/../../../vendor/autoload.php',
        __DIR__ . '/../../../../vendor/autoload.php',
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
