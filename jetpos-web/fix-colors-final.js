const fs = require('fs');
let content = fs.readFileSync('/Users/sahinord/Documents/jetpos-app/jetpos-web/src/app/fiyatlandirma/page.tsx', 'utf8');

// Replace all occurrences of these strings explicitly
const replacements = {
  'color: "rgba(255,255,255,0.35)"': 'color: "#4B5563"',
  'color: "rgba(255,255,255,0.3)"': 'color: "#9CA3AF"',
  'color: "rgba(255,255,255,0.4)"': 'color: "#6B7280"',
  'color: "rgba(255,255,255,0.45)"': 'color: "#6B7280"',
  'color: "rgba(255,255,255,0.5)"': 'color: "#4B5563"',
  'color: "rgba(255,255,255,0.6)"': 'color: "#4B5563"',
  'color: "rgba(255,255,255,0.65)"': 'color: "#4B5563"',
  'color: "rgba(255,255,255,0.7)"': 'color: "#374151"',
  'color: "rgba(255,255,255,0.75)"': 'color: "#374151"',
  'color: "rgba(255,255,255,0.8)"': 'color: "#374151"',
  'color: "rgba(255,255,255,0.25)"': 'color: "#9CA3AF"',
  'color: "rgba(255,255,255,0.12)"': 'color: "#D1D5DB"',
  
  'background: "rgba(255,255,255,0.02)"': 'background: "white"',
  'background: "rgba(255,255,255,0.03)"': 'background: "white"',
  'background: "rgba(255,255,255,0.04)"': 'background: "white"',
  'background: "rgba(255,255,255,0.05)"': 'background: "white"',
  'background: "rgba(255,255,255,0.015)"': 'background: "#F8FAFC"',
  'background: "rgba(255,255,255,0.07)"': 'background: "rgba(120, 134, 199, 0.05)"',
  
  'border: "1px solid rgba(255,255,255,0.05)"': 'border: "1px solid rgba(120, 134, 199, 0.15)"',
  'border: "1px solid rgba(255,255,255,0.06)"': 'border: "1px solid rgba(120, 134, 199, 0.15)"',
  'border: "1px solid rgba(255,255,255,0.07)"': 'border: "1px solid rgba(120, 134, 199, 0.15)"',
  'border: "1px solid rgba(255,255,255,0.1)"': 'border: "1px solid rgba(120, 134, 199, 0.2)"',
  'border: "1px solid rgba(255,255,255,0.12)"': 'border: "1px solid rgba(120, 134, 199, 0.2)"',
  'border: "1px solid rgba(255,255,255,0.035)"': 'border: "1px solid rgba(120, 134, 199, 0.1)"',
  'border: "1px solid rgba(255,255,255,0.04)"': 'border: "1px solid rgba(120, 134, 199, 0.1)"',
  
  'borderTop: ci > 0 ? "1px solid rgba(255,255,255,0.04)" : "none"': 'borderTop: ci > 0 ? "1px solid rgba(120, 134, 199, 0.1)" : "none"',
  'borderTop: "1px solid rgba(255,255,255,0.035)"': 'borderTop: "1px solid rgba(120, 134, 199, 0.1)"',
  'borderTop: "1px solid rgba(255,255,255,0.05)"': 'borderTop: "1px solid rgba(120, 134, 199, 0.1)"',
  'borderBottom: "1px solid rgba(255,255,255,0.07)"': 'borderBottom: "1px solid rgba(120, 134, 199, 0.15)"',
  
  'color: viewMode === "plans" ? "white" : "rgba(255,255,255,0.4)"': 'color: viewMode === "plans" ? "white" : "#6B7280"',
  'color: viewMode === "custom" ? "white" : "rgba(255,255,255,0.4)"': 'color: viewMode === "custom" ? "white" : "#6B7280"',
  
  'color: !yearly ? "black" : "rgba(255,255,255,0.3)"': 'color: !yearly ? "white" : "#6B7280"',
  'color: yearly ? "black" : "rgba(255,255,255,0.3)"': 'color: yearly ? "white" : "#6B7280"',
  
  'color: active ? "white" : "rgba(255,255,255,0.25)"': 'color: active ? "white" : "#9CA3AF"',
  'background: active ? "rgba(120, 134, 199, 0.08)" : "rgba(255,255,255,0.015)"': 'background: active ? "rgba(120, 134, 199, 0.08)" : "white"',
  'border: `1px solid ${active ? "rgba(120, 134, 199, 0.3)" : "rgba(255,255,255,0.04)"}`': 'border: `1px solid ${active ? "rgba(120, 134, 199, 0.5)" : "rgba(120, 134, 199, 0.15)"}`',
  'background: active ? "#7886C7" : "rgba(255,255,255,0.03)"': 'background: active ? "#7886C7" : "rgba(120, 134, 199, 0.05)"',
  
  'background: plan.highlight ? "rgba(5,150,105,0.07)" : "rgba(255,255,255,0.02)"': 'background: plan.highlight ? "rgba(5,150,105,0.02)" : "white"',
  'border: `1px solid ${plan.highlight ? "rgba(52,211,153,0.3)" : plan.badge === "⭐ En Popüler" ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.06)"}`': 'border: `1px solid ${plan.highlight ? "rgba(52,211,153,0.3)" : plan.badge === "⭐ En Popüler" ? "rgba(139,92,246,0.3)" : "rgba(120,134,199,0.15)"}`',
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

// CTA text color logic: White text for highlight/popular/custom, otherwise primary color.
content = content.split('color: "white", fontWeight: 700, fontSize: "0.95rem",').join('color: (plan.highlight || plan.badge === "⭐ En Popüler" || isCustom) ? "white" : "#7886C7", fontWeight: 700, fontSize: "0.95rem",');

fs.writeFileSync('/Users/sahinord/Documents/jetpos-app/jetpos-web/src/app/fiyatlandirma/page.tsx', content);
