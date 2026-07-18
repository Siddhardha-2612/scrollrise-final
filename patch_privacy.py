import re

with open("src/components/PrivacySettingsView.tsx", "r") as f:
    content = f.read()

# Add Globe to lucide-react imports
content = re.sub(r"Briefcase } from 'lucide-react';", r"Briefcase, Globe } from 'lucide-react';", content)

# Add state for country
state_pattern = r"(const \[homeAddress, setHomeAddress\] = useState\(\(\) => \{[^\}]+\}\);\n)"
state_repl = r"\1  const [country, setCountry] = useState(() => {\n    return scopedStorage.getItem('booran_country') || '';\n  });\n"
content = re.sub(state_pattern, state_repl, content)

# Add save for country
save_pattern = r"(scopedStorage\.setItem\('booran_home_address', homeAddress\);\n)"
save_repl = r"\1    scopedStorage.setItem('booran_country', country);\n"
content = re.sub(save_pattern, save_repl, content)

# Add Country field UI
ui_pattern = r"(<div className=\"space-y-1\.5 font-sans\">\n\s*<label className=\"flex items-center gap-1\.5 text-xs font-semibold text-neutral-300\">\n\s*<MapPin className=\"w-3\.5 h-3\.5 text-neutral-400\" />\n\s*Home Address\n\s*</label>\n\s*<div className=\"h-10 bg-white/10 border border-white/10 rounded-xl flex items-center px-4 transition-colors focus-within:border-white/30\">\n\s*<input\n\s*type=\{isLocked \? \"password\" : \"text\"\}\n\s*value=\{homeAddress\}\n\s*onChange=\{\(e\) => setHomeAddress\(e.target.value\)\}\n\s*disabled=\{isLocked\}\n\s*placeholder=\{isLocked \? \"••••••••\" : \"Enter home address\"\}\n\s*className=\"w-full bg-transparent outline-none text-white text-xs font-mono placeholder-neutral-500 disabled:opacity-80\"\n\s*/>\n\s*</div>\n\s*</div>)"

ui_repl = r"""\1

            {/* Country field */}
            <div className="space-y-1.5 font-sans">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                Country
              </label>
              <div className="h-10 bg-white/10 border border-white/10 rounded-xl flex items-center px-4 transition-colors focus-within:border-white/30">
                <input
                  type={isLocked ? "password" : "text"}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isLocked}
                  placeholder={isLocked ? "••••••••" : "Enter country"}
                  className="w-full bg-transparent outline-none text-white text-xs font-mono placeholder-neutral-500 disabled:opacity-80"
                />
              </div>
            </div>"""

content = re.sub(ui_pattern, ui_repl, content)

with open("src/components/PrivacySettingsView.tsx", "w") as f:
    f.write(content)
print("Patched PrivacySettingsView.tsx")
