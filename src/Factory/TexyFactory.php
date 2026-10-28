<?php
/**
 * Vytváří Texy! instance podle profilu (admin / forum / codeforum / default).
 */

declare(strict_types=1);

namespace Texyla\Factory;

use Texy\Texy;

class TexyFactory
{
    public const PROFILES = ['admin', 'forum', 'codeforum', 'default'];

    /**
     * @param string $profile admin|forum|codeforum|default
     */
    public static function createForProfile(string $profile): Texy
    {
        if (!in_array($profile, self::PROFILES, true)) {
            $profile = 'default';
        }

        $texy = new Texy();

        // společné výchozí nastavení
        $texy->headingModule->top = 3;
        $texy->mergeLines = true;
        $texy->obfuscateEmail = true;

        foreach (self::getAllowedElements($profile) as $element => $isAllowed) {
            $texy->allowed[$element] = $isAllowed;
        }

        return $texy;
    }

    /** Alias kvůli staršímu názvu */
    public static function createForContext(string $context): Texy
    {
        return self::createForProfile($context);
    }

    /**
     * @return array<string, bool>
     */
    private static function getAllowedElements(string $profile): array
    {
        $presets = [
            // plný editor (admin, CMS, …)
            'admin' => [
                'phrase/strong' => true,
                'phrase/em'     => true,
                'phrase/code'   => true,
                'phrase/sup'    => true,
                'phrase/sub'    => true,
                'image'         => true,
                'link'          => true,
                'block/code'    => true,
                'block/quote'   => true,
                'heading'       => true,
                'list'          => true,
                'table'         => true,
                'horizline'     => true,
            ],

            // běžné fórum – bez obrázků, tabulek, nadpisů, bloků kódu
            'forum' => [
                'phrase/strong' => true,
                'phrase/em'     => true,
                'phrase/code'   => true,
                'phrase/sup'    => false,
                'phrase/sub'    => false,
                'image'         => false,
                'link'          => true,
                'block/code'    => false,
                'block/quote'   => true,
                'heading'       => false,
                'list'          => true,
                'table'         => false,
                'horizline'     => false,
            ],

            // fórum s kódem (jako forum + code block)
            'codeforum' => [
                'phrase/strong' => true,
                'phrase/em'     => true,
                'phrase/code'   => true,
                'phrase/sup'    => false,
                'phrase/sub'    => false,
                'image'         => false,
                'link'          => true,
                'block/code'    => true,
                'block/quote'   => true,
                'heading'       => false,
                'list'          => true,
                'table'         => false,
                'horizline'     => false,
            ],

            // minimum
            'default' => [
                'phrase/strong' => true,
                'phrase/em'     => true,
                'phrase/code'   => true,
                'phrase/sup'    => false,
                'phrase/sub'    => false,
                'image'         => false,
                'link'          => true,
                'block/code'    => false,
                'block/quote'   => false,
                'heading'       => false,
                'list'          => false,
                'table'         => false,
                'horizline'     => false,
            ],
        ];

        return $presets[$profile] ?? $presets['default'];
    }
}