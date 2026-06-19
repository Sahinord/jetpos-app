const fs = require('fs');
let content = fs.readFileSync('/Users/sahinord/Documents/jetpos-app/jetpos-web/src/app/fiyatlandirma/page.tsx', 'utf8');

// Header Text Colors
content = content.replace(/color: "white"(, marginBottom: "1rem")/g, 'color: "#111827"$1');
content = content.replace(/color: "rgba\\(255,255,255,0\\.35\\)"(, fontSize: "1rem")/g, 'color: "#4B5563"$1');

// Toggle Button Colors
content = content.replace(/color: viewMode === "plans" \? "white" : "rgba\\(255,255,255,0\\.4\\)"/g, 'color: viewMode === "plans" ? "white" : "#6B7280"');
content = content.replace(/color: viewMode === "custom" \? "white" : "rgba\\(255,255,255,0\\.4\\)"/g, 'color: viewMode === "custom" ? "white" : "#6B7280"');

content = content.replace(/color: !yearly \? "black" : "rgba\\(255,255,255,0\\.3\\)"/g, 'color: !yearly ? "white" : "#6B7280"');
content = content.replace(/color: yearly \? "black" : "rgba\\(255,255,255,0\\.3\\)"/g, 'color: yearly ? "white" : "#6B7280"');
content = content.replace(/background: !yearly \? "white" : "transparent"/g, 'background: !yearly ? "#7886C7" : "transparent"');
content = content.replace(/background: yearly \? "white" : "transparent"/g, 'background: yearly ? "#7886C7" : "transparent"');
content = content.replace(/background: "rgba\\(255,255,255,0\\.02\\)", border: "1px solid rgba\\(255,255,255,0\\.05\\)"/g, 'background: "white", border: "1px solid rgba(120, 134, 199, 0.2)", boxShadow: "0 4px 12px rgba(120,134,199,0.1)"');
content = content.replace(/background: "rgba\\(255,255,255,0\\.03\\)", border: "1px solid rgba\\(255,255,255,0\\.05\\)"/g, 'background: "white", border: "1px solid rgba(120, 134, 199, 0.2)", boxShadow: "0 4px 12px rgba(120,134,199,0.1)"');

// Custom Builder Category Text
content = content.replace(/color: "white"(, marginBottom: "0\\.15rem")/g, 'color: "#111827"$1');
content = content.replace(/color: "rgba\\(255,255,255,0\\.5\\)"(, lineHeight: 1\\.5)/g, 'color: "#4B5563"$1');
content = content.replace(/color: active \? "white" : "rgba\\(255,255,255,0\\.25\\)"/g, 'color: active ? "white" : "#9CA3AF"');
content = content.replace(/color: "rgba\\(255,255,255,0\\.8\\)"(, fontStyle: "italic")/g, 'color: "#374151"$1');
content = content.replace(/background: active \? "rgba\\(120, 134, 199, 0\\.08\\)" : "rgba\\(255,255,255,0\\.015\\)"/g, 'background: active ? "rgba(120, 134, 199, 0.08)" : "white"');
content = content.replace(/border: \`1px solid \$\{active \? "rgba\\(120, 134, 199, 0\\.3\\)" : "rgba\\(255,255,255,0\\.04\\)"\}\`/g, 'border: `1px solid ${active ? "rgba(120, 134, 199, 0.5)" : "rgba(120, 134, 199, 0.15)"}`');
content = content.replace(/background: active \? "#7886C7" : "rgba\\(255,255,255,0\\.03\\)"/g, 'background: active ? "#7886C7" : "rgba(120, 134, 199, 0.05)"');

// Summary Bar (bottom)
content = content.replace(/color: "white" \}\}>Harika Bir Paket/g, 'color: "#111827" }}>Harika Bir Paket');
content = content.replace(/color: "rgba\\(255,255,255,0\\.45\\)" \}\}>Sizin/g, 'color: "#4B5563" }}>Sizin');
content = content.replace(/background: "rgba\\(10, 15, 25, 0\\.8\\)"/g, 'background: "rgba(255, 255, 255, 0.9)"');

// PLAN CARDS
// Card Background & Border
content = content.replace(/background: plan\.highlight \? "rgba\\(5,150,105,0\\.07\\)" : "rgba\\(255,255,255,0\\.02\\)"/g, 'background: plan.highlight ? "rgba(5,150,105,0.02)" : "white"');
content = content.replace(/border: \`1px solid \$\{plan\.highlight \? "rgba\\(52,211,153,0\\.3\\)" : plan\.badge === "⭐ En Popüler" \? "rgba\\(139,92,246,0\\.3\\)" : "rgba\\(255,255,255,0\\.06\\)"\}\`/g, 'border: `1px solid ${plan.highlight ? "rgba(52,211,153,0.3)" : plan.badge === "⭐ En Popüler" ? "rgba(139,92,246,0.3)" : "rgba(120,134,199,0.15)"}`, boxShadow: plan.badge === "⭐ En Popüler" ? "0 20px 40px rgba(139,92,246,0.1)" : "0 10px 30px rgba(120,134,199,0.05)"');

// Card Text
content = content.replace(/color: "white", margin: 0 \}\}/g, 'color: "#111827", margin: 0 }}');
content = content.replace(/color: "rgba\\(255,255,255,0\\.5\\)"/g, 'color: "#4B5563"');
content = content.replace(/color: "rgba\\(255,255,255,0\\.3\\)"/g, 'color: "#9CA3AF"');
content = content.replace(/color: "white" \}\}>Teklif/g, 'color: "#111827" }}>Teklif');
content = content.replace(/color: "rgba\\(255,255,255,0\\.6\\)"/g, 'color: "#6B7280"');
content = content.replace(/color: "white", lineHeight: 1/g, 'color: "#111827", lineHeight: 1');
content = content.replace(/color: "rgba\\(255,255,255,0\\.4\\)"/g, 'color: "#9CA3AF"');

// Card Button Default Background
content = content.replace(/: "rgba\\(255,255,255,0\\.07\\)"/g, ': "rgba(120,134,199,0.1)"');
content = content.replace(/color: "white", fontWeight: 700, fontSize: "0\\.95rem",/g, 'color: isCustom || plan.highlight || plan.badge === "⭐ En Popüler" ? "white" : "#7886C7", fontWeight: 700, fontSize: "0.95rem",');

// Card Divider
content = content.replace(/background: "rgba\\(255,255,255,0\\.06\\)"/g, 'background: "rgba(120,134,199,0.1)"');

// Card Features
content = content.replace(/color: "rgba\\(255,255,255,0\\.75\\)"/g, 'color: "#111827"');
content = content.replace(/color: "rgba\\(255,255,255,0\\.4\\)" \}\}>✕/g, 'color: "#9CA3AF" }}>✕');
content = content.replace(/color: "rgba\\(255,255,255,0\\.4\\)", textDecoration/g, 'color: "#9CA3AF", textDecoration');

// More Features Button
content = content.replace(/background: "rgba\\(255,255,255,0\\.03\\)", border: "1px solid rgba\\(255,255,255,0\\.07\\)"/g, 'background: "white", border: "1px solid rgba(120,134,199,0.2)"');
content = content.replace(/color: "rgba\\(255,255,255,0\\.4\\)"(, fontSize: "0\\.78rem")/g, 'color: "#4B5563"$1');

// Comparison Table Button
content = content.replace(/background: "rgba\\(255,255,255,0\\.04\\)",/g, 'background: "white",');
content = content.replace(/border: "1px solid rgba\\(255,255,255,0\\.1\\)"/g, 'border: "1px solid rgba(120,134,199,0.2)", boxShadow: "0 4px 12px rgba(120,134,199,0.05)"');
content = content.replace(/color: "rgba\\(255,255,255,0\\.7\\)"/g, 'color: "#111827"');

// Comparison Table Header
content = content.replace(/background: "rgba\\(255,255,255,0\\.02\\)"/g, 'background: "white"');
content = content.replace(/background: "rgba\\(255,255,255,0\\.03\\)"/g, 'background: "#F8FAFC"');
content = content.replace(/border: "1px solid rgba\\(255,255,255,0\\.07\\)"/g, 'border: "1px solid rgba(120,134,199,0.15)", boxShadow: "0 10px 30px rgba(120,134,199,0.05)"');
content = content.replace(/borderBottom: "1px solid rgba\\(255,255,255,0\\.07\\)"/g, 'borderBottom: "1px solid rgba(120,134,199,0.15)"');

// Comparison Table Cells
content = content.replace(/color: "rgba\\(255,255,255,0\\.35\\)"/g, 'color: "#4B5563"');
content = content.replace(/background: "rgba\\(255,255,255,0\\.015\\)"/g, 'background: "white"');
content = content.replace(/borderTop: ci > 0 \? "1px solid rgba\\(255,255,255,0\\.04\\)" : "none"/g, 'borderTop: ci > 0 ? "1px solid rgba(120,134,199,0.1)" : "none"');
content = content.replace(/color: "rgba\\(255,255,255,0\\.4\\)"/g, 'color: "#6B7280"');
content = content.replace(/borderTop: "1px solid rgba\\(255,255,255,0\\.035\\)"/g, 'borderTop: "1px solid rgba(120,134,199,0.05)"');
content = content.replace(/color: "rgba\\(255,255,255,0\\.65\\)"/g, 'color: "#374151"');
content = content.replace(/color: "rgba\\(255,255,255,0\\.12\\)"/g, 'color: "#D1D5DB"');

// Save the fixed content
fs.writeFileSync('/Users/sahinord/Documents/jetpos-app/jetpos-web/src/app/fiyatlandirma/page.tsx', content);
