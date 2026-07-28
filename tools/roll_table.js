const fs = require('fs');
const path = require('path');

const tablesDir = path.join(__dirname, 'tables');
const tableNameArg = process.argv[2];

function getAllTableFiles(dir, baseDir = dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of list) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
            results = results.concat(getAllTableFiles(fullPath, baseDir));
        } else if (item.isFile() && item.name.endsWith('.md')) {
            const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
            const relWithoutExt = relPath.replace(/\.md$/, '');
            const basenameWithoutExt = path.basename(item.name, '.md');
            const category = path.dirname(relPath) === '.' ? 'général' : path.dirname(relPath);
            results.push({
                fullPath,
                relPath: relWithoutExt,
                basename: basenameWithoutExt,
                category
            });
        }
    }
    return results;
}

const allTables = getAllTableFiles(tablesDir);

const isHelp = !tableNameArg || tableNameArg === '--help' || tableNameArg === '-h' || tableNameArg === 'help';

// If no table name is provided or --help is requested, show usage and list available tables grouped by category
if (isHelp) {
    console.log("===================================================================");
    console.log("             TIRAGE DE TABLES ALÉATOIRES - ROLL_TABLE.JS           ");
    console.log("===================================================================");
    console.log("\nUsage:");
    console.log("  node tools/roll_table.js <nom_de_table>");
    console.log("  node tools/roll_table.js --help | -h");
    console.log("\nExemples de tirages:");
    console.log("  node tools/roll_table.js oracle_adventure_crafter_identity");
    console.log("  node tools/roll_table.js names/names_female_1");
    console.log("  node tools/roll_table.js oracles/oracle_mythic_event_focus");
    console.log("\nInformations:");
    console.log("  - Vous pouvez indiquer le chemin relatif (ex: 'oracles/oracle_une_focus') ou le nom court (ex: 'une_focus').");
    console.log("  - Le script effectue un jet automatique (1D100, 1D20, etc.) selon la structure de la table choisie.");

    console.log("\n===================================================================");
    console.log("                       TABLES DISPONIBLES                          ");
    console.log("===================================================================");

    if (allTables.length === 0) {
        console.log("Aucune table trouvée dans le dossier 'tools/tables'.");
        process.exit(0);
    }

    const categories = {};
    allTables.forEach(t => {
        if (!categories[t.category]) categories[t.category] = [];
        categories[t.category].push(t.relPath);
    });

    Object.keys(categories).sort().forEach(cat => {
        console.log(`\n[${cat.toUpperCase()}]`);
        categories[cat].sort().forEach(tName => {
            console.log(`  - ${tName}`);
        });
    });

    console.log("\n");
    process.exit(0);
}

// Find table matching argument
const searchArg = tableNameArg.toLowerCase().trim().replace(/\\/g, '/').replace(/\.md$/, '');
let foundTable = allTables.find(t => t.relPath.toLowerCase() === searchArg);

if (!foundTable) {
    foundTable = allTables.find(t => t.basename.toLowerCase() === searchArg);
}

if (!foundTable) {
    // Try partial match if unique
    const matches = allTables.filter(t => t.relPath.toLowerCase().includes(searchArg) || t.basename.toLowerCase().includes(searchArg));
    if (matches.length === 1) {
        foundTable = matches[0];
    } else if (matches.length > 1) {
        console.log(`Erreur : Plus d'une table correspond au terme '${tableNameArg}' :`);
        matches.forEach(m => console.log(`  - ${m.relPath}`));
        console.log("\nVeuillez préciser le sous-dossier (ex: node tools/roll_table.js " + matches[0].relPath + ")");
        process.exit(1);
    }
}

if (!foundTable) {
    console.log(`Erreur : La table '${tableNameArg}' n'existe pas dans le dossier tools/tables.`);
    console.log("Utilisez 'node tools/roll_table.js --help' pour afficher la liste des tables disponibles.");
    process.exit(1);
}

try {
    const content = fs.readFileSync(foundTable.fullPath, 'utf8');
    const lines = content.split('\n');

    const entries = [];
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
            entries.push({ min, max, text });
            if (max > maxRollValue) maxRollValue = max;
            return;
        }

        // Try to match exact index (e.g., 42: Text)
        match = trimmed.match(exactRegex);
        if (match) {
            const index = parseInt(match[1], 10);
            const text = match[2];
            entries.push({ min: index, max: index, text });
            if (index > maxRollValue) maxRollValue = index;
            return;
        }

        // Try to match simple list (e.g., - Text)
        match = trimmed.match(bulletListRegex);
        if (match) {
            simpleListEntries.push(match[1]);
        }
    });

    console.log(`[TIRAGE DE TABLE - ${foundTable.relPath.toUpperCase()}]`);

    // Resolution logic
    if (entries.length > 0) {
        const roll = Math.floor(Math.random() * maxRollValue) + 1;
        const entry = entries.find(e => roll >= e.min && roll <= e.max);

        console.log(`Jet (1d${maxRollValue}) : ${roll}`);
        if (entry) {
            console.log(`Résultat : ${entry.text}`);
        } else {
            console.log("Aucune entrée correspondante trouvée pour ce jet.");
        }
    } else if (simpleListEntries.length > 0) {
        // Uniform list choice
        const roll = Math.floor(Math.random() * simpleListEntries.length);
        console.log(`Sélection aléatoire (1 sur ${simpleListEntries.length}) : ${roll + 1}`);
        console.log(`Résultat : ${simpleListEntries[roll]}`);
    } else {
        console.log("Erreur : Aucun format de table valide détecté dans ce fichier.");
    }

} catch (err) {
    console.error("Erreur lors de la lecture du tirage :", err);
}
