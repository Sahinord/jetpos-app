const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function fixBackgroundBugInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // React complains when "background" (shorthand) is mixed with "backgroundSize" (specific) in style objects.
    // We will change `background:` to `backgroundImage:` for linear-gradient and radial-gradient inside inline styles.
    // This regex looks for `background: "linear-gradient` or `background: "radial-gradient` or `background: \`linear-gradient` etc.
    content = content.replace(/background:\s*(["'`])((?:linear|radial)-gradient)/g, 'backgroundImage: $1$2');

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed React background bug: ${filePath}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            fixBackgroundBugInFile(fullPath);
        }
    }
}

scanDir(srcDir);
console.log('Finished fixing background property bugs across all files in src directory!');
