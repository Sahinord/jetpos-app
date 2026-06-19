const fs = require('fs');
const path = '/Users/sahinord/Documents/jetpos-app/client/src/app/globals.css';
let css = fs.readFileSync(path, 'utf8');

const badRule2 = /\.theme-light \.text-white\\\/90,\n\.theme-light \.text-slate-200 \{\s*color: #111827 !important;\s*\}/g;

css = css.replace(badRule2, '');

fs.writeFileSync(path, css);
console.log("Fixed more global overrides.");
