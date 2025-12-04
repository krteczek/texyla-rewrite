// test-texy-api.php
require_once 'vendor/autoload.php';

$texy = new \Texy\Texy();
echo "Texy! version: " . \Texy\Texy::VERSION . "\n";
echo "Methods available: \n";
echo "- headingModule->top: " . ($texy->headingModule->top ?? 'N/A') . "\n";
echo "- has mergeLines: " . (isset($texy->mergeLines) ? 'Yes' : 'No') . "\n";
echo "- has allowed array: " . (isset($texy->allowed) ? 'Yes' : 'No') . "\n";

// Test procesování
$result = $texy->process("**Test**");
echo "Test output: " . $result . "\n";