// build.js - Kompletní build systém pro Texylu

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const { execSync } = require('child_process');

// Konfigurace
const CONFIG = {
  // Cesty
  sourceDir: path.join(__dirname, 'src'),
  assetsDir: path.join(__dirname, 'assets'),
  cssSourceDir: path.join(__dirname, 'assets', 'css'),
  jsOutputDir: path.join(__dirname, 'assets', 'js'),
  
  // Verze
  version: '1.0.0',
  
  // License
  license: `/*!
 * Texyla Rewrite v${new Date().getFullYear()}
 * Moderní WYSIWYM editor pro Texy! syntax
 * MIT License - https://github.com/your-repo/texyla-rewrite
 * Dream Team (Petr & Bó)
 */\n`,
};

/**
 * Hlavní build funkce
 */
async function build() {
  console.log('🚀 Building Texyla...');
  
  try {
    // 1. Vytvořit výstupní složky
    ensureDirectories();
    
    // 2. Sestavit JavaScript (Development)
    await buildJavaScript('development');
    
    // 3. Sestavit JavaScript (Production)
    await buildJavaScript('production');
    
    // 4. Sestavit CSS (Development)
    await buildCSS('development');
    
    // 5. Sestavit CSS (Production)
    await buildCSS('production');
    
    // 6. Vytvořit bundled soubor (IIFE pro jednoduché použití)
    await createBundle();
    
    // 7. Vytvořit minifikovanou verzi
    await createMinified();
    
    // 8. Vytvořit soubor s metadaty
    createMetadata();
    
    // 9. Zkopírovat demo assets
    copyDemoAssets();
    
    console.log('✅ Build dokončen!');
    console.log('📁 Výstup:');
    console.log(`  - ${path.join(CONFIG.jsOutputDir, 'texyla.js')} (${getFileSize('texyla.js')})`);
    console.log(`  - ${path.join(CONFIG.jsOutputDir, 'texyla.min.js')} (${getFileSize('texyla.min.js')})`);
    console.log(`  - ${path.join(CONFIG.assetsDir, 'css', 'texyla.css')} (${getFileSize('texyla.css', 'css')})`);
    console.log(`  - ${path.join(CONFIG.assetsDir, 'css', 'texyla.min.css')} (${getFileSize('texyla.min.css', 'css')})`);
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

/**
 * Vytvoří potřebné složky
 */
function ensureDirectories() {
  const dirs = [
    CONFIG.jsOutputDir,
    path.join(CONFIG.assetsDir, 'css'),
    path.join(__dirname, 'dist')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Sestaví JavaScript soubory
 * @param {string} mode - 'development' nebo 'production'
 */
async function buildJavaScript(mode) {
  const isProd = mode === 'production';
  const outputFile = isProd 
    ? path.join(CONFIG.jsOutputDir, 'texyla.min.js')
    : path.join(CONFIG.jsOutputDir, 'texyla.js');
  
  console.log(`🔨 Building JavaScript (${mode})...`);
  
  try {
    const result = await esbuild.build({
      // Entry point
      entryPoints: [path.join(CONFIG.sourceDir, 'texyla-bundle.js')],
      
      // Výstup
      bundle: true,
      outfile: outputFile,
      format: 'iife',
      globalName: 'Texyla',
      
      // Minifikace a optimalizace
      minify: isProd,
      treeShaking: true,
      sourcemap: !isProd,
      
      // Target browsers
      target: ['chrome58', 'firefox57', 'safari11', 'edge18'],
      
      // Define konstanty
      define: {
        'TEXYLA_VERSION': `"${CONFIG.version}"`,
        'TEXYLA_ENV': `"${mode}"`,
        'TEXYLA_BUILD_DATE': `"${new Date().toISOString()}"`,
        'process.env.NODE_ENV': `"${mode}"`
      },
      
      // Logging
      logLevel: isProd ? 'warning' : 'info',
      
      // Metadaty
      banner: {
        js: CONFIG.license + (isProd ? '' : '/* Development build */\n')
      }
    });
    
    console.log(`✅ JavaScript ${mode} built: ${outputFile}`);
    
  } catch (error) {
    console.error(`❌ JavaScript ${mode} build failed:`, error);
    throw error;
  }
}

/**
 * Sestaví CSS soubory
 * @param {string} mode - 'development' nebo 'production'
 */
async function buildCSS(mode) {
  const isProd = mode === 'production';
  const outputFile = isProd
    ? path.join(CONFIG.assetsDir, 'css', 'texyla.min.css')
    : path.join(CONFIG.assetsDir, 'css', 'texyla.css');
  
  console.log(`🎨 Building CSS (${mode})...`);
  
  try {
    // Načíst všechny CSS soubory
    const cssFiles = [
      'texyla.core.css',
      'texyla.toolbar.css',
      'texyla.preview.css',
      'texyla.dialogs.css',
      'texyla.errors.css'
    ];
    
    let combinedCSS = CONFIG.license;
    if (!isProd) {
      combinedCSS += `/* Development build - ${new Date().toISOString()} */\n\n`;
    }
    
    // Kombinovat a minifikovat
    for (const file of cssFiles) {
      const filePath = path.join(CONFIG.cssSourceDir, file);
      if (fs.existsSync(filePath)) {
        let cssContent = fs.readFileSync(filePath, 'utf8');
        
        // Přidat komentář o souboru (jen v dev)
        if (!isProd) {
          combinedCSS += `/* === ${file} === */\n`;
        }
        
        // Základní minifikace pro produkci
        if (isProd) {
          cssContent = cssContent
            .replace(/\/\*[\s\S]*?\*\//g, '') // Odstranit komentáře
            .replace(/\s+/g, ' ')             // Odstranit přebytečné mezery
            .replace(/;\s*/g, ';')            // Odstranit mezery za středníky
            .replace(/:\s+/g, ':')            // Odstranit mezery za dvojtečkami
            .replace(/\s*{\s*/g, '{')         // Odstranit mezery kolem {
            .replace(/\s*}\s*/g, '}')         // Odstranit mezery kolem }
            .replace(/,\s+/g, ',')            // Odstranit mezery za čárkami
            .trim();
        }
        
        combinedCSS += cssContent + '\n\n';
        
        if (!isProd) {
          combinedCSS += '\n';
        }
      } else {
        console.warn(`⚠️  CSS file not found: ${file}`);
      }
    }
    
    // Uložit
    fs.writeFileSync(outputFile, combinedCSS, 'utf8');
    
    console.log(`✅ CSS ${mode} built: ${outputFile}`);
    
  } catch (error) {
    console.error(`❌ CSS ${mode} build failed:`, error);
    throw error;
  }
}

/**
 * Vytvoří bundled verzi s externími závislostmi
 */
async function createBundle() {
  console.log('📦 Creating standalone bundle...');
  
  try {
    // Načíst core JS
    const coreJS = fs.readFileSync(
      path.join(CONFIG.jsOutputDir, 'texyla.js'),
      'utf8'
    );
    
    // Vytvořit IIFE wrapper s error handlingem
    const bundle = `(function() {
'use strict';

// Error handling wrapper
try {
${coreJS}
} catch (error) {
  console.error('Texyla initialization failed:', error);
  
  // Fallback - alespoň udělat textarey použitelné
  document.querySelectorAll('.texyla').forEach(function(textarea) {
    textarea.style.display = 'block';
    textarea.readOnly = false;
    
    // Přidat warning
    const warning = document.createElement('div');
    warning.className = 'texyla-error';
    warning.innerHTML = '<p>⚠️ Texyla editor failed to load</p>';
    textarea.parentNode.insertBefore(warning, textarea);
  });
}

// Global API (i když selže init)
if (typeof window.Texyla === 'undefined') {
  window.Texyla = {
    init: function() { console.warn('Texyla not available'); },
    autoInit: function() { console.warn('Texyla not available'); }
  };
}

})();`;
    
    // Uložit
    const outputPath = path.join(CONFIG.jsOutputDir, 'texyla.bundle.js');
    fs.writeFileSync(outputPath, CONFIG.license + bundle, 'utf8');
    
    console.log(`✅ Bundle created: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Bundle creation failed:', error);
  }
}

/**
 * Vytvoří minifikovanou verzi s gzip
 */
async function createMinified() {
  console.log('⚡ Creating minified version...');
  
  try {
    // Minifikovat pomocí ESBuild
    const result = await esbuild.build({
      entryPoints: [path.join(CONFIG.jsOutputDir, 'texyla.js')],
      outfile: path.join(CONFIG.jsOutputDir, 'texyla.min.js'),
      minify: true,
      treeShaking: true,
      banner: { js: CONFIG.license }
    });
    
    // Vytvořit gzip verzi (pokud je nainstalován gzip)
    try {
      const minifiedPath = path.join(CONFIG.jsOutputDir, 'texyla.min.js');
      const gzipPath = path.join(CONFIG.jsOutputDir, 'texyla.min.js.gz');
      
      execSync(`gzip -c ${minifiedPath} > ${gzipPath}`);
      console.log(`✅ Gzip created: ${gzipPath} (${getFileSize('texyla.min.js.gz')})`);
    } catch (gzipError) {
      console.log('ℹ️  Skipping gzip (gzip not available)');
    }
    
  } catch (error) {
    console.error('❌ Minification failed:', error);
  }
}

/**
 * Vytvoří metadata soubor
 */
function createMetadata() {
  console.log('📄 Creating metadata...');
  
  const metadata = {
    name: 'Texyla Rewrite',
    version: CONFIG.version,
    buildDate: new Date().toISOString(),
    files: {
      js: {
        development: 'assets/js/texyla.js',
        production: 'assets/js/texyla.min.js',
        bundle: 'assets/js/texyla.bundle.js'
      },
      css: {
        development: 'assets/css/texyla.css',
        production: 'assets/css/texyla.min.css'
      }
    },
    dependencies: {
      required: ['Texy! PHP library'],
      optional: []
    },
    browserSupport: [
      'Chrome 58+',
      'Firefox 57+',
      'Safari 11+',
      'Edge 18+'
    ]
  };
  
  const metadataPath = path.join(__dirname, 'dist', 'metadata.json');
  fs.writeFileSync(
    metadataPath,
    JSON.stringify(metadata, null, 2),
    'utf8'
  );
  
  console.log(`✅ Metadata created: ${metadataPath}`);
}

/**
 * Zkopíruje demo assets
 */
function copyDemoAssets() {
  console.log('📋 Copying demo assets...');
  
  const demoDir = path.join(__dirname, 'demos');
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }
  
  // Vytvořit demo index.html
  const demoHTML = createDemoHTML();
  fs.writeFileSync(
    path.join(demoDir, 'index.html'),
    demoHTML,
    'utf8'
  );
  
  console.log(`✅ Demo created: ${path.join(demoDir, 'index.html')}`);
}

/**
 * Vytvoří demo HTML stránku
 */
function createDemoHTML() {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Texyla Demo - Dream Team</title>
    
    <!-- Texyla CSS (produkční) -->
    <link rel="stylesheet" href="../assets/css/texyla.min.css">
    
    <!-- Demo styly -->
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; color: #2d3748; background: #f8fafc;
            max-width: 1200px; margin: 0 auto; padding: 2rem 1rem;
        }
        .header { text-align: center; margin-bottom: 3rem; }
        .header h1 { color: #2d3748; margin-bottom: 0.5rem; }
        .header p { color: #718096; }
        .dream-team { 
            display: inline-block; background: #4299e1; color: white;
            padding: 0.5rem 1.5rem; border-radius: 2rem; margin: 1rem 0;
            font-weight: 600;
        }
        .demo-grid { 
            display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;
            margin-bottom: 3rem;
        }
        @media (max-width: 768px) {
            .demo-grid { grid-template-columns: 1fr; }
        }
        .demo-card {
            background: white; border-radius: 1rem; padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .demo-card h2 { margin-bottom: 1rem; color: #2d3748; }
        .features { margin-top: 3rem; }
        .features-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem; margin-top: 1.5rem;
        }
        .feature-card {
            background: white; padding: 1.5rem; border-radius: 0.75rem;
            border-left: 4px solid #4299e1;
        }
        .footer {
            text-align: center; margin-top: 3rem; padding-top: 2rem;
            border-top: 1px solid #e2e8f0; color: #718096;
        }
    </style>
</head>
<body>
    <header class="header">
        <h1>🎯 Texyla Rewrite Demo</h1>
        <p>Moderní WYSIWYM editor pro Texy! syntax</p>
        <div class="dream-team">Petr & Bó Dream Team</div>
    </header>
    
    <div class="demo-grid">
        <!-- Admin Editor -->
        <div class="demo-card">
            <h2>📝 Admin Editor (plný)</h2>
            <p><small>Plná Texy! syntaxe + dialogy</small></p>
            
            <textarea 
                id="editorAdmin"
                class="texyla"
                data-context="admin"
                data-texy-available="true"
                data-auto-preview="true"
                data-debug="true"
                rows="12"
            ># Texyla Demo

## Moderní editor pro Texy!

Toto je **demo** *Texyla* editoru.

### Funkce:
- 🔗 **Odkazy** - [Texy! dokumentace](https://texy.info)
- 🖼️ **Obrázky** - vložte přes dialog
- </> **Kód** - \`inline\` i bloky
- 💬 **Citace** > jako tato
- • **Seznamy** - jako tento

\`\`\`php
// Ukázka kódu
function hello() {
    echo "Hello Texyla!";
}
\`\`\`

**Klávesové zkratky:**
- Ctrl+P - přepnout náhled
- Ctrl+B - tučný text</textarea>
            
            <div style="margin-top: 1rem; font-size: 0.875rem; color: #718096;">
                <strong>Tip:</strong> Vyberte text a použijte tlačítka v toolbaru
            </div>
        </div>
        
        <!-- Forum Editor -->
        <div class="demo-card">
            <h2>💬 Forum Editor (omezený)</h2>
            <p><small>Základní syntaxe pro bezpečnost</small></p>
            
            <textarea 
                id="editorForum"
                class="texyla"
                data-context="forum"
                data-texy-available="true"
                rows="12"
            >**Diskuse o Texyle**

Ahoj, právě testuji *nový editor*.

Můžete používat:
- **Tučné** texty
- *Kurzívu*
- \`Kód\` inline
- [Odkazy](https://example.com)
- > Citace

Obrázky a tabulky jsou zakázány pro bezpečnost.

Co si o tom myslíte?</textarea>
        </div>
    </div>
    
    <section class="features">
        <h2 style="text-align: center; margin-bottom: 1rem;">✨ Funkce</h2>
        <div class="features-grid">
            <div class="feature-card">
                <h3>🚀 Auto-konfigurace</h3>
                <p>Automatické nastavení z Texy! PHP knihovny</p>
            </div>
            <div class="feature-card">
                <h3>🎯 Dialogový systém</h3>
                <p>Uživatelsky přívětivé formuláře pro odkazy, obrázky atd.</p>
            </div>
            <div class="feature-card">
                <h3>👁️ Live Preview</h3>
                <p>Okamžitý náhled s Ctrl+P klávesou</p>
            </div>
            <div class="feature-card">
                <h3>📱 Responsive</h3>
                <p>Plně responzivní design pro všechny zařízení</p>
            </div>
        </div>
    </section>
    
    <footer class="footer">
        <p>© ${new Date().getFullYear()} Texyla Rewrite Dream Team • v${CONFIG.version}</p>
        <p>
            <strong>Jednoduchá integrace:</strong> 2 řádky kódu = plně funkční editor!
        </p>
        <p>
            <small>Otevřete konzoli (F12) pro debug informace</small>
        </p>
    </footer>
    
    <!-- Texyla JavaScript (produkční) -->
    <script src="../assets/js/texyla.min.js"></script>
    
    <!-- Debug funkce -->
    <script>
    // Auto-log do konzole
    setTimeout(function() {
        console.log('=== TEXYLA DEMO LOADED ===');
        console.log('Editors:', Texyla.getAllInstances());
        console.log('Version:', TEXYLA_VERSION);
        console.log('Use Texyla.debug() for more info');
        
        // Helper funkce
        window.demoHelpers = {
            togglePreview: function() {
                Texyla.getInstance('#editorAdmin')?.togglePreview();
            },
            showAllDialogs: function() {
                const editor = Texyla.getInstance('#editorAdmin');
                if (editor) {
                    console.log('Available dialogs:', editor.dialogManager?.getAvailableDialogs());
                }
            }
        };
    }, 1000);
    </script>
</body>
</html>`;
}

/**
 * Vrátí velikost souboru
 */
function getFileSize(filename, type = 'js') {
  const dir = type === 'css' ? path.join(CONFIG.assetsDir, 'css') : CONFIG.jsOutputDir;
  const filepath = path.join(dir, filename);
  
  if (!fs.existsSync(filepath)) {
    return 'not found';
  }
  
  const stats = fs.statSync(filepath);
  const size = stats.size;
  
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// Spustit build
if (require.main === module) {
  build();
}

module.exports = { build };