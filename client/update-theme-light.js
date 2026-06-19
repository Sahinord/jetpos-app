const fs = require('fs');

const filePath = '/Users/sahinord/Documents/jetpos-app/client/src/app/globals.css';
let content = fs.readFileSync(filePath, 'utf8');

// Update .theme-light block
const oldThemeLightRegex = /:root:has\(\.theme-light\),[\s\S]*?\.theme-light \{[\s\S]*?\}/;
const newThemeLight = `:root:has(.theme-light),
.theme-light {
  /* JetPOS Premium Design System - Light Theme */
  --color-background: #F8FAFC;
  --color-foreground: #111827;
  --color-card: #FFFFFF;
  --color-card-foreground: #111827;
  --color-border: #E5E7EB;
  --color-primary: #7886C7;
  --color-secondary: #4B5563;
  --color-accent: #7886C7;
  --color-sidebar: #FFFFFF;
  --color-sidebar-foreground: #111827;
  --color-sidebar-muted: #64748b;
  --color-input-bg: #FFFFFF;
  --color-input-border: #E5E7EB;
  --color-muted: #9CA3AF;
  --color-faded: #F1F5F9;
  
  /* Cyber aesthetics adapted to light theme */
  --color-neon-cyan: #7886C7;
  --color-neon-pink: #8b5cf6;
  --color-neon-blue: #9AA7DF;
}`;

content = content.replace(oldThemeLightRegex, newThemeLight);

// Expand specific light mode fixes
const oldFixesRegex = /\/\* Specific light mode fixes for invisibile text and backgrounds \*\/[\s\S]*?\/\* Utility to force visibility in light mode \*\//;

const newFixes = `/* Specific light mode fixes for invisibile text and backgrounds */
.theme-light .text-white {
  color: #111827 !important;
}

.theme-light .bg-white\\/5,
.theme-light .bg-primary\\/5,
.theme-light .bg-slate-900\\/50,
.theme-light .bg-\\[\\#020617\\],
.theme-light .bg-\\[\\#0f172a\\],
.theme-light .bg-\\[\\#1e293b\\],
.theme-light .bg-\\[\\#0d1b2e\\],
.theme-light .bg-\\[\\#0a1628\\],
.theme-light .bg-\\[\\#0a0f1e\\],
.theme-light .bg-\\[\\#0c1222\\],
.theme-light .bg-card\\/40,
.theme-light .bg-card\\/50 {
  background-color: #FFFFFF !important;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
}

/* For elements that explicitly used dark bg with opacity, use a soft slate in light mode */
.theme-light .bg-\\[\\#020617\\]\\/40,
.theme-light .bg-\\[\\#020617\\]\\/60,
.theme-light .bg-\\[\\#020617\\]\\/85,
.theme-light .bg-\\[\\#020617\\]\\/95,
.theme-light .bg-\\[\\#020617\\]\\/98 {
  background-color: rgba(255, 255, 255, 0.9) !important;
}

.theme-light .border-white\\/5,
.theme-light .border-white\\/10,
.theme-light .border-white\\/20,
.theme-light .border-border\\/40 {
  border-color: #E5E7EB !important;
}

.theme-light .text-secondary\\/40,
.theme-light .text-secondary\\/30,
.theme-light .text-secondary\\/20,
.theme-light .text-secondary\\/10,
.theme-light .text-secondary\\/60,
.theme-light .text-slate-500 {
  color: #6B7280 !important;
}

.theme-light .text-white\\/90,
.theme-light .text-slate-200 {
  color: #111827 !important;
}

/* Fix input placeholders */
.theme-light .placeholder\\:text-secondary\\/10::placeholder,
.theme-light .placeholder\\:text-secondary\\/20::placeholder,
.theme-light .placeholder\\:text-secondary\\/30::placeholder {
  color: #9CA3AF !important;
}

/* Utility to force visibility in light mode */`;

content = content.replace(oldFixesRegex, newFixes);

// Fix .theme-light .sidebar-item-active and .glass-card manually 
// since they are below the fixes
content = content.replace(
  /\.theme-light \.sidebar-item-active \{[\s\S]*?\}/,
  `.theme-light .sidebar-item-active {
  background: #7886C7 !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(120, 134, 199, 0.25);
}`
);

content = content.replace(
  /\.theme-light \.glass-card \{[\s\S]*?\}/,
  `.theme-light .glass-card {
  background: #ffffff !important;
  border-color: #E5E7EB !important;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02) !important;
}`
);

// Update scrollbar for theme-light
content = content.replace(
  /\.theme-light ::-webkit-scrollbar-thumb \{[\s\S]*?\}/,
  `.theme-light ::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #7886C7, #9AA7DF);
}`
);

content = content.replace(
  /\.theme-light ::-webkit-scrollbar-thumb:hover \{[\s\S]*?\}/,
  `.theme-light ::-webkit-scrollbar-thumb:hover {
  background: #5A659F;
}`
);

content = content.replace(
  /\.theme-light \{\n  scrollbar-color: #cbd5e1 transparent;\n\}/,
  `.theme-light {\n  scrollbar-color: #7886C7 transparent;\n}`
);

fs.writeFileSync(filePath, content);
console.log("Updated globals.css successfully!");
