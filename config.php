<?php
/**
 * Project: Texyla Rewrite Dream Team
 * File: /texyla-rewrite/config.php
 * Description: Konfigurace tlačítek pro Texyla Editor s emoji ikonami
 * 
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @license MIT
 */

declare(strict_types=1);

return [
    'texyla' => [
        // Konfigurace pro Články / Admin (plná syntaxe)
        'admin' => [
            ['label' => '🔤', 'marker' => '**', 'title' => 'Tučné'],
            ['label' => '🔠', 'marker' => '*', 'title' => 'Kurzíva'],
            ['label' => '📷', 'marker' => '[*]', 'title' => 'Vložit obrázek'],
            ['label' => '🔗', 'marker' => '[]', 'title' => 'Vložit odkaz'],
            ['label' => '📋', 'marker' => '```', 'title' => 'Blok kódu'],
            ['label' => '🔢', 'marker' => '###', 'title' => 'Nadpis 3. úrovně'],
            ['label' => '💬', 'marker' => '>', 'title' => 'Citace'],
        ],

        // Konfigurace pro Fórum / Komentáře (omezená syntaxe)
        'forum' => [
            ['label' => '🔤', 'marker' => '**', 'title' => 'Tučné'],
            ['label' => '🔠', 'marker' => '*', 'title' => 'Kurzíva'],
            ['label' => '💬', 'marker' => '>', 'title' => 'Citace'],
        ],

        // Výchozí nastavení (fallback)
        'default' => [
            ['label' => '🔤', 'marker' => '**', 'title' => 'Tučné'],
            ['label' => '🔠', 'marker' => '*', 'title' => 'Kurzíva'],
        ]
    ]
];