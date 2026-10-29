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
    // výchozí „vypni vše rizikové / blokové“, pak profil něco zapne
    $off = [
        'phrase/strong'       => true,
        'phrase/em'           => true,
        'phrase/code'         => true,
        'phrase/sup'          => false,
        'phrase/sub'          => false,
        'link'                => true,
        'link/url'            => true,
        'link/email'          => true,
        'image'               => false,
        'figure'              => false,
        'heading/surrounded'  => false,
        'heading/underlined'  => false,
        'blockquote'          => false,
        'list'                => false,
        'list/definition'     => false,
        'table'               => false,
        'horizline'           => false,
        'block/code'          => false,
        'block/default'       => false,
        'block/pre'           => false,
        'html/tag'            => false,
        'html/comment'        => false,
    ];

    $presets = [
        'admin' => array_merge($off, [
            'phrase/sup'         => true,
            'phrase/sub'         => true,
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
        ]),

        'forum' => array_merge($off, [
            'blockquote' => true,
            'list'       => true,
        ]),

        'codeforum' => array_merge($off, [
            'blockquote'  => true,
            'list'        => true,
            'block/code'  => true,
            'block/pre'   => true,
        ]),

        'default' => $off, // jen strong/em/code + linky
    ];

    return $presets[$profile] ?? $presets['default'];
}
}