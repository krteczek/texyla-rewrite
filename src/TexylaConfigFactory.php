<?php
/**
 * Project: Texyla Rewrite Dream Team
 * File: /texyla-rewrite/src/TexylaConfigFactory.php
 * Description: Továrna pro kontextové nastavení Texy! a konfiguraci tlačítek
 * 
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @license MIT
 */

declare(strict_types=1);

namespace Texyla;

/**
 * Továrna pro vytváření Texy! instancí a konfigurací podle kontextu
 * 
 * Zajišťuje synchronizaci mezi:
 * 1. PHP Texy! konfigurací (zpracování na serveru)
 * 2. JavaScript konfigurací tlačítek (zobrazení na frontendu)
 */
class TexylaConfigFactory
{
    /**
     * Vrátí Texy! instanci a JSON konfiguraci pro daný kontext
     * 
     * @param string $context Název kontextu ('admin', 'forum', 'default')
     * @return array [\Texy\Texy, string] Texy objekt a JSON konfigurace tlačítek
     * @throws \RuntimeException Pokud selže načtení konfigurace
     */
    public static function getContextSetup(string $context): array
    {
        // 1. Načtení konfigurace tlačítek z config.php
        $markers = self::loadButtonConfig($context);
        
        // 2. Vytvoření Texy! instance pro daný kontext
        $texyObject = self::createTexyForContext($context);
        
        // 3. Příprava JSON konfigurace pro frontend
        $jsonConfig = self::prepareJsonConfig($markers);
        
        return [$texyObject, $jsonConfig];
    }
    
    /**
     * Načte konfiguraci tlačítek pro daný kontext
     * 
     * @param string $context Název kontextu
     * @return array Konfigurace tlačítek
     * @throws \RuntimeException Pokud konfigurační soubor neexistuje
     */
    private static function loadButtonConfig(string $context): array
    {
        $configFile = __DIR__ . '/../config.php';
        
        if (!file_exists($configFile)) {
            throw new \RuntimeException(
                "Konfigurační soubor {$configFile} nebyl nalezen."
            );
        }
        
        $fullConfig = require $configFile;
        
        // Vrátí konfiguraci pro kontext nebo výchozí
        return $fullConfig['texyla'][$context] 
            ?? $fullConfig['texyla']['default'] 
            ?? [];
    }
    
    /**
     * Vytvoří Texy! instanci specifickou pro kontext
     * 
     * @param string $context Název kontextu
     * @return \Texy\Texy Nakonfigurovaná Texy! instance
     */
    private static function createTexyForContext(string $context): \Texy\Texy
    {
        $texy = new \Texy\Texy();
        
        // Základní nastavení pro Texy! 3.2
        $texy->mergeLines = true;
        $texy->obfuscateEmail = true;
        
        // Kontextové nastavení povolených elementů
        self::configureAllowedElements($texy, $context);
        
        return $texy;
    }
    
    /**
     * Nakonfiguruje povolené elementy podle kontextu
     * 
     * @param \Texy\Texy $texy Texy! instance
     * @param string $context Název kontextu
     */
    private static function configureAllowedElements(\Texy\Texy $texy, string $context): void
    {
        $allowedConfig = self::getAllowedConfig($context);
        
        foreach ($allowedConfig as $element => $isAllowed) {
            $texy->allowed[$element] = $isAllowed;
        }
    }
    
    /**
     * Vrátí konfiguraci povolených elementů pro daný kontext
     * 
     * @param string $context Název kontextu
     * @return array Konfigurace povolených elementů
     */
    private static function getAllowedConfig(string $context): array
    {
        $configs = [
            'admin' => [
                'phrase/strong' => true,    // **tučné**
                'phrase/em' => true,        // *kurzíva*
                'phrase/code' => true,      // `kód`
                'phrase/sup' => true,       // ^horní index^
                'phrase/sub' => true,       // _dolní index_
                'image' => true,            // [* obrázek *]
                'link' => true,             // [odkaz](url)
                'block/code' => true,       // ```blok kódu```
                'block/quote' => true,      // > citace
                'heading' => true,          // ### nadpis
                'list' => true,             // - seznam
                'table' => true,            // | tabulka |
                'horizline' => true,        // ---
            ],
            'forum' => [
                'phrase/strong' => true,
                'phrase/em' => true,
                'phrase/code' => true,
                'image' => false,
                'link' => true,
                'block/code' => false,
                'block/quote' => true,
                'heading' => false,
                'list' => true,
                'table' => false,
                'horizline' => false,
            ],
            'default' => [
                'phrase/strong' => true,
                'phrase/em' => true,
                'phrase/code' => true,
                'image' => false,
                'link' => true,
                'block/code' => false,
                'block/quote' => false,
                'heading' => false,
                'list' => false,
                'table' => false,
                'horizline' => false,
            ]
        ];
        
        return $configs[$context] ?? $configs['default'];
    }
    
    /**
     * Připraví JSON konfiguraci pro frontend
     * 
     * @param array $markers Konfigurace tlačítek
     * @return string JSON konfigurace bezpečně escapovaná pro HTML atribut
     */
    private static function prepareJsonConfig(array $markers): string
    {
        $json = json_encode(
            $markers,
            JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE
        );
        
        return htmlspecialchars($json, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
    
    /**
     * Ladící metoda pro zobrazení povolených elementů
     * 
     * @param \Texy\Texy $texy Texy! instance
     * @return array Seznam povolených elementů
     */
    public static function debugAllowedElements(\Texy\Texy $texy): array
    {
        return array_filter($texy->allowed ?? []);
    }
}