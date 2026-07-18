import re

with open("src/components/ChannelFeedDashboard.tsx", "r") as f:
    content = f.read()

# 1. Extract the color block
color_block_pattern = re.compile(r'(\s*\{\(!proBgImage && glassmorphismActive\) && \(\n\s*<div className="flex flex-col gap-2 w-full max-w-\[200px\]">.*?</div>\n\s*\)\})', re.DOTALL)
match = color_block_pattern.search(content)

if match:
    color_block = match.group(1)
    # Remove the color block from its original position
    content = content.replace(color_block, "")
    
    # Modify the color block to remove the !proBgImage condition and update label
    new_color_block = color_block.replace('{(!proBgImage && glassmorphismActive) && (', '{glassmorphismActive && (')
    new_color_block = new_color_block.replace('<span className="text-white text-xs font-medium pl-1">(or) color</span>', '<span className="text-white text-[11px] font-medium pl-1">Color</span>')
    
    # Remove the wrapper '{glassmorphismActive && (' and ')}' so we can inline it
    new_color_block = re.sub(r'^\s*\{glassmorphismActive && \(\n', '', new_color_block)
    new_color_block = re.sub(r'\n\s*\)\}\s*$', '\n', new_color_block)
    
    # 2. Find the brightness block
    brightness_block_pattern = re.compile(r'(\s*\{glassmorphismActive && \(proBgImage \|\| proBgColor\) && \(\n\s*<div className="flex flex-col gap-2 w-full max-w-\[80px\] mt-2">.*?</div>\n\s*\)\})', re.DOTALL)
    
    b_match = brightness_block_pattern.search(content)
    if b_match:
        brightness_block = b_match.group(1)
        # Remove the wrapper
        inner_brightness = re.sub(r'^\s*\{glassmorphismActive && \(proBgImage \|\| proBgColor\) && \(\n', '', brightness_block)
        inner_brightness = re.sub(r'\n\s*\)\}\s*$', '\n', inner_brightness)
        
        # Combine them into a new block
        combined_block = f"""
                {{glassmorphismActive && (
                  <div className="flex flex-row items-end gap-6 mt-2">
                    {{(proBgImage || proBgColor) && (
{inner_brightness}
                    )}}
{new_color_block}
                  </div>
                )}}"""
                
        content = content.replace(brightness_block, combined_block)
        
        with open("src/components/ChannelFeedDashboard.tsx", "w") as f:
            f.write(content)
        print("Patched successfully!")
    else:
        print("Could not find brightness block")
else:
    print("Could not find color block")

