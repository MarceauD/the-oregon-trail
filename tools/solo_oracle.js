const fs = require('fs');
const path = require('path');

const tablesDir = path.join(__dirname, 'tables');

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

function rollOnTable(tableName) {
    const searchArg = tableName.toLowerCase().trim().replace(/\\/g, '/').replace(/\.md$/, '');
    let foundTable = allTables.find(t => t.relPath.toLowerCase() === searchArg || t.basename.toLowerCase() === searchArg);
    
    if (!foundTable) {
        const matches = allTables.filter(t => t.relPath.toLowerCase().includes(searchArg) || t.basename.toLowerCase().includes(searchArg));
        if (matches.length > 0) foundTable = matches[0];
    }

    if (!foundTable) return { roll: 0, max: 0, text: `Table non trouvée (${tableName})` };

    try {
        const content = fs.readFileSync(foundTable.fullPath, 'utf8');
        const lines = content.split('\n');

        const entries = [];
        const simpleListEntries = [];
        let maxRollValue = 0;

        const rangeRegex = /^(\d+)-(\d+):\s*(.*)/;
        const exactRegex = /^(\d+):\s*(.*)/;
        const bulletListRegex = /^[-*+]\s*(.*)/;

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('*')) return;

            let match = trimmed.match(rangeRegex);
            if (match) {
                const min = parseInt(match[1], 10);
                const max = parseInt(match[2], 10);
                const text = match[3];
                entries.push({ min, max, text });
                if (max > maxRollValue) maxRollValue = max;
                return;
            }

            match = trimmed.match(exactRegex);
            if (match) {
                const index = parseInt(match[1], 10);
                const text = match[2];
                entries.push({ min: index, max: index, text });
                if (index > maxRollValue) maxRollValue = index;
                return;
            }

            match = trimmed.match(bulletListRegex);
            if (match) {
                simpleListEntries.push(match[1]);
            }
        });

        if (entries.length > 0) {
            const roll = Math.floor(Math.random() * maxRollValue) + 1;
            const entry = entries.find(e => roll >= e.min && roll <= e.max);
            return { roll, max: maxRollValue, text: entry ? entry.text : "Aucune entrée correspondante" };
        } else if (simpleListEntries.length > 0) {
            const roll = Math.floor(Math.random() * simpleListEntries.length);
            return { roll: roll + 1, max: simpleListEntries.length, text: simpleListEntries[roll] };
        }
    } catch (e) {
        return { roll: 0, max: 0, text: `Erreur de lecture: ${e.message}` };
    }
    return { roll: 0, max: 0, text: "Table vide ou format invalide" };
}

const modeArg = process.argv[2] ? process.argv[2].toLowerCase().trim() : '--help';

if (modeArg === '--help' || modeArg === '-h' || modeArg === 'help') {
    console.log("===================================================================");
    console.log("              SUPER-ORACLE JDR SOLO - SOLO_ORACLE.JS               ");
    console.log("===================================================================");
    console.log("\nUsage:");
    console.log("  node tools/solo_oracle.js <mode> [options]");
    console.log("\nModes disponibles:");
    console.log("  fate [probabilité] [chaos] : Question Fate Chart (ex: node tools/solo_oracle.js fate likely 5)");
    console.log("                               Tire automatiquement un Événement Aléatoire Mythic en cas de jet spécial !");
    console.log("  event                      : Tire un Événement Aléatoire complet (Focus + Action + Sujet + Atmosphère)");
    console.log("  npc                        : Génère un PNJ 19e complet (Identité + Trait + Disposition + Secret + Tenue + Chapeau)");
    console.log("  hazard                     : Génère une péripétie de voyage (Météo + Danger de la piste + Avarie de chariot)");
    console.log("  dilemma                    : Génère un dilemme moral et une complication sociale");
    console.log("  loot                       : Génère la fouille d'une malle, objets personnels et vivres");
    console.log("\nProbabilités valides pour 'fate':");
    console.log("  impossible, unlikely, 50/50 (défaut), likely, very likely, sure thing");
    console.log("===================================================================\n");
    process.exit(0);
}

if (modeArg === 'fate') {
    const oddsArg = process.argv[3] ? process.argv[3].toLowerCase() : '50/50';
    const chaosRank = process.argv[4] ? parseInt(process.argv[4], 10) : 5;

    const oddsTable = {
        'impossible': { target: 10, eYes: 2, eNo: 91 },
        'unlikely': { target: 35, eYes: 7, eNo: 88 },
        '50/50': { target: 50, eYes: 10, eNo: 91 },
        'likely': { target: 75, eYes: 15, eNo: 96 },
        'very likely': { target: 85, eYes: 17, eNo: 98 },
        'sure thing': { target: 95, eYes: 19, eNo: 100 }
    };

    const table = oddsTable[oddsArg] || oddsTable['50/50'];
    const roll = Math.floor(Math.random() * 100) + 1;

    const isDouble = (roll % 11 === 0);
    const isRandomEvent = isDouble && (roll <= chaosRank * 11);

    let answer = "";
    if (roll <= table.eYes) answer = "OUI EXCEPTIONNEL";
    else if (roll <= table.target) answer = "OUI";
    else if (roll >= table.eNo) answer = "NON EXCEPTIONNEL";
    else answer = "NON";

    console.log("===================================================================");
    console.log(`[FATE CHART MYTHIC - Probabilité: ${oddsArg.toUpperCase()} | Chaos: ${chaosRank}]`);
    console.log(`Jet (1d100) : ${roll}`);
    console.log(`Réponse     : ${answer}`);

    if (isRandomEvent) {
        console.log("\n⚡ [ÉVÉNEMENT ALÉATOIRE DÉCLENCHÉ !]");
        const focus = rollOnTable('oracle_mythic_event_focus');
        const action = rollOnTable('oracle_mythic_event_action');
        const subject = rollOnTable('oracle_mythic_event_subject');
        const atmos = rollOnTable('oracle_location_atmosphere');

        console.log(`- Focus d'Événement  : [${focus.roll}] ${focus.text}`);
        console.log(`- Action (Signification): [${action.roll}] ${action.text}`);
        console.log(`- Sujet  (Signification): [${subject.roll}] ${subject.text}`);
        console.log(`- Atmosphère du lieu   : [${atmos.roll}] ${atmos.text}`);
    }
    console.log("===================================================================");
}
else if (modeArg === 'event') {
    const focus = rollOnTable('oracle_mythic_event_focus');
    const action = rollOnTable('oracle_mythic_event_action');
    const subject = rollOnTable('oracle_mythic_event_subject');
    const atmos = rollOnTable('oracle_location_atmosphere');

    console.log("===================================================================");
    console.log("[GÉNÉRATION D'ÉVÉNEMENT ALÉATOIRE COMPLET]");
    console.log(`- Focus d'Événement     : [${focus.roll}] ${focus.text}`);
    console.log(`- Action (Signification)   : [${action.roll}] ${action.text}`);
    console.log(`- Sujet  (Signification)   : [${subject.roll}] ${subject.text}`);
    console.log(`- Atmosphère Sensorielle  : [${atmos.roll}] ${atmos.text}`);
    console.log("===================================================================");
}
else if (modeArg === 'npc') {
    const identity = rollOnTable('oracle_adventure_crafter_identity');
    const descriptor = rollOnTable('oracle_adventure_crafter_descriptors');
    const disposition = rollOnTable('oracle_npc_disposition');
    const trait = rollOnTable('oracle_npc_personality_traits');
    const secret = rollOnTable('oracle_npc_secrets');
    const clothing = rollOnTable('items_clothing_19th');
    const hat = rollOnTable('items_hats_19th');

    console.log("===================================================================");
    console.log("[PROFIL PNJ DU 19E SIÈCLE GÉNÉRÉ]");
    console.log(`- Identité / Rôle   : [${identity.roll}] ${identity.text}`);
    console.log(`- Descripteur       : [${descriptor.roll}] ${descriptor.text}`);
    console.log(`- Réaction Initiale : [${disposition.roll}] ${disposition.text}`);
    console.log(`- Trait de Caractère: [${trait.roll}] ${trait.text}`);
    console.log(`- Secret Dissimulé  : [${secret.roll}] ${secret.text}`);
    console.log(`- Tenue & Vêtements : [${clothing.roll}] ${clothing.text}`);
    console.log(`- Chapeau / Coiffe  : [${hat.roll}] ${hat.text}`);
    console.log("===================================================================");
}
else if (modeArg === 'hazard') {
    const weather = rollOnTable('events_weather_frontier');
    const hazard = rollOnTable('events_trail_hazards');
    const breakdown = rollOnTable('events_wagon_breakdowns');

    console.log("===================================================================");
    console.log("[PÉRIPÉTIE DE VOYAGE SUR LA PISTE]");
    console.log(`- Météo du jour      : [${weather.roll}] ${weather.text}`);
    console.log(`- Danger de la Piste  : [${hazard.roll}] ${hazard.text}`);
    console.log(`- Avarie du Chariot  : [${breakdown.roll}] ${breakdown.text}`);
    console.log("===================================================================");
}
else if (modeArg === 'dilemma') {
    const dilemma = rollOnTable('oracle_moral_dilemmas');
    const social = rollOnTable('oracle_social_complications');

    console.log("===================================================================");
    console.log("[CONFLIT DRAMATIQUE & DILEMME MORAL]");
    console.log(`- Dilemme Éthique    : [${dilemma.roll}] ${dilemma.text}`);
    console.log(`- Complication Sociale: [${social.roll}] ${social.text}`);
    console.log("===================================================================");
}
else if (modeArg === 'loot') {
    const trunk = rollOnTable('items_pioneer_trunk');
    const personal = rollOnTable('items_personal_effects');
    const food = rollOnTable('items_food_condition');

    console.log("===================================================================");
    console.log("[FOUILLE & MATÉRIEL RETROUVÉ]");
    console.log(`- Malle de Pionnier  : [${trunk.roll}] ${trunk.text}`);
    console.log(`- Objets Personnels  : [${personal.roll}] ${personal.text}`);
    console.log(`- État des Vivres    : [${food.roll}] ${food.text}`);
    console.log("===================================================================");
}
else {
    console.log(`Mode inconnu: '${modeArg}'. Utilisez 'node tools/solo_oracle.js --help' pour la liste des modes.`);
    process.exit(1);
}
