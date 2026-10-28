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