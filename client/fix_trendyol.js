const fs = require('fs');
let content = fs.readFileSync('/Users/sahinord/Documents/jetpos-app/client/src/components/Integrations/TrendyolGOWidget.tsx', 'utf8');

content = content.replace(/className="text-sm font-black text-white"/g, 'className="text-sm font-black text-foreground"');
content = content.replace(/className="text-3xl font-black text-white mb-1"/g, 'className="text-3xl font-black text-foreground mb-1"');
content = content.replace(/text-xs font-black text-white uppercase/g, 'text-xs font-black text-foreground uppercase');
content = content.replace(/bg-slate-900 hover:bg-slate-800 border border-white\/5/g, 'bg-muted/50 hover:bg-muted border border-border');
content = content.replace(/rounded-2xl text-white font-black/g, 'rounded-2xl text-foreground font-black');
content = content.replace(/text-xs font-bold text-white group-hover:text-orange-400/g, 'text-xs font-bold text-foreground group-hover:text-orange-400');
content = content.replace(/text-sm font-black text-white/g, 'text-sm font-black text-foreground');
content = content.replace(/text-secondary hover:text-white hover:bg-white\/5/g, 'text-secondary hover:text-foreground hover:bg-muted');
content = content.replace(/bg-white\/\[0\.02\] border-white\/5/g, 'bg-background border-border');
content = content.replace(/bg-white\/\[0\.02\] border border-white\/5/g, 'bg-background border border-border');
content = content.replace(/text-sm text-white placeholder:text-secondary\/30/g, 'text-sm text-foreground placeholder:text-secondary/30');
content = content.replace(/text-sm font-bold text-white mb-2/g, 'text-sm font-bold text-foreground mb-2');
content = content.replace(/text-xl font-black text-white/g, 'text-xl font-black text-foreground');
content = content.replace(/text-2xl font-black text-white/g, 'text-2xl font-black text-foreground');
content = content.replace(/text-lg font-black text-white/g, 'text-lg font-black text-foreground');
content = content.replace(/text-\[9px\] text-white font-bold/g, 'text-[9px] text-foreground font-bold');
content = content.replace(/bg-slate-950\/50 border border-white\/5/g, 'bg-background border border-border');
content = content.replace(/text-sm text-white focus:border/g, 'text-sm text-foreground focus:border');
content = content.replace(/text-sm font-bold text-white group-hover:text-amber-400/g, 'text-sm font-bold text-foreground group-hover:text-amber-400');
content = content.replace(/text-sm font-bold text-white group-hover:text-emerald-400/g, 'text-sm font-bold text-foreground group-hover:text-emerald-400');
content = content.replace(/bg-white\/5 hover:bg-white\/10 border border-white\/5/g, 'bg-muted/50 hover:bg-muted border border-border');
content = content.replace(/text-sm font-bold text-white transition-all/g, 'text-sm font-bold text-foreground transition-all');
// fix the button that accidentally got replaced
content = content.replace(/from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-2xl text-foreground font-black/g, 'from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 rounded-2xl text-primary-foreground font-black');

fs.writeFileSync('/Users/sahinord/Documents/jetpos-app/client/src/components/Integrations/TrendyolGOWidget.tsx', content);
