<?php
//  /src/TexylaToolbarGenerator.php
/**
 * Texyla Toolbar Generator
 * 
 * Generates toolbar configuration from an existing Texy! instance.
 * Automatically maps Texy! modules to toolbar buttons.
 * 
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @copyright (c) 2024
 * @license MIT
 */

declare(strict_types=1);

namespace Texyla;

class TexylaToolbarGenerator
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
     * This is the main method for generating toolbar configuration.
     * It analyzes the Texy! instance's allowed modules and creates
     * corresponding toolbar buttons.
     * 
     * @param \Texy\Texy $texy Texy! instance to analyze
     * @param array $options Generation options:
     *                      - 'exclude_groups' (string[]): Groups to exclude
     *                      - 'only_groups' (string[]|null): Only include these groups
     *                      - 'show_hidden' (bool): Show hidden buttons (default: false)
     *                      - 'show_auto' (bool): Show automatic features (default: false)
     * @return string JSON configuration for Texyla toolbar
     * 
     * @example
     * $json = TexylaToolbarGenerator::fromTexy($texy);
     * // <textarea data-config='<?= $json ?>'>
     */
    public static function fromTexy(\Texy\Texy $texy, array $options = []): string
    {
        $buttons = self::generateButtons($texy, $options);
        return self::encodeJson($buttons);
    }
    
    /**
     * Generate button array from Texy! instance
     * 
     * Returns the raw button array instead of JSON. Useful for
     * further processing or filtering.
     * 
     * @param \Texy\Texy $texy Texy! instance to analyze
     * @param array $options Generation options
     * @return array Button configurations
     * 
     * @see fromTexy()
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
            // Skip disabled modules
            if (!$enabled) {
                continue;
            }
            
            // Find button configuration for this module
            $button = self::findButtonForModule($module);
            if (!$button) {
                // Unknown module, skip it
                continue;
            }
            
            // Apply filters
            if (!self::passesFilters($button, $excludedGroups, $onlyGroups, $showHidden, $showAuto)) {
                continue;
            }
            
            // Clean up internal properties before returning
            $cleanButton = self::cleanButtonConfig($button);
            $buttons[] = $cleanButton;
        }
        
        // Sort by priority (higher priority = first)
        usort($buttons, function(array $a, array $b): int {
            $priorityA = $a['_priority'] ?? 0;
            $priorityB = $b['_priority'] ?? 0;
            return $priorityB <=> $priorityA;
        });
        
        // Remove temporary priority property
        foreach ($buttons as &$button) {
            unset($button['_priority']);
        }
        
        return $buttons;
    }
    
    /**
     * Add custom button mapping
     * 
     * Allows users to add or override button mappings for custom
     * or non-standard Texy! modules.
     * 
     * @param array<string, array> $mapping Module name => button config
     * @return void
     * 
     * @example
     * TexylaToolbarGenerator::addMapping([
     *     'custom/bold' => ['label' => 'B', 'marker' => '**']
     * ]);
     */
    public static function addMapping(array $mapping): void
    {
        self::$customMap = array_merge(self::$customMap, $mapping);
    }
    
    /**
     * Load custom mapping from configuration file
     * 
     * The configuration file should return an array with button mappings.
     * 
     * @param string $configFile Path to configuration file
     * @return bool True if file was loaded successfully
     * 
     * @example
     * TexylaToolbarGenerator::loadMapping('/config/texyla-buttons.php');
     */
    public static function loadMapping(string $configFile): bool
    {
        if (!file_exists($configFile)) {
            error_log("Texyla: Custom mapping file not found: {$configFile}");
            return false;
        }
        
        try {
            $config = require $configFile;
            
            if (!is_array($config)) {
                error_log("Texyla: Custom mapping file must return an array");
                return false;
            }
            
            self::addMapping($config);
            return true;
            
        } catch (\Exception $e) {
            error_log("Texyla: Error loading custom mapping: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Clear all custom mappings
     * 
     * Useful for testing or resetting to defaults.
     * 
     * @return void
     */
    public static function clearMappings(): void
    {
        self::$customMap = [];
    }
    
    /**
     * Get currently loaded custom mappings
     * 
     * @return array<string, array> Current custom mappings
     */
    public static function getCustomMappings(): array
    {
        return self::$customMap;
    }
    
    /* ======================================================================
       INTERNAL METHODS
       ====================================================================== */
    
    /**
     * Load default button mapping from configuration file
     * 
     * @return void
     */
    private static function loadDefaultMap(): void
    {
        if (self::$defaultMapLoaded) {
            return;
        }
        
        $configFile = __DIR__ . '/config/default-buttons.php';
        
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
     * @return array|null Button configuration or null if not found
     */
    private static function findButtonForModule(string $module): ?array
    {
        // 1. Check custom mappings first (user overrides)
        if (isset(self::$customMap[$module])) {
            return self::$customMap[$module];
        }
        
        // 2. Check default mappings
        if (isset(self::$defaultMap[$module])) {
            return self::$defaultMap[$module];
        }
        
        // 3. Module not found in any mapping
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
     * @return bool True if button passes all filters
     */
    private static function passesFilters(
        array $button,
        array $excludedGroups,
        ?array $onlyGroups,
        bool $showHidden,
        bool $showAuto
    ): bool {
        $group = $button['group'] ?? 'unknown';
        
        // Skip hidden buttons unless explicitly requested
        if (!empty($button['hidden']) && !$showHidden) {
            return false;
        }
        
        // Skip auto features unless explicitly requested
        if (!empty($button['auto']) && !$showAuto) {
            return false;
        }
        
        // Skip if no marker (automatic features without buttons)
        if (empty($button['marker'])) {
            return false;
        }
        
        // Excluded groups filter
        if (!empty($excludedGroups) && in_array($group, $excludedGroups, true)) {
            return false;
        }
        
        // Only groups filter
        if ($onlyGroups !== null && !in_array($group, $onlyGroups, true)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Clean button configuration for output
     * 
     * Removes internal properties and prepares button for JSON output.
     * 
     * @param array $button Raw button configuration
     * @return array Cleaned button configuration
     */
    private static function cleanButtonConfig(array $button): array
    {
        $clean = [
            'label' => $button['label'] ?? '',
            'marker' => $button['marker'] ?? '',
        ];
        
        // Optional properties
        if (!empty($button['title'])) {
            $clean['title'] = $button['title'];
        }
        
        if (!empty($button['class'])) {
            $clean['class'] = $button['class'];
        }
        
        if (!empty($button['dialog'])) {
            $clean['dialog'] = $button['dialog'];
        }
        
        // Keep priority for sorting (removed later)
        if (isset($button['priority'])) {
            $clean['_priority'] = $button['priority'];
        }
        
        return $clean;
    }
    
    /**
     * Encode button array to JSON
     * 
     * @param array $buttons Button configurations
     * @return string JSON string
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