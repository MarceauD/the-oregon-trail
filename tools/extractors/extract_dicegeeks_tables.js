const fs = require('fs');
const path = require('path');

const rawFilePath = path.join(__dirname, '../pdfs/random_tables_far_west_raw.txt');
const outputDir = path.join(__dirname, 'tables');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(rawFilePath)) {
    console.error(`Erreur : Le fichier ${rawFilePath} n'existe pas.`);
    process.exit(1);
}

const rawText = fs.readFileSync(rawFilePath, 'utf8');
const lines = rawText.split('\n');

let currentTableName = null;
let currentTableEntries = [];
let tablesSaved = 0;

function cleanTitle(title) {
    return title
        .trim()
        .replace(/’/g, "'")
        .replace(/[^a-zA-Z0-9'\s\-_]/g, '') // Keep alphanumeric, spaces, and quotes
        .replace(/\s+/g, ' ')
        .trim();
}

function getFilename(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '') + '.md';
}

function saveCurrentTable() {
    if (currentTableName && currentTableEntries.length > 0) {
        // Sort entries by number
        currentTableEntries.sort((a, b) => a.number - b.number);
        
        const filename = getFilename(currentTableName);
        const filePath = path.join(outputDir, filename);
        
        let mdContent = `# ${currentTableName}\n`;
        mdContent += `*Table extraite de random_tables_far_west.pdf*\n\n`;
        
        currentTableEntries.forEach(entry => {
            mdContent += `${entry.number}: ${entry.text}\n`;
        });
        
        fs.writeFileSync(filePath, mdContent, 'utf8');
        console.log(`Table extraite : ${filename} (${currentTableEntries.length} entrées)`);
        tablesSaved++;
    }
}

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Ignore page markers, empty lines, credits
    if (!line || 
        line.match(/^-- \d+ of \d+ --$/) || 
        line.match(/^\d+$/) || 
        line.includes("dicegeeks.com") || 
        line.includes("All rights reserved") || 
        line.includes("Table of Contents") || 
        line.includes("Get More Free") || 
        line.includes("How to Use this Book")) {
        continue;
    }
    
    // Detect item line (e.g. "1. \tSomething" or "100. \tSomething")
    const itemMatch = line.match(/^(\d+)\.\s*(.*)/);
    if (itemMatch) {
        const number = parseInt(itemMatch[1], 10);
        const text = itemMatch[2].trim();
        
        // If we hit "1." we start a new table.
        if (number === 1) {
            // Save the previous table if there was one
            if (currentTableEntries.length > 0) {
                saveCurrentTable();
            }
            
            // Find the title by tracing backwards to the first non-empty, non-numbered line
            // Stop tracing if we hit a page break
            let titleCandidates = [];
            for (let j = i - 1; j >= 0; j--) {
                const prevLine = lines[j].trim();
                
                // Stop at page breaks to avoid leaking into previous pages
                if (prevLine.match(/^-- \d+ of \d+ --$/)) {
                    break;
                }
                
                if (!prevLine || 
                    prevLine.match(/^\d+$/) || 
                    prevLine.includes("dicegeeks.com") || 
                    prevLine.includes("All rights reserved") ||
                    prevLine.includes("Table of Contents") ||
                    prevLine.includes("Get More Free")) {
                    continue;
                }
                
                if (prevLine.match(/^\d+\./)) {
                    // We hit a numbered line of the previous table. Stop.
                    break;
                }
                
                // Skip generic section headers
                if (prevLine === "Items &" || 
                    prevLine === "Things" || 
                    prevLine === "Town Names" || 
                    prevLine === "Saloon Names" || 
                    prevLine === "Names" || 
                    prevLine === "Rumors & Jobs" || 
                    prevLine === "Items & Things") {
                    continue;
                }
                titleCandidates.unshift(prevLine);
            }
            
            currentTableName = cleanTitle(titleCandidates.join(" "));
            currentTableEntries = [];
        }
        
        currentTableEntries.push({ number, text });
    }
}

// Save the very last table
saveCurrentTable();

console.log(`\nExtraction terminée avec succès ! Total : ${tablesSaved} tables.`);
