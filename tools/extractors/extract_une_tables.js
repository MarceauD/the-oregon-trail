const fs = require('fs');
const path = require('path');

const rawFilePath = path.join(__dirname, '../pdfs/UNE_NPC_Generator_raw.txt');
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

const tableDefinitions = [
    {
        name: "une_modifier",
        title: "Table 1: NPC Modifier",
        startMarker: "Table 1: NPC Modifier",
        endMarker: "Table 2: NPC Noun"
    },
    {
        name: "une_noun",
        title: "Table 2: NPC Noun",
        startMarker: "Table 2: NPC Noun",
        endMarker: "2. (Optional) Find the NPC Power Level"
    },
    {
        name: "une_motivation_verb",
        title: "Table 4: NPC Motivation Verb",
        startMarker: "Table 4: NPC Motivation Verb",
        endMarker: "Table 5: NPC Motivation Noun"
    },
    {
        name: "une_motivation_noun",
        title: "Table 5: NPC Motivation Noun",
        startMarker: "Table 5: NPC Motivation Noun",
        endMarker: "4. Combine all the terms to create an NPC"
    },
    {
        name: "une_focus",
        title: "Table 8: NPC Focus",
        startMarker: "Table 8: NPC Focus",
        endMarker: "3. Combine the NPC Bearing and NPC Focus"
    }
];

tableDefinitions.forEach(def => {
    let inTable = false;
    const entries = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.includes(def.startMarker)) {
            inTable = true;
            continue;
        }
        
        if (inTable && line.includes(def.endMarker)) {
            inTable = false;
            break;
        }
        
        if (inTable) {
            // Skip page headers, footers, page markers, and empty lines
            if (!line || line.match(/^-- \d+ of \d+ --$/) || line.includes("Marceau Dida") || line.match(/^\d+$/)) {
                continue;
            }
            
            // Split by tabs and clean
            const parts = line.split('\t').map(p => p.trim()).filter(p => p);
            
            // Process parts in pairs
            for (let k = 0; k < parts.length; k += 2) {
                const keyStr = parts[k];
                const valStr = parts[k + 1];
                
                if (keyStr && valStr) {
                    const rangeMatch = keyStr.match(/^(\d+)-(\d+)$/);
                    const exactMatch = keyStr.match(/^(\d+)$/);
                    
                    if (rangeMatch) {
                        const min = parseInt(rangeMatch[1], 10);
                        const max = parseInt(rangeMatch[2], 10);
                        entries.push({ type: 'range', min, max, text: valStr, key: min });
                    } else if (exactMatch) {
                        const number = parseInt(exactMatch[1], 10);
                        entries.push({ type: 'exact', number, text: valStr, key: number });
                    }
                }
            }
        }
    }
    
    if (entries.length > 0) {
        // Sort numerically
        entries.sort((a, b) => a.key - b.key);
        
        const filename = `${def.name}.md`;
        const filePath = path.join(outputDir, filename);
        
        let mdContent = `# ${def.title}\n`;
        mdContent += `*Table extraite de UNE NPC Generator.pdf*\n\n`;
        
        entries.forEach(entry => {
            if (entry.type === 'range') {
                mdContent += `${entry.min}-${entry.max}: ${entry.text}\n`;
            } else {
                mdContent += `${entry.number}: ${entry.text}\n`;
            }
        });
        
        fs.writeFileSync(filePath, mdContent, 'utf8');
        console.log(`Table extraite avec succès : ${filename} (${entries.length} entrées)`);
    } else {
        console.log(`Attention : Aucune entrée trouvée pour la table ${def.name}`);
    }
});
