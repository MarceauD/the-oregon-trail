const fs = require('fs');
const path = require('path');

const tablesDir = path.join(__dirname, 'tables');
const tableNameArg = process.argv[2];

// If no table name is provided, list available tables
if (!tableNameArg) {
    console.log("Usage: node roll_table.js <table_name>");
    console.log("\nTables disponibles :");
    if (fs.existsSync(tablesDir)) {
        const files = fs.readdirSync(tablesDir)
            .filter(f => f.endsWith('.md'))
            .map(f => f.replace('.md', ''));
        files.forEach(f => console.log(`- ${f}`));
    } else {
        console.log("Aucune table trouvée. Le dossier 'tools/tables' n'existe pas.");
    }
    process.exit(0);
}

const tableFilePath = path.join(tablesDir, `${tableNameArg}.md`);

if (!fs.existsSync(tableFilePath)) {
    console.log(`Erreur : La table '${tableNameArg}' n'existe pas dans ${tablesDir}.`);
    process.exit(1);
}

try {
    const content = fs.readFileSync(tableFilePath, 'utf8');
    const lines = content.split('\n');

    const rangedEntries = [];
    const exactEntries = [];
    const simpleListEntries = [];
    let maxRollValue = 0;

    // Parsers
    const rangeRegex = /^(\d+)-(\d+):\s*(.*)/;
    const exactRegex = /^(\d+):\s*(.*)/;
    const bulletListRegex = /^[-*+]\s*(.*)/;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('*')) {
            return; // Skip headers, comments and empty lines
        }

        // Try to match range (e.g., 1-10: Text)
        let match = trimmed.match(rangeRegex);
        if (match) {
            const min = parseInt(match[1], 10);
            const max = parseInt(match[2], 10);
            const text = match[3];
            rangedEntries.push({ min, max, text });
            if (max > maxRollValue) maxRollValue = max;
            return;
        }

        // Try to match exact index (e.g., 42: Text)
        match = trimmed.match(exactRegex);
        if (match) {
            const index = parseInt(match[1], 10);
            const text = match[2];
            exactEntries.push({ index, text });
            if (index > maxRollValue) maxRollValue = index;
            return;
        }

        // Try to match simple list (e.g., - Text)
        match = trimmed.match(bulletListRegex);
        if (match) {
            simpleListEntries.push(match[1]);
        }
    });

    console.log(`[TIRAGE DE TABLE - ${tableNameArg.toUpperCase()}]`);

    // Resolution logic
    if (rangedEntries.length > 0) {
        // Range table (e.g., D100 table)
        const roll = Math.floor(Math.random() * maxRollValue) + 1;
        const entry = rangedEntries.find(e => roll >= e.min && roll <= e.max);
        
        console.log(`Jet (1d${maxRollValue}) : ${roll}`);
        if (entry) {
            console.log(`Résultat : ${entry.text}`);
        } else {
            console.log("Aucune entrée correspondante trouvée pour ce jet.");
        }
    } else if (exactEntries.length > 0) {
        // Exact index table
        const roll = Math.floor(Math.random() * maxRollValue) + 1;
        const entry = exactEntries.find(e => e.index === roll);
        
        console.log(`Jet (1d${maxRollValue}) : ${roll}`);
        if (entry) {
            console.log(`Résultat : ${entry.text}`);
        } else {
            // Fallback: if there's a gap in exact indexes, pick the closest or notify
            console.log(`Aucune entrée avec l'index exact ${roll}.`);
        }
    } else if (simpleListEntries.length > 0) {
        // Uniform list choice
        const roll = Math.floor(Math.random() * simpleListEntries.length);
        console.log(`Sélection aléatoire (1 sur ${simpleListEntries.length}) : ${roll + 1}`);
        console.log(`Résultat : ${simpleListEntries[roll]}`);
    } else {
        console.log("Erreur : Aucun format de table valide détecté dans ce fichier. Assurez-vous d'avoir des lignes numérotées (ex: '1: Texte') ou des puces (ex: '- Texte').");
    }

} catch (err) {
    console.error("Erreur lors de la lecture du tirage :", err);
}
