const fs = require('fs');
const path = 'e:/Dashboard/frontend/app/admin/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetContent = `                    <div className="flex gap-2">
                      <button
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className="p-3 bg-white/5 hover:bg-brand-primary/10 rounded-xl transition-all text-slate-400 hover:text-brand-primary border border-white/5"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                    </div>`;

const replacementContent = `                    <div className="flex gap-2">
                      <button
                        onClick={handleSyncDB}
                        className={\`flex items-center gap-2 px-4 py-2 \${syncing ? 'bg-brand-primary/50' : 'bg-brand-primary'} text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-glow shadow-brand-primary/20\`}
                        disabled={syncing}
                      >
                        {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                        {syncing ? "Syncing MySQL..." : "Start Visualization (MySQL)"}
                      </button>
                      <button
                        onClick={() => setRefreshKey(prev => prev + 1)}
                        className="p-3 bg-white/5 hover:bg-brand-primary/10 rounded-xl transition-all text-slate-400 hover:text-brand-primary border border-white/5"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                    </div>`;

// Replace all occurrences
while (content.includes(targetContent)) {
    content = content.replace(targetContent, replacementContent);
}

fs.writeFileSync(path, content);
console.log("✅ Successfully patched admin/page.tsx");
