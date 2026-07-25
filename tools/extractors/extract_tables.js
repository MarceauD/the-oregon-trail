const fs = require('fs');
const path = require('path');

// Configuration paths
const sourceFile = path.join(__dirname, '../pdfs/generateur_noms_western.html');
const outputDir = path.join(__dirname, 'tables');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

try {
    // Read the source HTML file
    const htmlContent = fs.readFileSync(sourceFile, 'utf8');
    
    // Regex to match each table block
    const tableRegex = /<div class="origin-title">([^<]+)<\/div>\s*<table>([\s\S]*?)<\/table>/g;
    
    // Regex to match each cell inside a table (e.g., <span style="...">01</span> Smith)
    const cellRegex = /<td[^>]*>\s*<span[^>]*>(\d+)<\/span>\s*([^<]+)<\/td>/g;
    
    let match;
    let tablesExtracted = 0;
    
    while ((match = tableRegex.exec(htmlContent)) !== null) {
        const rawTitle = match[1].trim(); 
        const tableBody = match[2];
        
        // Clean the title for the filename
        const filenameTitle = rawTitle
            .replace(/Table \d+\s*:\s*/i, '') // Remove table numbers like "Table 1 : "
            .replace(/\s*\(1d100\)/i, '')      // Remove (1d100)
            .toLowerCase()
            .replace(/[^a-z0-9_\-]/g, '_')     // Replace spaces and special characters
            .replace(/_+/g, '_')               // Deduplicate underscores
            .replace(/^_+|_+$/g, '');          // Trim underscores
            
        const mdFilename = `${filenameTitle}.md`;
        const mdFilePath = path.join(outputDir, mdFilename);
        
        // Extract cells
        let cellMatch;
        const entries = [];
        
        while ((cellMatch = cellRegex.exec(tableBody)) !== null) {
            const number = parseInt(cellMatch[1], 10);
            const value = cellMatch[2].trim();
            entries.push({ number, value });
        }
        
        // Sort entries by number to ensure correct order
        entries.sort((a, b) => a.number - b.number);
        
        if (entries.length > 0) {
            // Build the Markdown file content
            let mdContent = `# ${rawTitle}\n`;
            mdContent += `*Cette table a été extraite de manière déterministe depuis le fichier d'origine generateur_noms_western.html.*\n\n`;
            
            entries.forEach(entry => {
                mdContent += `${entry.number}: ${entry.value}\n`;
            });
            
            fs.writeFileSync(mdFilePath, mdContent, 'utf8');
            console.log(`Table extraite avec succès : ${mdFilename} (${entries.length} entrées)`);
            tablesExtracted++;
        }
    }
    
    console.log(`Extraction terminée ! Total de tables extraites : ${tablesExtracted}`);
    
} catch (error) {
    console.error("Erreur lors de l'extraction des tables :", error);
}
