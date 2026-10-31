<?php
declare(strict_types=1);


/**
 * Ukázková nastavení pro demo.
 * V reálné aplikaci by tato nastavení pocházela z aplikace samotné
 * (z Texy instance, kterou aplikace používá pro zobrazení).
 */
return [
    'admin' => [
        'allowed' => [
            'phrase/strong' => true,
            'phrase/em'     => true,
            'phrase/code'   => true,
            'phrase/sup'    => true,
            'phrase/sub'    => true,
            'link'          => true,
            'link/url'      => true,
            'link/email'    => true,
            'image'         => true,
            'figure'        => true,
            'heading/surrounded' => true,
            'heading/underlined' => true,
            'blockquote'    => true,
            'list'          => true,
            'list/definition' => true,
            'table'         => true,
            'horizline'     => true,
            'block/code'    => true,
            'block/pre'     => true,
        ],
        'headingModule' => ['top' => 3],
        'mergeLines' => true,
        'obfuscateEmail' => true,
    ],
    'forum' => [
        'allowed' => [
            'phrase/strong' => true,
            'phrase/em'     => true,
            'phrase/code'   => true,
            'link'          => true,
            'link/url'      => true,
            'link/email'    => true,
            'blockquote'    => true,
            'list'          => true,
        ],
        'headingModule' => ['top' => 3],
        'mergeLines' => true,
        'obfuscateEmail' => true,
    ],
    'default' => [
        'allowed' => [
            'phrase/strong' => true,
            'phrase/em'     => true,
            'phrase/code'   => true,
            'link'          => true,
            'link/url'      => true,
            'link/email'    => true,
        ],
        'headingModule' => ['top' => 3],
        'mergeLines' => true,
        'obfuscateEmail' => true,
    ],
];
