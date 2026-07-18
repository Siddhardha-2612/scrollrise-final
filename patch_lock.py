import sys

with open('src/components/GridSettingsHubView.tsx', 'r') as f:
    content = f.read()

target = """        {/* 5. BOTTOM-RIGHT INTERCARDINAL: Privacy (Shield) */}
        <button
          id="exact-btn-br-privacy"
          onClick={onPrivacySelected}
          className={getFeatureClass('right-[4%] bottom-[22%] flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          <Shield className="w-11 h-11 text-white mb-2 transition-transform group-hover:scale-110" strokeWidth={1.5} fill="currentColor" />"""

replacement = """        {/* 5. BOTTOM-RIGHT INTERCARDINAL: Privacy (Lock) */}
        <button
          id="exact-btn-br-privacy"
          onClick={onPrivacySelected}
          className={getFeatureClass('right-[4%] bottom-[22%] flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          <div className="relative mb-2 transition-transform group-hover:scale-110 flex items-center justify-center">
            {/* Outer Hexagon Shield/Lock Body */}
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
               <rect x="5" y="11" width="14" height="10" rx="2" fill="currentColor" stroke="none" />
               <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
               {/* Keyhole */}
               <circle cx="12" cy="15" r="1" fill="black" stroke="black" />
               <path d="M11.5 16h1l.5 3h-2l.5-3z" fill="black" stroke="none" />
            </svg>
          </div>"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/GridSettingsHubView.tsx', 'w') as f:
        f.write(content)
    print("Patched Lock.")
else:
    print("Target not found.")
