const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Chargement de la clé d'API Firebase
const keyPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
    console.error("Erreur: Le fichier serviceAccountKey.json est manquant dans le dossier tools.");
    process.exit(1);
}
const serviceAccount = require(keyPath);

// 2. Initialisation Firebase
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 3. Arguments
const inputTarget = process.argv[2];
const customOutputPath = process.argv[3];

if (!inputTarget) {
    console.log("Usage: node tools/firebase_extractor.js <charName_or_saveId> [output_file_path]");
    process.exit(1);
}

// Décodage des entités HTML (accents français, ponctuation, etc.)
function decodeHtmlEntities(str) {
    if (!str) return '';
    const entities = {
        'amp': '&', 'lt': '<', 'gt': '>', 'quot': '"', 'apos': "'", 'nbsp': ' ',
        'mdash': '—', 'ndash': '–', 'ldquo': '“', 'rdquo': '”', 'lsquo': '‘', 'rsquo': '’',
        'laquo': '«', 'raquo': '»', 'hellip': '…',
        'eacute': 'é', 'egrave': 'è', 'agrave': 'à', 'ugrave': 'ù',
        'acirc': 'â', 'ecirc': 'ê', 'icirc': 'î', 'ocirc': 'ô', 'ucirc': 'û',
        'euml': 'ë', 'iuml': 'ï', 'uuml': 'ü', 'ccedil': 'ç', 'oelig': 'œ', 'aelig': 'æ',
        'Eacute': 'É', 'Egrave': 'È', 'Agrave': 'À', 'Ugrave': 'Ù',
        'Acirc': 'Â', 'Ecirc': 'Ê', 'Icirc': 'Î', 'Ocirc': 'Ô', 'Ucirc': 'Û',
        'Euml': 'Ë', 'Iuml': 'Ï', 'Uuml': 'Ü', 'Ccedil': 'Ç', 'Oelig': 'Œ', 'Aelig': 'Æ'
    };
    let decoded = str.replace(/&([a-zA-Z0-9]+);/g, (match, name) => {
        return entities[name] || match;
    });
    decoded = decoded.replace(/&#([0-9]+);/g, (match, dec) => {
        return String.fromCharCode(parseInt(dec, 10));
    });
    decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
    });
    return decoded;
}

// Nettoyage de l'HTML pour le journal
function stripHtml(html) {
    if (!html) return "";
    let text = html;
    text = text.replace(/<br\s*\/?>/gi, "\n");
    text = text.replace(/<\/p>/gi, "\n\n");
    text = text.replace(/<\/li>/gi, "\n");
    text = text.replace(/<[^>]+>/g, "");
    
    // Décodage complet des entités
    text = decodeHtmlEntities(text);

    // Nettoyage des espaces et lignes vides
    text = text.split('\n').map(line => line.trim()).join('\n');
    text = text.replace(/\n{3,}/g, "\n\n");
    return text.trim();
}

// Formatage de la date YYYY-MM-DD en français sans décalage de timezone
function formatDateFrench(dateStr) {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const monthNames = [
        "janvier", "février", "mars", "avril", "mai", "juin",
        "juillet", "août", "septembre", "octobre", "novembre", "décembre"
    ];
    return `${day} ${monthNames[monthIndex]} ${year}`;
}

async function run() {
    try {
        // Chargement du schéma et des mappings
        const schemaPath = path.join(__dirname, '..', '.agent', 'firebase_schema.json');
        let saveId = inputTarget;
        let charFolder = null;

        if (fs.existsSync(schemaPath)) {
            const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
            const mappings = schema.save_mappings || {};
            
            // Recherche insensible à la casse
            const matchedKey = Object.keys(mappings).find(
                key => key.toLowerCase() === inputTarget.toLowerCase()
            );
            if (matchedKey) {
                saveId = mappings[matchedKey];
                charFolder = matchedKey.toLowerCase();
                console.log(`Personnage [${matchedKey}] mappé vers le Save ID Firebase [${saveId}].`);
            }
        }

        console.log(`Récupération de la sauvegarde [${saveId}] depuis Firestore...`);
        const docRef = db.collection('saves').doc(saveId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.error(`Erreur: La sauvegarde [${saveId}] n'existe pas.`);
            process.exit(1);
        }

        const state = docSnap.data();
        let output = '';
        const separator = '\n' + '='.repeat(40) + '\n\n';

        // 1. CHARACTER
        const char = state.character || {};
        output += '=== FICHE DE PERSONNAGE ===\n\n';
        const id = char.identityFields || {};
        output += `--- IDENTITÉ ---\n`;
        output += `Nom : ${id.name || 'N/A'}\n`;
        output += `Âge : ${id.age || 'N/A'}\n`;
        output += `Origine : ${id.origin || 'N/A'}\n`;
        output += `Profession : ${id.profession || 'N/A'}\n`;
        if (char.portrait) output += `Portrait : ${char.portrait}\n`;
        output += '\n';

        output += `--- HISTOIRE ---\n${char.history || 'Aucune histoire rédigée.'}\n\n`;
        output += `--- ÉCONOMIE ---\nMonnaie : $${(char.money || 0).toFixed(2)}\n\n`;

        output += '--- STATISTIQUES ---\n';
        (char.stats || []).forEach(s => { output += `${s.name}: ${s.value}\n`; });

        output += '\n--- COMPÉTENCES ---\n';
        (char.skills || []).forEach(s => { output += `${s.name}: ${s.value}\n`; });

        output += '\n--- POINTS FORTS ---\n';
        (char.strengths || []).forEach(s => { output += `- ${s.text || s.name || 'N/A'}\n`; });

        output += '\n--- POINTS FAIBLES ---\n';
        (char.weaknesses || []).forEach(w => { output += `- ${w.text || w.name || 'N/A'}\n`; });

        output += '\n--- INVENTAIRE ---\n';
        const inventory = char.inventory || {};
        for (const category in inventory) {
            if (inventory[category] && inventory[category].length > 0) {
                output += `\n> ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;
                inventory[category].forEach(item => { output += `- ${item.name || item.text}\n`; });
            }
        }

        output += '\n--- SAVOIRS SPÉCIFIQUES ---\n';
        (char.specificKnowledge || []).forEach(m => { output += `- ${m.name}${m.description ? ' (' + m.description + ')' : ''}\n`; });

        output += '\n--- ÉTAT PHYSIQUE ---\n';
        (char.physicalState || []).forEach(s => { output += `- ${s.name || 'Inconnu'} (Depuis: ${s.duration || '?'}, Soins: ${s.care || 'aucun'}, Effets: ${s.effects || 'aucun'})\n`; });

        output += '\n--- SANTÉ MENTALE ---\n';
        (char.mentalState || []).forEach(s => { output += `- ${s.name || 'Inconnu'} (Depuis: ${s.duration || '?'}, Soins: ${s.care || 'aucun'}, Effets: ${s.effects || 'aucun'})\n`; });

        if (char.plotNotes && char.plotNotes.length > 0) {
            output += '\n--- NOTES & IDÉES ---\n';
            char.plotNotes.forEach(n => { output += `[${n.done ? 'x' : ' '}] ${n.text}\n`; });
        }

        output += separator;

        // 2. NPCs
        output += '=== PERSONNAGES NON-JOUABLES ===\n\n';
        (state.npcs || []).forEach(npc => {
            let statusText = (npc.status || '').replace(/-/g, ' ');
            output += `ID: ${npc.id}\nNom: ${npc.name}\nStatut: ${statusText}\nDescription: ${npc.description}\n`;
            if (npc.img) output += `Image: ${npc.img}\n`;
            if (npc.faitsMarquants) output += `Faits marquants: ${npc.faitsMarquants}\n`;
            output += '---\n';
        });
        
        output += separator;

        // 3. THREADS
        output += '=== THREADS (INTRIGUES EN COURS) ===\n\n';
        (state.threads || []).forEach(thread => {
            let statusText = (thread.status || '').replace(/-/g, ' ');
            output += `ID: ${thread.id}\nTitre: ${thread.title}\nLieu: ${thread.location}\nStatut: ${statusText}\nDescription: ${thread.description}\n`;
            if (thread.img) output += `Image: ${thread.img}\n`;
            if (thread.events && thread.events.length > 0) {
                output += `Événements:\n${thread.events.map(e => `- ${e}`).join('\n')}\n`;
            }
            output += '---\n';
        });

        output += separator;

        // 4. MAP ROUTE
        output += '=== ITINÉRAIRE (CARTE) ===\n\n';
        const route = state.route || [];
        if (route.length > 0) {
            route.forEach((point, index) => {
                output += `${index + 1}. ${point.city || 'Étape'} (${point.type || 'Inconnu'})\n`;
            });
        } else {
            output += 'Aucun itinéraire tracé.\n';
        }

        output += separator;

        // 5. JOURNAL
        output += '=== JOURNAL DE BORD ===\n\n';
        let journal = state.journal || [];

        const journalSnap = await docRef.collection('journal_entries').get();
        if (!journalSnap.empty) {
            let subCollectionJournal = [];
            journalSnap.forEach(d => subCollectionJournal.push(d.data()));
            journal = subCollectionJournal;
        }

        const sortedJournal = [...journal].sort((a, b) => new Date(a.date) - new Date(b.date));
        sortedJournal.forEach(item => {
            const formattedDate = formatDateFrench(item.date);
            const plainTextEntry = stripHtml(item.entry);
            output += `Date: ${formattedDate}\n${plainTextEntry}\n\n`;
        });

        // 6. Écriture / Sortie
        let finalPath = customOutputPath;
        if (!finalPath && charFolder) {
            finalPath = path.join(__dirname, '..', 'saves', charFolder, 'save.txt');
        }

        if (finalPath) {
            const dir = path.dirname(finalPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(finalPath, output, 'utf-8');
            console.log(`Extraction réussie ! Sauvegarde enregistrée dans : ${finalPath}`);
        } else {
            console.log("=== DÉBUT DE L'EXTRACTION ===");
            console.log(output);
            console.log("=== FIN DE L'EXTRACTION ===");
        }

    } catch (e) {
        console.error("Erreur lors de l'extraction Firebase :", e);
    } finally {
        process.exit(0);
    }
}

run();
