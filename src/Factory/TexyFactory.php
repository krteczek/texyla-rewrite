<?php
declare(strict_types=1);

namespace Texyla;

class TexylaTexyFactory
{
    /**
     * Vytvoří správně nakonfigurovanou Texy! instanci pro daný kontext
     */
    public static function createForContext(string $context): \Texy\Texy
    {
        $texy = new \Texy\Texy();
        
        // Výchozí nastavení pro všechny kontexty
        $texy->headingModule->top = 3; // H1-H3
        $texy->mergeLines = true; // Spojování řádků
        $texy->obfuscateEmail = true; // Ochrana emailů
        
        // Povolené elementy podle kontextu
        $allowed = self::getAllowedElements($context);
        foreach ($allowed as $element => $isAllowed) {
            $texy->allowed[$element] = $isAllowed;
        }
        
        return $texy;
    }
    
    private static function getAllowedElements(string $context): array
    {
        $presets = [
            'admin' => [
                'phrase/strong' => true,
                'phrase/em' => true,
                'phrase/code' => true,
                'phrase/sup' => true,
                'phrase/sub' => true,
                'image' => true,
                'link' => true,
                'block/code' => true,
                'block/quote' => true,
                'heading' => true,
                'list' => true,
                'table' => true,
                'horizline' => true,
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
        
        return $presets[$context] ?? $presets['default'];
    }
}