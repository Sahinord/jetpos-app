const fs = require('fs');
let content = fs.readFileSync('/Users/sahinord/Documents/jetpos-app/jetpos-web/src/app/fiyatlandirma/page.tsx', 'utf8');

// Replace remaining white texts
content = content.split('color: "white"').join('color: "#111827"');
content = content.split('color: "rgba(255,255,255,0.25)"').join('color: "#9CA3AF"');
content = content.split('color: active ? "white" : "#9CA3AF"').join('color: active ? "#111827" : "#9CA3AF"');

// Fix toggle buttons for custom mode
content = content.split('color: viewMode === "plans" ? "white" : "#6B7280"').join('color: viewMode === "plans" ? "white" : "#6B7280"');
content = content.split('color: viewMode === "custom" ? "white" : "#6B7280"').join('color: viewMode === "custom" ? "white" : "#6B7280"');

// Make sure badge and CTA buttons keep white text where intended
content = content.split('color: (plan.highlight || plan.badge === "⭐ En Popüler" || isCustom) ? "#111827" : "#7886C7"').join('color: (plan.highlight || plan.badge === "⭐ En Popüler" || isCustom) ? "white" : "#7886C7"');
content = content.split('color: "#111827", fontSize: "0.68rem"').join('color: "white", fontSize: "0.68rem"');
content = content.split('Check style={{ width: "0.75rem", height: "0.75rem", color: "#111827" }}').join('Check style={{ width: "0.75rem", height: "0.75rem", color: "white" }}');
content = content.split('fontWeight: 900, fontSize: "1.35rem", color: "#111827"').join('fontWeight: 900, fontSize: "1.35rem", color: "white"');
content = content.split('color: viewMode === "plans" ? "#111827" : "#6B7280"').join('color: viewMode === "plans" ? "white" : "#6B7280"');
content = content.split('color: viewMode === "custom" ? "#111827" : "#6B7280"').join('color: viewMode === "custom" ? "white" : "#6B7280"');
content = content.split('color: !yearly ? "#111827" : "#6B7280"').join('color: !yearly ? "white" : "#6B7280"');
content = content.split('color: yearly ? "#111827" : "#6B7280"').join('color: yearly ? "white" : "#6B7280"');

fs.writeFileSync('/Users/sahinord/Documents/jetpos-app/jetpos-web/src/app/fiyatlandirma/page.tsx', content);
