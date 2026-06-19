const fs = require('fs');
let content = fs.readFileSync('/Users/sahinord/Documents/jetpos-app/jetpos-web/src/app/fiyatlandirma/page.tsx', 'utf8');

// The paragraph subtitle
content = content.replace(/color: "rgba\\(255,255,255,0\\.35\\)"/g, 'color: "#4B5563"');

// Fix the toggle buttons background: "transparent"
content = content.replace(/background: !yearly \? "transparent" : "transparent"/g, 'background: !yearly ? "#7886C7" : "transparent"');

// Save the fixed content
fs.writeFileSync('/Users/sahinord/Documents/jetpos-app/jetpos-web/src/app/fiyatlandirma/page.tsx', content);
