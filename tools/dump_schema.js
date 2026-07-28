const admin = require('firebase-admin');
const path = require('path');
const keyPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = require(keyPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function dumpSchema() {
    const docSnap = await db.collection('saves').doc('mainSave').get();
    if (docSnap.exists) {
        const data = docSnap.data();
        console.log("=== FIRST NPC IN FIRESTORE ===");
        console.log(JSON.stringify(data.npcs ? data.npcs[0] : null, null, 2));
        console.log("=== FIRST THREAD IN FIRESTORE ===");
        console.log(JSON.stringify(data.threads ? data.threads[0] : null, null, 2));
    } else {
        console.log("Save not found");
    }
    process.exit(0);
}

dumpSchema();
