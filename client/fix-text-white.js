const fs = require('fs');
const path = '/Users/sahinord/Documents/jetpos-app/client/src/app/globals.css';
let css = fs.readFileSync(path, 'utf8');

// Replace the global text-white override
const badRule = /\.theme-light \.text-white \{\s*color: #111827 !important;\s*\}/g;

const newRule = `/* Fix text colors ONLY for elements where we overrode the background to white */
.theme-light .bg-white\\/5 .text-white,
.theme-light .bg-primary\\/5 .text-white,
.theme-light .bg-slate-900\\/50 .text-white,
.theme-light .bg-\\[\\#020617\\] .text-white,
.theme-light .bg-\\[\\#0f172a\\] .text-white,
.theme-light .bg-\\[\\#1e293b\\] .text-white,
.theme-light .bg-\\[\\#0d1b2e\\] .text-white,
.theme-light .bg-\\[\\#0a1628\\] .text-white,
.theme-light .bg-\\[\\#0a0f1e\\] .text-white,
.theme-light .bg-\\[\\#0c1222\\] .text-white,
.theme-light .bg-card\\/40 .text-white,
.theme-light .bg-card\\/50 .text-white,
.theme-light .glass-card .text-white {
  color: #111827 !important;
}

.theme-light .bg-white\\/5.text-white,
.theme-light .bg-primary\\/5.text-white,
.theme-light .bg-slate-900\\/50.text-white,
.theme-light .bg-\\[\\#020617\\].text-white,
.theme-light .bg-\\[\\#0f172a\\].text-white,
.theme-light .bg-\\[\\#1e293b\\].text-white,
.theme-light .bg-\\[\\#0d1b2e\\].text-white,
.theme-light .bg-\\[\\#0a1628\\].text-white,
.theme-light .bg-\\[\\#0a0f1e\\].text-white,
.theme-light .bg-\\[\\#0c1222\\].text-white,
.theme-light .bg-card\\/40.text-white,
.theme-light .bg-card\\/50.text-white,
.theme-light .glass-card.text-white {
  color: #111827 !important;
}`;

css = css.replace(badRule, newRule);

fs.writeFileSync(path, css);
console.log("Fixed text-white override.");
