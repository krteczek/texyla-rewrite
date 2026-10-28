<?php
/**
 * Texyla Toolbar Generator
 *
 * Generates toolbar configuration from an existing Texy! instance.
 * Automatically maps Texy! modules to toolbar buttons.
 *
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @license MIT
 */

declare(strict_types=1);

namespace Texyla\Toolbar;

class ToolbarGenerator
{
    /**
     * Default button mapping (lazy-loaded from config file)
     * @var array<string, array>|null
     */
    private static ?array $defaultMap = null;

    /**
     * Custom button mapping provided by user
     * @var array<string, array>
     */
    private static array $customMap = [];

    /**
     * Whether default map has been loaded
     * @var bool
     */
    private static bool $defaultMapLoaded = false;

    /* ======================================================================
       PUBLIC API
       ====================================================================== */

    /**
     * Generate toolbar JSON configuration from Texy! instance
     *
     * @param \Texy\Texy $texy Texy! instance to analyze
     * @param array $options Generation options:
     *                      - 'exclude_groups' (string[]): Groups to exclude
     *                      - 'only_groups' (string[]|null): Only include these groups
     *                      - 'show_hidden' (bool): Show hidden buttons (default: false)
     *                      - 'show_auto' (bool): Show automatic features (default: false)
     * @return string JSON configuration for Texyla toolbar
     */
    public static function fromTexy(\Texy\Texy $texy, array $options = []): string
    {
        $buttons = self::generateButtons($texy, $options);
        return self::encodeJson($buttons);
    }

    /**
     * Generate button array from Texy! instance
     *
     * @param \Texy\Texy $texy Texy! instance to analyze
     * @param array $options Generation options
     * @return array Button configurations
     */
    public static function generateButtons(\Texy\Texy $texy, array $options = []): array
    {
        self::loadDefaultMap();

        $excludedGroups = $options['exclude_groups'] ?? [];
        $onlyGroups = $options['only_groups'] ?? null;
        $showHidden = $options['show_hidden'] ?? false;
        $showAuto = $options['show_auto'] ?? false;

        $buttons = [];

        foreach ($texy->allowed as $module => $enabled) {
            if (!$enabled) {
                continue;
            }
/* ======================================================================
       INTERNAL METHODS
       ====================================================================== */

    /**
     * Load default button mapping from configuration file
     */
    private static function loadDefaultMap(): void
    {
        if (self::$defaultMapLoaded) {
            return;
        }

        $configFile = __DIR__ . '/../Config/buttons.php';

        if (!file_exists($configFile)) {
            throw new \RuntimeException("Default button configuration not found: {$configFile}");
        }

        self::$defaultMap = require $configFile;
        self::$defaultMapLoaded = true;
    }

    /**
     * Find button configuration for a module
     *
     * Search order:
     * 1. Custom mappings (user-defined)
     * 2. Default mappings (built-in)
     * 3. Return null if not found
     *
     * @param string $module Texy! module name
     * @return array|null
     */
    private static function findButtonForModule(string $module): ?array
    {
        if (isset(self::$customMap[$module])) {
            return self::$customMap[$module];
        }

        if (isset(self::$defaultMap[$module])) {
            return self::$defaultMap[$module];
        }

        return null;
    }

    /**
     * Check if button passes all filters
     *
     * @param array $button Button configuration
     * @param array $excludedGroups Groups to exclude
     * @param array|null $onlyGroups Only include these groups (null = all)
     * @param bool $showHidden Show hidden buttons
     * @param bool $showAuto Show automatic features
     * @return bool
     */
    private static function passesFilters(
        array $button,
        array $excludedGroups,
        ?array $onlyGroups,
        bool $showHidden,
        bool $showAuto
    ): bool {
        $group = $button['group'] ?? 'unknown';

        if (!empty($button['hidden']) && !$showHidden) {
            return false;
        }

        if (!empty($button['auto']) && !$showAuto) {
            return false;
        }

        if (empty($button['marker'])) {
            return false;
        }

        if (!empty($excludedGroups) && in_array($group, $excludedGroups, true)) {
            return false;
        }

        if ($onlyGroups !== null && !in_array($group, $onlyGroups, true)) {
            return false;
        }

        return true;
    }

    /**
     * Clean button configuration for output
     *
     * @param array $button Raw button configuration
     * @return array
     */
    private static function cleanButtonConfig(array $button): array
    {
        $clean = [
            'label' => $button['label'] ?? '',
            'marker' => $button['marker'] ?? '',
        ];

        if (!empty($button['title'])) {
            $clean['title'] = $button['title'];
        }

        if (!empty($button['class'])) {
            $clean['class'] = $button['class'];
        }

        if (!empty($button['dialog'])) {
            $clean['dialog'] = $button['dialog'];
        }

        if (isset($button['priority'])) {
            $clean['_priority'] = $button['priority'];
        }

        return $clean;
    }

    /**
     * Encode button array to JSON
     *
     * @param array $buttons Button configurations
     * @return string
     */
    private static function encodeJson(array $buttons): string
    {
        $json = json_encode(
            $buttons,
            JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE
        );

        return $json !== false ? $json : '[]';
    }
}