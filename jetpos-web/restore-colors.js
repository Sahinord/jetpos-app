const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function revertColorsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // RGB revert
    content = content.replace(/99,\s*102,\s*241/g, '120, 134, 199');
    
    // Hex revert (case insensitive to catch both)
    content = content.replace(/#6366F1/gi, '#7886C7');
    content = content.replace(/#4338CA/gi, '#5A659F');
    content = content.replace(/#818CF8/gi, '#9AA7DF');
    content = content.replace(/#A5B4FC/gi, '#B0BAE6');
    content = content.replace(/#020617/gi, '#111827');
    content = content.replace(/#0F172A/gi, '#1f2937');
    content = content.replace(/#E0E7FF/gi, '#D9E0FF');
    
    // Also revert CSS variables explicitly in globals.css if needed, 
    // although the hex replace above handles most of it, let's make sure casing matches the original
    // The previous script turned #1f2937 into #0F172A, the hex replace will turn #0f172a into #1f2937 which is correct.

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Restored: ${filePath}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
            revertColorsInFile(fullPath);
        }
    }
}

scanDir(srcDir);
console.log('Finished restoring original colors across all files in src directory!');
