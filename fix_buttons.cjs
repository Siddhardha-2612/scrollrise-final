const fs = require('fs');

const lines = fs.readFileSync('src/components/SalesMarketView.tsx', 'utf8').split('\n');
const new_lines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes("onClick={() => setIsAddingDetails(false)}")) new_lines.push("          <button");
    if (line.includes("onClick={isFormValid ? handlePublish : undefined}")) new_lines.push("          <button");
    if (line.includes("onClick={() => setDetailProduct(null)}")) new_lines.push("          <button");
    if (line.includes("onClick={() => { setShowWishlistOnly(false); setShowMyUploadsOnly(false); }}")) new_lines.push("            <button");
    if (line.includes("onClick={onBack}")) new_lines.push("                <button");
    if (line.includes("onClick={() => setIsSearchDropdownOpen(!isSearchDropdownOpen)}")) new_lines.push("          <button");
    if (line.includes("onClick={(e) => {") && lines[i+1] && lines[i+1].includes("setDetailProduct(product);")) new_lines.push("              <button");
    if (line.includes("onClick={(e) => {") && lines[i+2] && lines[i+2].includes("setReportMenuId(null);") && lines[i+5] && lines[i+5].includes("No")) new_lines.push("                          <button");
    if (line.includes("onClick={(e) => {") && lines[i+3] && lines[i+3].includes("setReportMenuId(null);") && lines[i+6] && lines[i+6].includes("Yes")) new_lines.push("                          <button");
    if (line.includes("onClick={(e) => {") && lines[i+1] && lines[i+1].includes("setLocalProducts(prev => prev.filter")) new_lines.push("                  <button");
    if (line.includes("onClick={(e) => {") && lines[i+1] && lines[i+1].includes("setWishlistIds")) new_lines.push("                <button");
    
    if (line.trim() === ">" && lines[i+1] && lines[i+1].trim() === "ok" && lines[i+2] && lines[i+2].trim() === "</button>") continue;
    if (line.trim() === "ok" && lines[i+1] && lines[i+1].trim() === "</button>" && lines[i-1] && lines[i-1].trim() === ">") continue;
    if (line.trim() === "</button>" && lines[i-1] && lines[i-1].trim() === "ok" && lines[i-2] && lines[i-2].trim() === ">") continue;

    new_lines.push(line);
}

fs.writeFileSync('src/components/SalesMarketView.tsx', new_lines.join('\n'));
