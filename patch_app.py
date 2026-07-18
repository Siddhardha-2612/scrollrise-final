import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. Remove the sandbox box
sandbox_pattern = r"\{!isStoriesCameraOpen && \(\n\s*<div className=\"w-full max-w-sm mb-4 flex flex-col gap-2 bg-neutral-900/60 p-2\.5 rounded-2xl border border-white/5 shadow-md\">.*?</div>\n\s*\)\}"
content = re.sub(sandbox_pattern, "", content, flags=re.DOTALL)

# 2. Modify outer wrapper
outer_wrapper_pattern = r"<div className=\"min-h-screen bg-neutral-950 font-sans flex flex-col items-center justify-center p-3 sm:p-6 select-none w-full\">"
content = content.replace(outer_wrapper_pattern, "<div className=\"h-[100dvh] w-full bg-neutral-950 font-sans flex flex-col items-center justify-center select-none\">")

# 3. Modify chassis wrapper
chassis_pattern = r"className=\{`relative w-full flex flex-col \$\{\n\s*isEmulatorMode\n\s*\? `max-w-sm h-\[800px\] rounded-\[52px\] border-\[12px\] border-neutral-900 shadow-\[0_25px_60px_-15px_rgba\(0,0,0,0\.9\)\] \$\{applyCustomBg && globalGlassmorphism \? 'bg-transparent' : 'bg-black'\} overflow-hidden ring-4 ring-white/5`\n\s*: `max-w-xl min-h-\[800px\] rounded-3xl border border-white/5 \$\{applyCustomBg && globalGlassmorphism \? 'bg-transparent' : 'bg-black'\} overflow-hidden`\n\s*\}`\}"
new_chassis = r"className={`relative w-full h-full flex flex-col ${applyCustomBg && globalGlassmorphism ? 'bg-transparent' : 'bg-black'} overflow-hidden`}"
content = re.sub(chassis_pattern, new_chassis, content)

# 4. Remove phone emulator status bar
status_bar_pattern = r"\{\/\* Phone emulator status bar displayed only when chassis is checked \*\/\}\n\s*\{isEmulatorMode && \(\n\s*<div id=\"emulator-status-bar\".*?</div>\n\s*\)\}"
content = re.sub(status_bar_pattern, "", content, flags=re.DOTALL)

# 5. Fix dynamic inner router frame height
router_frame_pattern = r"className=\{`relative w-full flex-1 \$\{applyCustomBg && globalGlassmorphism \? 'bg-transparent' : 'bg-black'\} flex flex-col justify-between overflow-hidden \$\{\n\s*isEmulatorMode \? \"\" : \"min-h-\[800px\]\"\n\s*\}`\}"
new_router_frame = r"className={`relative w-full flex-1 ${applyCustomBg && globalGlassmorphism ? 'bg-transparent' : 'bg-black'} flex flex-col justify-between overflow-hidden`}"
content = re.sub(router_frame_pattern, new_router_frame, content)

# 6. Remove bottom navigation pill
pill_pattern = r"\{\/\* Virtual Phone navigation pill overlay displayed only when chassis is toggled \*\/\}\n\s*\{isEmulatorMode && \(currentRoute === \"dashboard\" \|\| currentRoute === \"sales-market\" \|\| currentRoute === \"shopi-market\"\) && \(\n\s*<div className=\"absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-40 pointer-events-none\" />\n\s*\)\}"
content = re.sub(pill_pattern, "", content, flags=re.DOTALL)

with open("src/App.tsx", "w") as f:
    f.write(content)
print("Patched App.tsx")
