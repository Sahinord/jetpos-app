const fs = require('fs');
const path = './src/app/globals.css';
let css = fs.readFileSync(path, 'utf8');

// Replace Root variables
css = css.replace(/--primary: #7886C7;/g, '--primary: #6366f1;');
css = css.replace(/--primary-dark: #5A659F;/g, '--primary-dark: #4338ca;');
css = css.replace(/--primary-light: #9AA7DF;/g, '--primary-light: #818cf8;');
css = css.replace(/--accent: #B0BAE6;/g, '--accent: #a5b4fc;');
css = css.replace(/--deep: #111827;/g, '--deep: #020617;');
css = css.replace(/--navy: #1f2937;/g, '--navy: #0f172a;');
css = css.replace(/--border: #D9E0FF;/g, '--border: #e0e7ff;');

// Replace Hex and RGB codes used directly
css = css.replace(/120,\s*134,\s*199/g, '99, 102, 241');
css = css.replace(/#7886C7/g, '#6366f1');
css = css.replace(/#5A659F/g, '#4338ca');
css = css.replace(/#9AA7DF/g, '#818cf8');
css = css.replace(/#B0BAE6/g, '#a5b4fc');
css = css.replace(/#111827/g, '#020617');
css = css.replace(/#1f2937/g, '#0f172a');

// Append Tailwind Client Variables so that they match the Client's @theme configuration 
// (Useful if tailwind classes in jetpos-web use them)
const themeInject = `
@theme {
  --color-background: #020617;
  --color-foreground: #f8fafc;
  --color-card: #0f172a;
  --color-card-foreground: #f8fafc;
  --color-primary: #6366f1;
  --color-secondary: #94a3b8;
  --color-accent: #10b981;
  --color-destructive: #ef4444;
  --color-border: rgba(99, 102, 241, 0.08);
  --color-sidebar: #0f172a;
  --color-sidebar-foreground: #f8fafc;
  --color-sidebar-muted: #64748b;
  --color-input-bg: rgba(255, 255, 255, 0.02);
  --color-input-border: rgba(255, 255, 255, 0.05);

  /* Neon Accents */
  --color-neon-cyan: #06b6d4;
  --color-neon-pink: #d946ef;
  --color-neon-blue: #3b82f6;
}
`;

if(!css.includes('@theme {')) {
  css = css.replace('@import "tailwindcss";', '@import "tailwindcss";\n' + themeInject);
}

fs.writeFileSync(path, css);
console.log('Colors successfully updated in globals.css!');
