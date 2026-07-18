import sys

with open('src/components/GridSettingsHubView.tsx', 'r') as f:
    content = f.read()

target = """        {/* 5. BOTTOM-RIGHT INTERCARDINAL: Privacy (Padlock) */}
        <button
          id="exact-btn-br-privacy"
          onClick={onPrivacySelected}
          className={getFeatureClass('right-[4%] bottom-[22%] flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          <svg 
            className="w-12 h-12 text-white mb-1.5 transition-transform group-hover:scale-110" 
            viewBox="0 0 100 100" 
          >
            {/* Shackle: Thick rounded white arch, highly powerful robust look */}
            <path 
              d="M 33,42 V 28 C 33,16 67,16 67,28 V 42" 
              stroke="currentColor" 
              strokeWidth="10" 
              strokeLinecap="round" 
              fill="none" 
            />
            
            {/* Padlock Body (solid rounded plate) */}
            <path 
              d="M 20,42 
                 H 80 
                 C 84,42 85,44 85,48 
                 V 75 
                 C 85,84 79,89 70,89 
                 H 30 
                 C 21,89 15,84 15,75 
                 V 48 
                 C 15,44 16,42 20,42 
                 Z" 
              fill="currentColor" 
            />
            {/* Distinctive organic black sweep waves carving the body exactly like the image */}
            {/* Sweep 1 */}
            <path 
              d="M 13,54 
                 C 25,54 36,52 46,55 
                 C 56,58 66,61 87,48 
                 L 87,55 
                 C 66,68 56,65 46,62 
                 C 36,59 25,61 13,61 
                 Z" 
              fill="black" 
            />
            {/* Sweep 2 */}
            <path 
              d="M 13,66 
                 C 25,66 36,64 46,67 
                 C 56,70 66,73 87,60 
                 L 87,67 
                 C 66,80 56,77 46,74 
                 C 36,71 25,73 13,73 
                 Z" 
              fill="black" 
            />
            {/* Sweep 3 */}
            <path 
              d="M 13,78 
                 C 25,78 36,76 46,79 
                 C 56,82 66,85 87,72 
                 L 87,79 
                 C 66,92 56,89 46,86 
                 C 36,83 25,85 13,85 
                 Z" 
              fill="black" 
            />
          </svg>"""

replacement = """        {/* 5. BOTTOM-RIGHT INTERCARDINAL: Privacy (Shield) */}
        <button
          id="exact-btn-br-privacy"
          onClick={onPrivacySelected}
          className={getFeatureClass('right-[4%] bottom-[22%] flex flex-col items-center group cursor-pointer active:scale-95')}
        >
          <Shield className="w-11 h-11 text-white mb-2 transition-transform group-hover:scale-110" strokeWidth={1.5} fill="currentColor" />"""

if target in content:
    content = content.replace(target, replacement)
    with open('src/components/GridSettingsHubView.tsx', 'w') as f:
        f.write(content)
    print("Patched GridSettingsHubView privacy icon.")
else:
    print("Target not found.")
