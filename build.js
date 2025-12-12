// build.js - ESBuild konfigurace
const esbuild = require('esbuild');

// Development build (moduly)
esbuild.build({
    entryPoints: ['src/texyla-bundle.js'],
    bundle: true,
    outfile: 'assets/js/texyla.dev.js',
    format: 'esm',
    sourcemap: true,
    minify: false
});

// Production build (jediný soubor)
esbuild.build({
    entryPoints: ['src/texyla-bundle.js'],
    bundle: true,
    outfile: 'assets/js/texyla.min.js',
    format: 'iife',
    globalName: 'Texyla',
    minify: true,
    treeShaking: true
});