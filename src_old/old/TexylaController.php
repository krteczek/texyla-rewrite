<?php
/**
 * Project: Texyla Rewrite Dream Team
 * File: /texyla-rewrite/src/TexylaController.php
 * Description: AJAX endpoint pro generování náhledu Texy! syntaxe
 * 
 * @package Texyla
 * @author Dream Team (Petr & Bó)
 * @license MIT
 */

declare(strict_types=1);

namespace Texyla;

require_once __DIR__ . '/../vendor/autoload.php';

// Nastavení hlaviček pro JSON API
header('Content-Type: text/html; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/**
 * AJAX controller pro zpracování Texy! syntaxe a vrácení HTML náhledu
 * 
 * Endpoint přijímá POST požadavky s JSON tělem obsahujícím:
 * - texy_source: Texy! syntaxe ke zpracování
 * - context: Kontext zpracování ('admin', 'forum', 'default')
 * 
 * @return void Vypíše HTML nebo chybovou hlášku
 */
function handleTexylaPreview(): void
{
    // Kontrola HTTP metody
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405); // Method Not Allowed
        echo '<p class="texyla-error">Chyba: Pouze POST metoda je povolena.</p>';
        exit;
    }
    
    // Získání a validace vstupních dat
    [$texySource, $context] = getAndValidateInput();
    
    if (empty($texySource)) {
        echo '';
        exit;
    }
    
    try {
        // Získání Texy! instance pro daný kontext
        [$texyObject, ] = TexylaConfigFactory::getContextSetup($context);
        
        // Procesování Texy! syntaxe na HTML
        $htmlOutput = $texyObject->process($texySource);
        
        // Výstup výsledku
        echo $htmlOutput;
        
    } catch (\Exception $e) {
        handleProcessingError($e);
    }
}

/**
 * Získá a validuje vstupní data z požadavku
 * 
 * @return array [string $texySource, string $context]
 */
function getAndValidateInput(): array
{
    $input = file_get_contents('php://input');
    
    if ($input === false || $input === '') {
        return ['', 'default'];
    }
    
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400); // Bad Request
        echo '<p class="texyla-error">Chyba: Neplatný JSON formát.</p>';
        exit;
    }
    
    $texySource = $data['texy_source'] ?? '';
    $context = $data['context'] ?? 'default';
    
    // Základní sanitizace kontextu
    $allowedContexts = ['admin', 'forum', 'default'];
    $context = in_array($context, $allowedContexts, true) ? $context : 'default';
    
    return [$texySource, $context];
}

/**
 * Zpracuje chybu při generování náhledu
 * 
 * @param \Exception $e Zachycená výjimka
 */
function handleProcessingError(\Exception $e): void
{
    http_response_code(500); // Internal Server Error
    
    // Logování chyby (v produkci bychom použili logger)
    error_log(sprintf(
        'Texy! chyba v controlleru: %s v %s:%d',
        $e->getMessage(),
        $e->getFile(),
        $e->getLine()
    ));
    
    // User-friendly chybová hláška
    echo '<div class="texyla-error">';
    echo '<p>❌ Chyba při generování náhledu</p>';
    
    if (defined('APP_ENV') && APP_ENV === 'development') {
        echo '<small>' . htmlspecialchars($e->getMessage()) . '</small>';
    } else {
        echo '<small>Zkuste to prosím znovu za chvíli.</small>';
    }
    
    echo '</div>';
}

// Spuštění hlavní funkce
handleTexylaPreview();