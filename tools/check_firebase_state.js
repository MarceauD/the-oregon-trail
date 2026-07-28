const admin = require('firebase-admin');
const path = require('path');
const keyPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(keyPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkFirebase() {
    const docSnap = await db.collection('saves').doc('mainSave').get();
    if (docSnap.exists) {
        const data = docSnap.data();
        
        console.log("=== MONEY ===");
        console.log(data.character ? data.character.money : "No character data");

        console.log("=== PHYSICAL & MENTAL STATE ===");
        console.log("Physical:", JSON.stringify(data.character ? data.character.physicalState : null, null, 2));
        console.log("Mental:", JSON.stringify(data.character ? data.character.mentalState : null, null, 2));

        console.log("=== STATS & SKILLS & KNOWLEDGE ===");
        console.log("Stats:", JSON.stringify(data.character ? data.character.stats : null, null, 2));
        console.log("Skills:", JSON.stringify(data.character ? data.character.skills : null, null, 2));

        console.log("=== INVENTORY ===");
        console.log("Inventory:", JSON.stringify(data.character ? data.character.inventory : null, null, 2));

        console.log("=== RECENT JOURNAL DATES ===");
        if (data.journal) {
            console.log(data.journal.slice(0, 5).map(j => ({ date: j.date, entryLength: j.entry.length })));
        } else {
            console.log("No journal");
        }

        console.log("=== DR RUSSELL IN NPCS? ===");
        if (data.npcs) {
            const dr = data.npcs.find(n => n.name.includes("Russell") || n.id.includes("russell"));
            console.log(dr ? JSON.stringify(dr, null, 2) : "Dr Russell not found in npcs");
        }

        console.log("=== INTRIGUES / THREADS ===");
        if (data.threads) {
            console.log(data.threads.map(t => ({ id: t.id, title: t.title, status: t.status })));
        }
    } else {
        console.log("Save 'mainSave' not found");
    }
    process.exit(0);
}

checkFirebase();
