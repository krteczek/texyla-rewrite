<?php
declare(strict_types=1);

namespace Texyla;

if (!defined('TEXYLA_ENTRY')) {
    http_response_code(404);
    exit;
}

use Texy\Texy;

/**
 * Bezpečný převod nastavení Texy instance do serializovatelné podoby a zpět.
 *
 * - extract() volá APLIKACE — vytáhne z konkrétní Texy instance jen to,
 *   co apply() umí bezpečně aplikovat.
 * - apply() volá TEXYLA — aplikuje jen to, co projde whitelistem.
 *
 * Whitelist je společný pro oba směry.
 */
final class Config
{
    private const SCALAR_PROPS = [
        'mergeLines'     => 'bool',
        'obfuscateEmail' => 'bool',
    ];

    private const MODULE_PROPS = [
        'headingModule' => ['top' => 'int'],
        'imageModule'   => ['width' => 'scalar', 'height' => 'scalar', 'whMax' => 'scalar'],
        'linkModule'    => ['root' => 'string', 'host' => 'string'],
        'tableModule'   => ['evenOddColumns' => 'bool', 'evenOddRows' => 'bool'],
    ];

    public static function extract(Texy $texy): array
    {
        $config = [];

        if (isset($texy->allowed) && is_array($texy->allowed)) {
            $known = self::knownTexyKeys($texy);
            $config['allowed'] = [];
            foreach ($texy->allowed as $key => $value) {
                if (is_string($key) && in_array($key, $known, true) && is_bool($value)) {
                    $config['allowed'][$key] = $value;
                }
            }
        }

        foreach (self::SCALAR_PROPS as $prop => $type) {
            if (isset($texy->$prop) && self::matchesType($texy->$prop, $type)) {
                $config[$prop] = $texy->$prop;
            }
        }

        foreach (self::MODULE_PROPS as $module => $props) {
            if (!isset($texy->$module)) {
                continue;
            }
            foreach ($props as $prop => $type) {
                if (isset($texy->$module->$prop) && self::matchesType($texy->$module->$prop, $type)) {
                    $config[$module][$prop] = $texy->$module->$prop;
                }
            }
        }

        return $config;
    }

    public static function apply(Texy $texy, array $config): void
    {
        if (isset($config['allowed']) && is_array($config['allowed'])) {
            $known = self::knownTexyKeys($texy);
            foreach ($config['allowed'] as $key => $value) {
                if (is_string($key) && in_array($key, $known, true) && is_bool($value)) {
                    $texy->allowed[$key] = $value;
                }
            }
        }

        foreach (self::SCALAR_PROPS as $prop => $type) {
            if (isset($config[$prop]) && self::matchesType($config[$prop], $type)) {
                $texy->$prop = $config[$prop];
            }
        }

        foreach (self::MODULE_PROPS as $module => $props) {
            if (!isset($config[$module]) || !is_array($config[$module])) {
                continue;
            }
            if (!isset($texy->$module)) {
                continue;
            }
            foreach ($props as $prop => $type) {
                if (isset($config[$module][$prop]) && self::matchesType($config[$module][$prop], $type)) {
                    $texy->$module->$prop = $config[$module][$prop];
                }
            }
        }
    }

    public static function toJson(array $config): string
    {
        $json = json_encode(
            $config,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
        );
        return $json === false ? '{}' : $json;
    }

    private static function knownTexyKeys(Texy $texy): array
    {
        return array_keys($texy->allowed);
    }

    private static function matchesType(mixed $value, string $type): bool
    {
        return match ($type) {
            'bool'   => is_bool($value),
            'int'    => is_int($value),
            'string' => is_string($value),
            'scalar' => is_scalar($value),
            default  => false,
        };
    }
}