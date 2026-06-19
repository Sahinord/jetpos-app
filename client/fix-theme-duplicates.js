const fs = require('fs');
const filePath = '/Users/sahinord/Documents/jetpos-app/client/src/app/globals.css';
let content = fs.readFileSync(filePath, 'utf8');

// Replace duplicate glass-card at the end
content = content.replace(
  '.theme-light .glass-card {\n  background: #ffffff !important;\n  border-color: #e2e8f0 !important;\n  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02) !important;\n}',
  `.theme-light .glass-card {
  background: #ffffff !important;
  border-color: #E5E7EB !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02) !important;
}`
);

// Replace duplicate sidebar-item-active at the end
content = content.replace(
  '.theme-light .sidebar-item-active {\n  background: #2563eb !important;\n  color: #ffffff !important;\n  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);\n}',
  `.theme-light .sidebar-item-active {
  background: #7886C7 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(120, 134, 199, 0.25);
}`
);

const oldBg = '.theme-light .bg-\\[\\#020617\\]\\/98 {';
const newBg = `.theme-light .bg-\\[\\#020617\\]\\/98,
.theme-light .bg-\\[\\#0a1628\\]\\/40,
.theme-light .bg-\\[\\#0d1b2e\\]\\/40,
.theme-light .bg-\\[\\#0c1222\\]\\/40,
.theme-light .bg-\\[\\#0a0f1e\\]\\/40,
.theme-light .bg-\\[\\#1e293b\\]\\/40 {`;

if (content.includes(oldBg) && !content.includes('.theme-light .bg-\\[\\#0a1628\\]\\/40')) {
  content = content.replace(oldBg, newBg);
}

fs.writeFileSync(filePath, content);
console.log("Fixed duplicates string replacements.");
