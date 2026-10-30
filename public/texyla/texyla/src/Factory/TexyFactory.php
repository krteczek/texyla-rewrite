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
    public const HEADING_MODULE_TOP = 3;

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
        $texy->headingModule->top = self::HEADING_MODULE_TOP;
        $texy->mergeLines = true;
        $texy->obfuscateEmail = true;

        foreach (self::getAllowedElements($profile) as $element => $isAllowed) {
            $texy->allowed[$element] = $isAllowed;
        }

        return $texy;
    }

    /**
     * Nastavení zpracování textu pomocí texy. 
     * POZOR!!!
     * Toto nastavení je funkční jen pro Texylu!!! 
     * 
     * @return array<string, bool>
     */
    private static function getAllowedElements(string $profile): array
    {
        // výchozí „vypni vše“, pak profil něco zapne
        $off = [
            // --- phrase ---
            'phrase/strong'          => false,
            'phrase/strong+em'       => false,
            'phrase/em'              => false,
            'phrase/em-alt'          => false,
            'phrase/em-alt2'         => false,
            'phrase/ins'             => false,
            'phrase/del'             => false,
            'phrase/sup'             => false,
            'phrase/sup-alt'         => false,
            'phrase/sub'             => false,
            'phrase/sub-alt'         => false,
            'phrase/span'            => false,
            'phrase/span-alt'        => false,
            'phrase/quote'           => false,
            'phrase/acronym'         => false,
            'phrase/acronym-alt'     => false,
            'phrase/notexy'          => false,
            'phrase/code'            => false,
            'phrase/quicklink'       => false,
            'phrase/wikilink'        => false,
            'phrase/markdown'        => false,
            'phrase/escaped-asterix' => false,

            // --- odkazy ---
            'link'                   => false,
            'link/definition'        => false,
            'link/reference'         => false,
            'link/url'               => false,
            'link/email'             => false,

            // --- obrázky ---
            'image'                  => false,
            'image/definition'       => false,
            'figure'                 => false,

            // --- bloky ---
            'block/default'          => false,
            'block/pre'              => false,
            'block/code'             => false,
            'block/html'             => false,
            'block/text'             => false,
            'block/texysource'       => false,
            'block/comment'          => false,
            'block/div'              => false,
            'blocks'                 => false,
            'horizline'              => false,
            'blockquote'             => false,
            'table'                  => false,

            // --- nadpisy ---
            'heading/underlined'     => false,
            'heading/surrounded'     => false,

            // --- seznamy ---
            'list'                   => false,
            'list/definition'        => false,

            // --- ostatní ---
            'script'                 => false,
            'html/tag'               => false,
            'html/comment'           => false,
            'emoticon'               => false,
            'typography'             => false,
            'longwords'              => false,
        ];

        /**
         * Všechny klíče jsou vypnuté. 
         * Pokud chcete něco povolit můžete v jednotlivých profilech přidat klíč a 
         * nastavit u něj true
         * */
        $presets = [
            'admin' => array_merge($off, [
                'phrase/strong'      => true,
                'phrase/em'          => true,
                'phrase/code'        => true,
                'phrase/sup'         => true,
                'phrase/sub'         => true,
                'link'               => true,
                'link/url'           => true,
                'link/email'         => true,
                'image'              => true,
                'figure'             => true,
                'heading/surrounded' => true,
                'heading/underlined' => true,
                'blockquote'         => true,
                'list'               => true,
                'list/definition'    => true,
                'table'              => true,
                'horizline'          => true,
                'block/code'         => true,
                'block/pre'          => true,
                'block/html'         => true,
                'html/tag'           => true,
                'html/comment'       => true,
                'typography'         => true,
                'longwords'          => true,
            ]),

            'forum' => array_merge($off, [
                'phrase/strong'     => true,
                'phrase/em'         => true,
                'phrase/code'       => true,
                'link'              => true,
                'link/url'          => true,
                'link/email'        => true,
                'blockquote'        => true,
                'list'              => true,
                'list/definition'   => true,
                'typography'        => true,
                'longwords'         => true,
            ]),

            'codeforum' => array_merge($off, [
                'phrase/strong'     => true,
                'phrase/em'         => true,
                'phrase/code'       => true,
                'link'              => true,
                'link/url'          => true,
                'link/email'        => true,
                'blockquote'        => true,
                'list'              => true,
                'list/definition'   => true,
                'block/code'        => true,
                'block/pre'         => true,
                'typography'        => true,
                'longwords'         => true,
            ]),

            'default' => array_merge($off, [
                'phrase/strong' => true,
                'phrase/em'     => true,
                'phrase/code'   => true,
                'link'          => true,
                'link/url'      => true,
                'link/email'    => true,
                'typography'    => true,
                'longwords'     => true,
            ]),
        ];
        return $presets[$profile] ?? $presets['default'];
    }
}