<?php
declare(strict_types=1);

namespace Texyla;

use Texy\Texy;

/**
 * Převod nastavení Texy instance do serializovatelné podoby a zpět.
 *
 * - extract() volá APLIKACE, která má konkrétní Texy instanci
 *   (např. pro články, komentáře, fórum) a chce její nastavení předat Texyle.
 * - apply() volá TEXYLA v endpointu (texyla.php) na slepou instanci Texy,
 *   aby náhled odpovídal tomu, co aplikace vyrenderuje.
 *
 * Apply() validuje vstup — klientovi se nedůvěřuje.
 */
final class Config
{
    /**
     * Klíče, které umíme přenášet. Ostatní se ignorují.
     * Musí odpovídat tomu, co umí apply().
     */
    private const ALLOWED_KEYS = [
        'allowed',
        'headingModule',
        'mergeLines',
        'obfuscateEmail',
        'imageModule',
        'linkModule',
        'tableModule',
        'emoticonModule',
        'typographyModule',
        'longWordsModule',
    ];

    /**
     * Vytáhne nastavení z existující Texy instance.
     * Určeno pro APLIKACI — ta rozhoduje, kterou instanci předá.
     *
     * @return array<string, mixed> serializovatelné nastavení
     */
    public static function extract(Texy $texy): array
    {
        $config = [];

        // allowed — pole boolů (52 klíčů v Texy 3.x)
        if (isset($texy->allowed) && is_array($texy->allowed)) {
            $config['allowed'] = [];
            foreach ($texy->allowed as $key => $value) {
                if (is_string($key) && is_bool($value)) {
                    $config['allowed'][$key] = $value;
                }
            }
        }

        // skalární vlastnosti
        if (isset($texy->mergeLines)) {
            $config['mergeLines'] = (bool) $texy->mergeLines;
        }
        if (isset($texy->obfuscateEmail)) {
            $config['obfuscateEmail'] = (bool) $texy->obfuscateEmail;
        }

        // headingModule->top
        if (isset($texy->headingModule->top)) {
            $config['headingModule'] = ['top' => (int) $texy->headingModule->top];
        }

        // imageModule — jen skalární a bezpečné položky
        if (isset($texy->imageModule)) {
            $img = [];
            foreach (['width', 'height', 'whMax'] as $prop) {
                if (isset($texy->imageModule->$prop)) {
                    $img[$prop] = $texy->imageModule->$prop;
                }
            }
            if ($img) {
                $config['imageModule'] = $img;
            }
        }

        // linkModule — jen skalární
        if (isset($texy->linkModule)) {
            $link = [];
            foreach (['root', 'host'] as $prop) {
                if (isset($texy->linkModule->$prop)) {
                    $link[$prop] = (string) $texy->linkModule->$prop;
                }
            }
            if ($link) {
                $config['linkModule'] = $link;
            }
        }

        // tableModule — jen skalární
        if (isset($texy->tableModule)) {
            $table = [];
            foreach (['evenOddColumns', 'evenOddRows'] as $prop) {
                if (isset($texy->tableModule->$prop)) {
                    $table[$prop] = (bool) $texy->tableModule->$prop;
                }
            }
            if ($table) {
                $config['tableModule'] = $table;
            }
        }

        return $config;
    }

    /**
     * Aplikuje předané nastavení na slepou instanci Texy.
     * Volá TEXYLA v endpointu. Vstup validuje — klientovi se nedůvěřuje.
     *
     * @param array<string, mixed> $config
     */
    public static function apply(Texy $texy, array $config): void
    {
        // 1. allowed — jen známé klíče a jen bool
        if (isset($config['allowed']) && is_array($config['allowed'])) {
            $known = self::knownTexyKeys($texy);
            foreach ($config['allowed'] as $key => $value) {
                if (!is_string($key) || !in_array($key, $known, true)) {
                    continue; // neznámý klíč — ignorovat
                }
                if (!is_bool($value)) {
                    continue; // špatný typ — ignorovat
                }
                $texy->allowed[$key] = $value;
            }
        }

        // 2. headingModule->top — int v rozumném rozsahu
        if (isset($config['headingModule']['top'])) {
            $top = $config['headingModule']['top'];
            if (is_int($top) || (is_string($top) && ctype_digit($top))) {
                $top = (int) $top;
                if ($top >= 1 && $top <= 6) {
                    $texy->headingModule->top = $top;
                }
            }
        }

        // 3. skalární booly
        foreach (['mergeLines', 'obfuscateEmail'] as $prop) {
            if (isset($config[$prop]) && is_bool($config[$prop])) {
                $texy->$prop = $config[$prop];
            }
        }

        // 4. imageModule — jen whitelistované skalární položky
        if (isset($config['imageModule']) && is_array($config['imageModule'])) {
            foreach (['width', 'height', 'whMax'] as $prop) {
                if (isset($config['imageModule'][$prop])
                    && (is_int($config['imageModule'][$prop]) || is_string($config['imageModule'][$prop]))
                ) {
                    $texy->imageModule->$prop = $config['imageModule'][$prop];
                }
            }
        }

        // 5. linkModule — jen whitelistované stringy
        if (isset($config['linkModule']) && is_array($config['linkModule'])) {
            foreach (['root', 'host'] as $prop) {
                if (isset($config['linkModule'][$prop]) && is_string($config['linkModule'][$prop])) {
                    $texy->linkModule->$prop = $config['linkModule'][$prop];
                }
            }
        }

        // 6. tableModule — jen booly
        if (isset($config['tableModule']) && is_array($config['tableModule'])) {
            foreach (['evenOddColumns', 'evenOddRows'] as $prop) {
                if (isset($config['tableModule'][$prop]) && is_bool($config['tableModule'][$prop])) {
                    $texy->tableModule->$prop = $config['tableModule'][$prop];
                }
            }
        }
    }

    /**
     * Vrátí seznam klíčů, které Texy 3.x skutečně zná.
     *
     * @return list<string>
     */
    private static function knownTexyKeys(Texy $texy): array
    {
        return array_keys($texy->allowed);
    }

    /**
     * Pomocná metoda pro aplikaci: převede config na JSON pro data-* atribut.
     */
    public static function toJson(array $config): string
    {
        return json_encode(
            $config,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
        ) ?: '{}';
    }
}