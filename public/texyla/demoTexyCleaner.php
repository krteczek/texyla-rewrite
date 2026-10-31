<?php
declare(strict_types=1);

/** 
 * nastavení pro Texy instanci. co se zde povolí, to bude texy 
 * na druhé straně zpracovávat 
 * tohle je nastavení čistě pro Demo! aby šlo vidět, jak se má chovat texyla
 * Demo nemá ovlivněnou instanci, musíme ji nastavit sami
 * */
return [
        'allowed' => [
                // --- phrase ---
                'phrase/strong'          => false,
                'phrase/strong+em'       => false,
                'phrase/em'              => false,
                'phrase/em-alt'          => false,
                'phrase/em-alt2'         => false,
                'phrase/ins'             => false,
                'phrase/del'             => false,
                'phrase/sup'             => false,
                'phrase/sup-alt'         => false,
                'phrase/sub'             => false,
                'phrase/sub-alt'         => false,
                'phrase/span'            => false,
                'phrase/span-alt'        => false,
                'phrase/quote'           => false,
                'phrase/acronym'         => false,
                'phrase/acronym-alt'     => false,
                'phrase/notexy'          => false,
                'phrase/code'            => false,
                'phrase/quicklink'       => false,
                'phrase/wikilink'        => false,
                'phrase/markdown'        => false,
                'phrase/escaped-asterix' => false,

                // --- odkazy ---
                'link'                   => false,
                'link/definition'        => false,
                'link/reference'         => false,
                'link/url'               => false,
                'link/email'             => false,

                // --- obrázky ---
                'image'                  => false,
                'image/definition'       => false,
                'figure'                 => false,

                // --- bloky ---
                'block/default'          => false,
                'block/pre'              => false,
                'block/code'             => false,
                'block/html'             => false,
                'block/text'             => false,
                'block/texysource'       => false,
                'block/comment'          => false,
                'block/div'              => false,
                'blocks'                 => false,
                'horizline'              => false,
                'blockquote'             => false,
                'table'                  => false,

                // --- nadpisy ---
                'heading/underlined'     => false,
                'heading/surrounded'     => false,

                // --- seznamy ---
                'list'                   => false,
                'list/definition'        => false,

                // --- ostatní ---
                'script'                 => false,
                'html/tag'               => false,
                'html/comment'           => false,
                'emoticon'               => false,
                'typography'             => false,
                'longwords'              => false,
        ],

        'headingModule' => ['top' => 3],
        'mergeLines' => true,
        'obfuscateEmail' => true,
];
