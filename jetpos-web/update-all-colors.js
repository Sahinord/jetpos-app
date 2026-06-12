const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceColorsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace Hex and RGB codes used directly
    // Using case-insensitive regex for hex codes
    content = content.replace(/120,\s*134,\s*199/g, '99, 102, 241');
    content = content.replace(/#7886C7/gi, '#6366F1');
    content = content.replace(/#5A659F/gi, '#4338CA');
    content = content.replace(/#9AA7DF/gi, '#818CF8');
    content = content.replace(/#B0BAE6/gi, '#A5B4FC');
    content = content.replace(/#111827/gi, '#020617');
    content = content.replace(/#1f2937/gi, '#0F172A');
    content = content.replace(/#D9E0FF/gi, '#E0E7FF');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated: ${filePath}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.css')) {
            replaceColorsInFile(fullPath);
        }
    }
}

scanDir(srcDir);
console.log('Finished updating colors across all files in src directory!');
