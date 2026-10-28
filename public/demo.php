<?php
declare(strict_types=1);
?><!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="utf-8">
    <title>Texyla – demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
    <h1>Texyla demo</h1>

    <textarea
        id="editor"
        class="texyla"
        data-profile="admin"
        data-theme="default"
        data-endpoint="/texyla/texyla.php"
        rows="12"
        cols="80"
        placeholder="Napiš Texy! syntax…"
    >**Ahoj** světe.

Toto je *demo* editoru.</textarea>

    <!-- JS si podle data-theme / data-endpoint načte CSS a sám se inicializuje -->
    <script src="/texyla/texyla.js"></script>
</body>
</html>