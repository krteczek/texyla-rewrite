<?php
/**
 * Project: Texyla Rewrite Dream Team
 * File: /texyla-rewrite/src/TexylaImplementation.php
 * Description: Základní třída pro vytváření Texy! instancí
 * 
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @license MIT
 */

declare(strict_types=1);

namespace Texyla;

/**
 * Třída pro vytváření a konfiguraci Texy! instancí
 * 
 * Poskytuje základní, bezpečně nakonfigurované instance Texy! knihovny
 * pro použití v Texyla editoru.
 */
class TexylaImplementation
{
    /**
     * Vrátí novou, minimalisticky nastavenou instanci Texy!
     * 
     * Instance je konfigurována pro bezpečné zpracování uživatelského vstupu
     * s povolením základních formátovacích možností.
     * 
     * @return \Texy\Texy Nakonfigurovaná instance Texy! knihovny
     */
    public function getCleanInstance(): \Texy\Texy
    {
        $texy = new \Texy\Texy();
        
        // Bezpečné výchozí nastavení pro Texy! 3.2
        $texy->mergeLines = true; // Spojování řádků odstavců
        $texy->obfuscateEmail = true; // Ochrana emailů před spamboty
        
        // Povolení základních formátovacích možností
        $texy->allowed = [
            'phrase/strong' => true,  // **tučné**
            'phrase/em' => true,      // *kurzíva*
            'phrase/code' => true,    // `kód`
            'image' => false,         // [* obrázek *] - zakázáno pro bezpečnost
            'link' => true,           // [odkaz](url)
            'block/code' => false,    // ```blok kódu```
            'block/quote' => false,   // > citace
            'heading' => false,       // ### nadpis
            'list' => false,          // - seznam
            'table' => false,         // | tabulka |
            'horizline' => false,     // ---
        ];
        
        return $texy;
    }
}