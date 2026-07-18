import re

with open('src/components/SalesMarketView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    # Missing tags
    if "onClick={() => setIsAddingDetails(false)}" in line:
        new_lines.append("          <button\n")
    if "onClick={isFormValid ? handlePublish : undefined}" in line:
        new_lines.append("          <button\n")
    if "onClick={() => setDetailProduct(null)}" in line:
        new_lines.append("          <button\n")
    if "onClick={() => { setShowWishlistOnly(false); setShowMyUploadsOnly(false); }}" in line:
        new_lines.append("            <button\n")
    if "onClick={onBack}" in line:
        new_lines.append("                <button\n")
    if "onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}" in line:
        new_lines.append("          <button\n")
    if "onClick={(e) => {" in line and "setDetailProduct(product);" in lines[i+1]:
        new_lines.append("              <button\n")
    if "onClick={(e) => {" in line and "setReportMenuId(null);" in lines[i+2] and "No" in lines[i+5]:
        new_lines.append("                          <button\n")
    if "onClick={(e) => {" in line and "setReportMenuId(null);" in lines[i+3] and "Yes" in lines[i+6]:
        new_lines.append("                          <button\n")
    if "onClick={(e) => {" in line and "setLocalProducts(prev => prev.filter" in lines[i+1]:
        new_lines.append("                  <button\n")
    if "onClick={(e) => {" in line and "setWishlistIds" in lines[i+1]:
        new_lines.append("                <button\n")

    # Remove the broken 'ok' button parts
    if line.strip() == ">" and lines[i+1].strip() == "ok" and lines[i+2].strip() == "</button>":
        continue
    if line.strip() == "ok" and lines[i+1].strip() == "</button>" and lines[i-1].strip() == ">":
        continue
    if line.strip() == "</button>" and lines[i-1].strip() == "ok" and lines[i-2].strip() == ">":
        continue

    new_lines.append(line)

with open('src/components/SalesMarketView.tsx', 'w') as f:
    f.writelines(new_lines)

