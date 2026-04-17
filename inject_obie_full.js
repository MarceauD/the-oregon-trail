
const admin = require('firebase-admin');

// Remplacez par le chemin vers votre clé de service Firebase
const serviceAccount = require('e:/Tri Selectif/Programmation/the-oregon-trail/serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

const fullJournalEntry = `<h3>7 Juillet 1868 – Harrisburg, Pennsylvanie</h3>
<div class="journal-full-text">
${require('fs').readFileSync('/tmp/obie_journal_json.txt', 'utf8').slice(1, -1).replace(/\\n/g, '<br>').replace(/\\"/g, '"')}
</div>`;

async function injectFullObie() {
    const obieData = {
        character: {
            identityFields: {
                name: "Obadiah Vesper",
                age: "26",
                origin: "Cape May, New Jersey",
                profession: "Télégraphiste / Ancien Gardien de Phare"
            },
            portrait: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&auto=format&fit=crop",
            stats: [
                { id: "intel", name: "Intelligence", value: 85 },
                { id: "percep", name: "Perperception", value: 90 },
                { id: "agil", name: "Agilité", value: 60 },
                { id: "force", name: "Force", value: 45 },
                { id: "charisme", name: "Charisme", value: 55 }
            ],
            skills: [
                { id: "code", name: "Code Morse", value: 95 },
                { id: "repair", name: "Réparation Électrique", value: 80 },
                { id: "survival", name: "Survie en Mer", value: 70 },
                { id: "tech", name: "Technologie", value: 85 }
            ],
            traits: [
                { id: "signal", name: "Sens du Signal", description: "Perçoit les vibrations électromagnétiques." },
                { id: "silent", name: "Silencieux", description: "Habitué à la solitude des phares." }
            ],
            inventory: {
                firearms: [
                    { id: 1, name: "Revolver Remington 1858", quantity: 1, type: "Arme" }
                ],
                clothing: [
                    { id: 2, name: "Veste de télégraphiste usée", quantity: 1, type: "Vêtement" },
                    { id: 3, name: "Chapeau melon poussiéreux", quantity: 1, type: "Vêtement" }
                ],
                companions: [
                    { id: 4, name: "Tesla (Corbeau apprivoisé)", quantity: 1, type: "Compagnon" }
                ],
                general: [
                    { id: 5, name: "Manipulateur Morse portatif", quantity: 1, type: "Outil" },
                    { id: 6, name: "Batteries de rechange", quantity: 3, type: "Consommable" },
                    { id: 7, name: "Carnet de notes chiffrées", quantity: 1, type: "Objet unique" }
                ]
            },
            money: 125,
            health: 100,
            stamina: 80
        },
        npcs: [
            { id: 1, name: "Silas Thorne", role: "Chef de station corrompu", description: "Un homme dur qui en sait trop sur le Signal." },
            { id: 2, name: "Elias Vesper", role: "Père disparu", description: "Ancien gardien de phare, source du mystère." }
        ],
        threads: [
            { id: 1, title: "Le Signal Silencieux", status: "Active", description: "Suivre la fréquence mystérieuse vers l'Oregon." }
        ],
        journal: [
            {
                id: 1101,
                date: "1868-07-07",
                entry: fullJournalEntry
            }
        ],
        settings: {
            theme: "charcoal",
            fontSize: "medium"
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // Injecter dans les deux collections possibles pour être sûr
    console.log("Injection de la campagne Obadiah Vesper (Full Journal)...");
    await db.collection('saves').doc('save_obie_vesper').set(obieData);
    await db.collection('campaigns').doc('campaign_obadiah_vesper').set({
        id: "campaign_obadiah_vesper",
        name: "Obadiah Vesper",
        portrait: obieData.character.portrait,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    // Mettre à jour la liste des campagnes globale si nécessaire
    const listDoc = db.collection('settings').doc('campaignsList');
    const doc = await listDoc.get();
    let list = doc.exists ? doc.data().list || [] : [];

    if (!list.find(c => c.id === 'save_obie_vesper')) {
        list.push({
            id: 'save_obie_vesper',
            name: 'Obadiah Vesper',
            portrait: obieData.character.portrait
        });
        await listDoc.set({ list });
    }

    console.log("Injection terminée avec succès !");
    process.exit(0);
}

injectFullObie().catch(err => {
    console.error(err);
    process.exit(1);
});
