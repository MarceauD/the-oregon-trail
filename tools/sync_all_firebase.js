const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const keyPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(keyPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const saveFilePath = path.join(__dirname, '..', 'saves', 'eddy', 'save.txt');
const content = fs.readFileSync(saveFilePath, 'utf-8').replace(/\r/g, ''); // strip carriage returns

// Split by main sections
const partsOfFile = content.split('=== PERSONNAGES NON-JOUABLES ===');
if (partsOfFile.length < 2) {
    console.error("Could not find PERSONNAGES NON-JOUABLES section");
    process.exit(1);
}

const npcAndThreadsPart = partsOfFile[1];
const npcsSplit = npcAndThreadsPart.split('=== THREADS (INTRIGUES EN COURS) ===');
if (npcsSplit.length < 2) {
    console.error("Could not find THREADS (INTRIGUES EN COURS) section");
    process.exit(1);
}

const npcsText = npcsSplit[0].trim();
const threadsAndJournalPart = npcsSplit[1];

// Using === JOURNAL DE BORD === which is the actual header in the file
const threadsSplit = threadsAndJournalPart.split('=== JOURNAL DE BORD ===');
if (threadsSplit.length < 2) {
    console.error("Could not find JOURNAL DE BORD section");
    process.exit(1);
}

const threadsText = threadsSplit[0].trim();

// Parse NPCs
const npcBlocks = npcsText.split('---').map(b => b.trim()).filter(b => b.length > 0 && b.includes('ID:'));
const fileNpcs = [];

npcBlocks.forEach((block, blockIdx) => {
    const lines = block.split('\n');
    let npc = { faitsMarquants: '' };
    let currentField = '';
    let currentValue = '';

    function flushField() {
        if (currentField) {
            const val = currentValue.trim();
            if (currentField === 'id') {
                npc.id = isNaN(val) ? val : parseInt(val);
            } else if (currentField === 'faitsmarquants') {
                npc.faitsMarquants = val;
            } else if (currentField === 'image') {
                npc.img = val;
            } else if (currentField === 'nom') {
                npc.name = val;
            } else if (currentField === 'statut') {
                npc.status = val;
            } else if (currentField === 'description') {
                npc.description = val;
            } else {
                npc[currentField] = val;
            }
        }
    }

    lines.forEach(line => {
        const match = line.match(/^(ID|Nom|Statut|Description|Image|Faits marquants):(.*)/i);
        if (match) {
            flushField();
            const rawField = match[1].toLowerCase().replace(' ', '');
            currentField = rawField;
            currentValue = match[2];
        } else {
            currentValue += '\n' + line;
        }
    });
    flushField();

    if (npc.id) {
        fileNpcs.push(npc);
    }
});

// Parse Threads
const threadBlocks = threadsText.split('---').map(b => b.trim()).filter(b => b.length > 0 && b.includes('ID:'));
const fileThreads = [];

threadBlocks.forEach((block, blockIdx) => {
    const lines = block.split('\n');
    let thread = { events: [] };
    let currentField = '';
    let currentValue = '';

    function flushField() {
        if (currentField) {
            const val = currentValue.trim();
            if (currentField === 'id') {
                thread.id = parseInt(val);
            } else if (currentField === 'événements' || currentField === 'evenements' || currentField === 'events') {
                const eventLines = val.split('\n')
                    .map(l => l.trim().replace(/^-\s*/, ''))
                    .filter(l => l.length > 0);
                thread.events = eventLines;
            } else if (currentField === 'titre') {
                thread.title = val;
            } else if (currentField === 'statut') {
                thread.status = val;
            } else if (currentField === 'description') {
                thread.description = val;
            } else if (currentField === 'lieu') {
                thread.location = val;
            } else if (currentField === 'image') {
                thread.img = val;
            } else {
                thread[currentField] = val;
            }
        }
    }

    lines.forEach(line => {
        const match = line.match(/^(ID|Titre|Lieu|Statut|Description|Événements|Evenements|Image):(.*)/i);
        if (match) {
            flushField();
            const rawField = match[1].toLowerCase().replace('é', 'e');
            currentField = rawField;
            currentValue = match[2];
        } else {
            currentValue += '\n' + line;
        }
    });
    flushField();

    if (thread.id) {
        fileThreads.push(thread);
    }
});

console.log(`Parsed ${fileNpcs.length} NPCs and ${fileThreads.length} Threads from save.txt.`);

// Sync to Firestore
async function sync() {
    const docRef = db.collection('saves').doc('mainSave');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
        console.error("mainSave document not found in Firestore.");
        process.exit(1);
    }

    const data = docSnap.data();
    let dbNpcs = data.npcs || [];
    let dbThreads = data.threads || [];

    // Sync NPCs
    let npcsUpdatedCount = 0;
    let npcsAddedCount = 0;
    fileNpcs.forEach(fileNpc => {
        const idx = dbNpcs.findIndex(dbNpc => dbNpc.id === fileNpc.id);
        if (idx > -1) {
            // Update existing fields
            dbNpcs[idx] = { ...dbNpcs[idx], ...fileNpc };
            npcsUpdatedCount++;
        } else {
            // Add new NPC
            dbNpcs.push(fileNpc);
            npcsAddedCount++;
        }
    });

    // Sync Threads
    let threadsUpdatedCount = 0;
    let threadsAddedCount = 0;
    fileThreads.forEach(fileThread => {
        const idx = dbThreads.findIndex(dbThread => dbThread.id === fileThread.id);
        if (idx > -1) {
            // Update existing fields
            dbThreads[idx] = { ...dbThreads[idx], ...fileThread };
            threadsUpdatedCount++;
        } else {
            // Add new Thread
            dbThreads.push(fileThread);
            threadsAddedCount++;
        }
    });

    console.log(`Updating Firestore:`);
    console.log(`- NPCs: ${npcsUpdatedCount} updated, ${npcsAddedCount} added`);
    console.log(`- Threads: ${threadsUpdatedCount} updated, ${threadsAddedCount} added`);

    await docRef.update({
        npcs: dbNpcs,
        threads: dbThreads
    });

    console.log("Firestore successfully updated and synchronized!");
    process.exit(0);
}

sync().catch(err => {
    console.error("Error during sync:", err);
    process.exit(1);
});
