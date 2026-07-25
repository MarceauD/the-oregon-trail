const admin = require('firebase-admin');
const fs = require('fs');

const path = require('path');
const keyPath = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
    console.error("Erreur: Le fichier serviceAccountKey.json est manquant.");
    process.exit(1);
}

const serviceAccount = require(keyPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const saveId = process.argv[2];
const updateJsonPath = process.argv[3];

if (!saveId || !updateJsonPath) {
    console.log("Usage: node firebase_updater.js <saveId> <update.json>");
    process.exit(1);
}

const updateData = JSON.parse(fs.readFileSync(updateJsonPath, 'utf-8'));

async function updateFirebase() {
    try {
        const docRef = db.collection('saves').doc(saveId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.error(`Erreur: La sauvegarde [${saveId}] n'existe pas.`);
            process.exit(1);
        }

        const state = docSnap.data();
        const updates = {};

        // 1. Mise à jour du Journal
        if (updateData.journal_entry) {
            const journalCollRef = docRef.collection('journal_entries');
            const journalSnap = await journalCollRef.get();
            let journalArray = [];

            if (!journalSnap.empty) {
                journalSnap.forEach(d => journalArray.push(d.data()));
            } else if (state.journal && Array.isArray(state.journal)) {
                journalArray = state.journal;
            }

            // Rechercher si une entrée existe déjà pour cette date
            const existingIdx = journalArray.findIndex(j => j.date === updateData.journal_entry.date);

            let targetEntry;
            if (existingIdx > -1) {
                // On ajoute à la suite de l'entrée existante
                journalArray[existingIdx].entry += "<br><br>" + updateData.journal_entry.entry;
                targetEntry = journalArray[existingIdx];
                console.log(`Journal [${updateData.journal_entry.date}] : Contenu ajouté à l'entrée existante.`);
            } else {
                // Nouvelle entrée
                targetEntry = {
                    id: Date.now(),
                    ...updateData.journal_entry
                };
                journalArray.unshift(targetEntry);
                console.log(`Journal [${updateData.journal_entry.date}] : Nouvelle entrée créée.`);
            }

            if (!targetEntry.id) targetEntry.id = Date.now();

            // Écriture directe de l'entrée spécifique dans la sous-collection Firestore
            await journalCollRef.doc(String(targetEntry.id)).set(targetEntry, { merge: true });

            // Purger l'ancien champ 'journal' du document principal
            if (state.journal) {
                updates.journal = admin.firestore.FieldValue.delete();
            }
        }

        // 2. Mise à jour des PNJs
        if (updateData.npcs && Array.isArray(updateData.npcs)) {
            let npcsArray = state.npcs || [];
            updateData.npcs.forEach(newNpc => {
                const idx = npcsArray.findIndex(n => n.name === newNpc.name || n.id === newNpc.id);
                if (idx > -1) {
                    // Smart merge pour faitsMarquants si c'est une chaîne
                    if (newNpc.faitsMarquants && npcsArray[idx].faitsMarquants) {
                        newNpc.faitsMarquants = npcsArray[idx].faitsMarquants + " | " + newNpc.faitsMarquants;
                    }
                    npcsArray[idx] = { ...npcsArray[idx], ...newNpc };
                } else {
                    if (!newNpc.id) newNpc.id = Date.now() + Math.floor(Math.random() * 1000);
                    npcsArray.push(newNpc);
                }
            });
            updates.npcs = npcsArray;
        }

        // 3. Mise à jour des Threads
        if (updateData.threads && Array.isArray(updateData.threads)) {
            let threadsArray = state.threads || [];
            updateData.threads.forEach(newThread => {
                const idx = threadsArray.findIndex(t => t.title === newThread.title || t.id === newThread.id);
                if (idx > -1) {
                    // Smart merge pour les events (tableau)
                    if (newThread.events && Array.isArray(newThread.events)) {
                        let mergedEvents = [...(threadsArray[idx].events || []), ...newThread.events];
                        newThread.events = [...new Set(mergedEvents)]; // Déduplication
                    }
                    threadsArray[idx] = { ...threadsArray[idx], ...newThread };
                } else {
                    if (!newThread.id) newThread.id = Date.now() + Math.floor(Math.random() * 1000);
                    threadsArray.push(newThread);
                }
            });
            updates.threads = threadsArray;
        }

        // 4. Champs du Personnage (argent, santé, stats modifiées, etc.)
        if (updateData.character) {
            function deepMerge(target, source) {
                Object.keys(source).forEach(key => {
                    const sourceValue = source[key];
                    const targetValue = target[key];

                    if (Array.isArray(sourceValue)) {
                        let existingArray = targetValue || [];
                        sourceValue.forEach(newItem => {
                            const idx = existingArray.findIndex(old =>
                                (old.id && old.id === newItem.id) ||
                                (old.name && old.name === newItem.name) ||
                                (old.text && old.text === newItem.text)
                            );
                            if (idx > -1) {
                                if (newItem._delete) {
                                    existingArray.splice(idx, 1);
                                    console.log(`Élément supprimé de l'inventaire/base : ${newItem.text || newItem.name || newItem.id}`);
                                } else {
                                    existingArray[idx] = deepMerge(existingArray[idx] || {}, newItem);
                                }
                            } else if (!newItem._delete) {
                                existingArray.push(newItem);
                            }
                        });
                        target[key] = existingArray;
                    } else if (typeof sourceValue === 'object' && sourceValue !== null) {
                        target[key] = deepMerge(targetValue || {}, sourceValue);
                    } else {
                        target[key] = sourceValue;
                    }
                });
                return target;
            }

            state.character = deepMerge(state.character || {}, updateData.character);
            updates.character = state.character;
        }

        if (Object.keys(updates).length > 0) {
            await docRef.update(updates);
            console.log(`Données Firebase mises à jour avec succès pour la save [${saveId}].`);
        } else {
            console.log("Aucune mise à jour détectée dans le fichier JSON.");
        }

    } catch (e) {
        console.error("Erreur lors de la mise à jour Firebase:", e);
    } finally {
        process.exit(0);
    }
}

updateFirebase();
