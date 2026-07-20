const firebaseConfig = {
    apiKey: "AIzaSyCx9A30knmNxaOpm9XNTD7zLKSFop9cJFg",
    authDomain: "the-oregon-trail-f6892.firebaseapp.com",
    projectId: "the-oregon-trail-f6892",
    storageBucket: "the-oregon-trail-f6892.firebasestorage.app",
    messagingSenderId: "180682046262",
    appId: "1:180682046262:web:bb6ce086568bae31e0d197"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Configuration Cloudinary
const CLOUDINARY_CONFIG = {
    cloudName: "dg64n9fhe",
    uploadPreset: "us_preset"
};

let cloudGallery = [];

const ENCODED_CODE = "MS0tLThfXzYqOA=="; // "1---8__6*8"
let isReadOnly = (localStorage.getItem('oregon_admin_authorized') !== 'true');
let isPublicView = false;

// Gestion des paramètres d'URL pour le partage public
const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get('story') || urlParams.get('id');

if (storyId) {
    localStorage.setItem('oregon_current_save_id', storyId);
    isReadOnly = true;
    isPublicView = true;
    console.log("Mode partage public activé pour le thread :", storyId);
}

async function syncCloudGallery(force = false) {
    if (!force) {
        const cached = localStorage.getItem('oregon_cloud_gallery');
        const lastSync = localStorage.getItem('oregon_gallery_last_sync');
        const now = Date.now();

        if (cached && lastSync && (now - parseInt(lastSync) < 3600000)) {
            cloudGallery = JSON.parse(cached);
            console.log("Galerie chargée depuis le cache (", cloudGallery.length, "images).");
            return;
        }
    }

    try {
        console.log("Synchronisation de la galerie avec Firebase...");
        const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
        cloudGallery = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        localStorage.setItem('oregon_cloud_gallery', JSON.stringify(cloudGallery));
        localStorage.setItem('oregon_gallery_last_sync', Date.now().toString());
        console.log("Galerie Cloud synchronisée :", cloudGallery.length, "images.");
    } catch (error) {
        console.error("Erreur lors de la synchronisation de la galerie Cloud :", error);
    }
}

function loadGalleryFromCache() {
    const cached = localStorage.getItem('oregon_cloud_gallery');
    if (cached) {
        cloudGallery = JSON.parse(cached);
        console.log("Galerie extraite du cache local.");
    }
}

let currentSaveId = localStorage.getItem('oregon_current_save_id') || 'mainSave';
let campaignsList = JSON.parse(localStorage.getItem('oregon_campaigns_list')) || [{ id: 'mainSave', name: 'Campagne Principale' }];

function getSaveDocRef() {
    return db.collection('saves').doc(currentSaveId);
}

function getJournalEntriesCollectionRef(saveId = currentSaveId) {
    return db.collection('saves').doc(saveId).collection('journal_entries');
}

/**
 * Sauvegarde d'une seule entrée de journal dans la sous-collection Firestore pour éviter la limite de 1 MB
 */
window.saveSingleJournalEntry = async function (entryData) {
    if (isReadOnly || !entryData || !entryData.id) return;

    // 1. Mise à jour locale dans gameState.journal
    const idx = gameState.journal.findIndex(j => String(j.id) === String(entryData.id));
    if (idx > -1) {
        gameState.journal[idx] = { ...gameState.journal[idx], ...entryData };
    } else {
        gameState.journal.unshift(entryData);
    }

    // 2. Diffusion aux autres onglets ouverts
    syncChannel.postMessage({
        type: 'JOURNAL_ENTRY_UPDATE',
        entry: entryData,
        campaignId: currentSaveId
    });

    // 3. Sauvegarde directe dans la sous-collection Firestore (quelques ko par entrée)
    try {
        await getJournalEntriesCollectionRef().doc(String(entryData.id)).set(entryData, { merge: true });
    } catch (error) {
        console.error(`Erreur lors de la sauvegarde de l'entrée journal ${entryData.id}:`, error);
        throw error;
    }
};

/**
 * Suppression d'une entrée de journal dans la sous-collection Firestore
 */
window.deleteSingleJournalEntry = async function (entryId) {
    if (isReadOnly || !entryId) return;

    gameState.journal = gameState.journal.filter(j => String(j.id) !== String(entryId));

    syncChannel.postMessage({
        type: 'JOURNAL_ENTRY_DELETE',
        entryId,
        campaignId: currentSaveId
    });

    try {
        await getJournalEntriesCollectionRef().doc(String(entryId)).delete();
    } catch (error) {
        console.error(`Erreur lors de la suppression de l'entrée journal ${entryId}:`, error);
    }
};

/**
 * Mise à jour locale d'un objet imbriqué via un chemin en notation pointée (ex: "character.money")
 */
function setDeepValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
}

// Canal de synchronisation entre onglets
const syncChannel = new BroadcastChannel('oregon_trail_sync');

syncChannel.onmessage = (event) => {
    const { type, path, value, entry, entryId, campaignId } = event.data;
    // On ne traite le message que si c'est la même campagne que l'onglet actuel
    if (campaignId === currentSaveId) {
        if (type === 'STATE_UPDATE') {
            console.log(`[Sync] Mise à jour reçue d'un autre onglet : ${path} =`, value);
            setDeepValue(gameState, path, value);
            if (typeof renderAll === 'function') renderAll();
        } else if (type === 'JOURNAL_ENTRY_UPDATE' && entry) {
            const idx = gameState.journal.findIndex(j => String(j.id) === String(entry.id));
            if (idx > -1) {
                gameState.journal[idx] = { ...gameState.journal[idx], ...entry };
            } else {
                gameState.journal.unshift(entry);
            }
            if (typeof renderJournal === 'function') renderJournal();
        } else if (type === 'JOURNAL_ENTRY_DELETE' && entryId) {
            gameState.journal = gameState.journal.filter(j => String(j.id) !== String(entryId));
            if (typeof renderJournal === 'function') renderJournal();
        }
    }
};

/**
 * Sauvegarde chirurgicale d'un champ précis sur Firebase et diffusion aux autres onglets
 * @param {string} path - Chemin en notation pointée (ex: "character.money")
 * @param {any} value - Nouvelle valeur
 */
window.savePartialData = async function (path, value) {
    if (isReadOnly) return;

    if (path === 'journal') {
        gameState.journal = value;
        if (Array.isArray(value)) {
            for (const item of value) {
                if (item && item.id) {
                    await saveSingleJournalEntry(item);
                }
            }
        }
        return;
    }

    // 1. Mise à jour locale immédiate
    setDeepValue(gameState, path, value);

    // 2. Diffusion aux autres onglets ouverts
    syncChannel.postMessage({
        type: 'STATE_UPDATE',
        path,
        value,
        campaignId: currentSaveId
    });

    // 3. Sauvegarde sur Firebase via .update() (notation pointée gérée nativement)
    try {
        await getSaveDocRef().update({ [path]: value });
    } catch (error) {
        console.error(`Erreur lors de la mise à jour partielle (${path}):`, error);
        // Fallback sur set merge si le document n'accepte pas l'update (ex: inexistant)
        const stateCopy = { ...gameState };
        delete stateCopy.journal;
        await getSaveDocRef().set(stateCopy, { merge: true });
    }
};

const defaultState = {
    character: {
        portrait: "https://res.cloudinary.com/dg64n9fhe/image/upload/w_300,c_scale,f_auto,q_auto/v1776178797/f9zhxf8orfqhkjmu5b8p.jpg",
        money: 0.00,
        identityFields: {
            name: "Nouveau Voyageur",
            age: "Âge",
            origin: "Origine",
            profession: "Profession"
        },
        history: "L'histoire de votre personnage...",
        stats: [
            { id: 1, name: "Force", value: 50 },
            { id: 2, name: "Endurance", value: 50 },
            { id: 3, name: "Charisme", value: 50 },
            { id: 4, name: "Connaissances", value: 50 },
            { id: 5, name: "Combat", value: 50 },
            { id: 6, name: "Perception", value: 50 },
            { id: 7, name: "Persuasion", value: 50 },
            { id: 8, name: "Survie", value: 50 },
            { id: 9, name: "Agilité", value: 50 },
            { id: 10, name: "Discrétion", value: 50 },
            { id: 11, name: "Dextérité", value: 50 },
        ],
        skills: [],
        specificKnowledge: [],
        physicalState: [],
        mentalState: [],
        strengths: [],
        weaknesses: [],
        inventory: {
            firearms: [],
            clothing: [],
            companions: [],
            general: []
        },
        plotNotes: [] // Liste d'idées de scénario
    },
    npcs: [],
    threads: [],
    journal: [],
    route: []
};

let gameState = {};

const imageGalleryList = [];


let lastSavedSettings = null; // Pour éviter les sauvegardes redondantes des réglages

async function saveGameData() {
    // Update metadata for this campaign before saving
    const currentIdx = campaignsList.findIndex(c => c.id === currentSaveId);
    if (currentIdx !== -1) {
        if (gameState.character && gameState.character.identityFields) {
            campaignsList[currentIdx].name = gameState.character.identityFields.name || 'Inconnu';
        }
        if (gameState.character && gameState.character.portrait) {
            campaignsList[currentIdx].portrait = gameState.character.portrait;
        }
    }

    if (isReadOnly) {
        console.warn("Tentative de sauvegarde bloquée : mode lecture seule actif.");
        return;
    }

    // 1. Sauvegarde des entrées de journal dans la sous-collection journal_entries
    if (gameState.journal && Array.isArray(gameState.journal) && gameState.journal.length > 0) {
        const journalCollRef = getJournalEntriesCollectionRef();
        for (const item of gameState.journal) {
            if (item && item.id) {
                await journalCollRef.doc(String(item.id)).set(item, { merge: true });
            }
        }
    }

    // 2. Sauvegarde du document principal sans le tableau journal lourd
    const stateToSave = { ...gameState };
    delete stateToSave.journal;

    await getSaveDocRef().set(stateToSave, { merge: true });

    // Purger aussi l'ancien champ 'journal' s'il existait sur le document principal
    try {
        await getSaveDocRef().update({ journal: firebase.firestore.FieldValue.delete() });
    } catch (e) {
        // Ignorer si le champ n'existait pas
    }

    console.log(`Partie [${currentSaveId}] sauvegardée sur Firebase !`);

    // Mise à jour de l'index global des campagnes (nom, portrait, date)
    if (currentIdx !== -1) {
        const campaignMeta = campaignsList[currentIdx];
        await db.collection('campaigns').doc(currentSaveId).set({
            ...campaignMeta,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    // Sauvegarde des réglages personnels de l'utilisateur (uniquement l'ID de la session en cours)
    if (auth.currentUser) {
        const settingsToSave = {
            currentSaveId: currentSaveId
        };

        const settingsStr = JSON.stringify(settingsToSave);
        if (settingsStr !== lastSavedSettings) {
            await db.collection('settings').doc(auth.currentUser.uid).set(settingsToSave, { merge: true });
            lastSavedSettings = settingsStr;
            console.log("Session active mise à jour sur Firebase.");
        }
    }
    localStorage.setItem('oregon_campaigns_list', JSON.stringify(campaignsList));
}

async function loadGameData() {
    // 1. Récupération de la session active de l'utilisateur (uniquement si on n'est pas en vue publique via URL)
    if (auth.currentUser && !isPublicView) {
        try {
            const settingsDoc = await db.collection('settings').doc(auth.currentUser.uid).get();
            if (settingsDoc.exists) {
                const settings = settingsDoc.data();
                if (settings.currentSaveId) {
                    currentSaveId = settings.currentSaveId;
                    localStorage.setItem('oregon_current_save_id', currentSaveId);
                }
                lastSavedSettings = JSON.stringify({
                    currentSaveId: currentSaveId
                });
            }
        } catch (e) {
            console.warn("Erreur chargement settings user :", e);
        }
    }

    // 2. Récupération du document de sauvegarde spécifique
    try {
        const doc = await getSaveDocRef().get();
        if (doc.exists) {
            console.log(`Données chargées pour [${currentSaveId}] depuis Firebase.`);
            const stateData = doc.data();

            // Récupérer les entrées de journal depuis la sous-collection
            const journalSnapshot = await getJournalEntriesCollectionRef().get();
            let journalEntries = [];

            if (!journalSnapshot.empty) {
                journalSnapshot.forEach(jDoc => {
                    journalEntries.push(jDoc.data());
                });
            }

            // MIGRATION AUTOMATIQUE : si la sous-collection est vide mais que le doc principal contient un journal (ancien format)
            if (journalEntries.length === 0 && stateData.journal && Array.isArray(stateData.journal) && stateData.journal.length > 0) {
                console.log("Migration automatique des entrées du journal vers la sous-collection 'journal_entries'...");
                const journalCollRef = getJournalEntriesCollectionRef();
                for (const item of stateData.journal) {
                    if (item && item.id) {
                        await journalCollRef.doc(String(item.id)).set(item);
                    }
                }
                journalEntries = stateData.journal;

                // Nettoyer l'ancien champ 'journal' du document principal pour repasser sous les 1 Mo
                try {
                    await getSaveDocRef().update({ journal: firebase.firestore.FieldValue.delete() });
                    console.log("Ancien journal supprimé avec succès du document principal.");
                } catch (e) {
                    console.warn("Mise à jour du document principal lors de la migration :", e);
                }
            } else if (stateData.journal && Array.isArray(stateData.journal) && stateData.journal.length > 0) {
                // Si la sous-collection existe déjà ET que le doc principal a toujours l'ancien champ 'journal' lourd
                try {
                    await getSaveDocRef().update({ journal: firebase.firestore.FieldValue.delete() });
                    console.log("Purger l'ancien champ journal du document principal.");
                } catch (e) { }
            }

            // Trier les entrées par date descendante
            journalEntries.sort((a, b) => new Date(b.date) - new Date(a.date));
            stateData.journal = journalEntries;

            return stateData;
        }
    } catch (e) {
        console.error("Erreur chargement save doc :", e);
    }

    console.log(`Aucune sauvegarde Firebase trouvée pour [${currentSaveId}].`);
    return null;
}

window.recoverOrphanedCampaigns = async function (silent = false) {
    try {
        if (!silent) showToast("Synchronisation des campagnes...", 'info');
        const snapshot = await db.collection('saves').get();
        let addedCount = 0;
        let updatedCount = 0;

        for (const doc of snapshot.docs) {
            const id = doc.id;
            const data = doc.data();

            const name = data.character?.identityFields?.name || data.character?.name || `Campagne récupérée (${id})`;
            const portrait = data.character?.portrait || "https://res.cloudinary.com/dg64n9fhe/image/upload/w_300,c_scale,f_auto,q_auto/v1776178797/f9zhxf8orfqhkjmu5b8p.jpg";

            const existingIndex = campaignsList.findIndex(c => c.id === id);

            if (existingIndex === -1) {
                campaignsList.push({ id, name, portrait });
                addedCount++;
            } else {
                let updated = false;
                const c = campaignsList[existingIndex];
                if (c.name !== name) {
                    c.name = name;
                    updated = true;
                }
                if (c.portrait !== portrait) {
                    c.portrait = portrait;
                    updated = true;
                }
                if (updated) updatedCount++;
            }
        }

        if (addedCount > 0 || updatedCount > 0) {
            localStorage.setItem('oregon_campaigns_list', JSON.stringify(campaignsList));

            // Mise à jour de l'index global
            for (const c of campaignsList) {
                await db.collection('campaigns').doc(c.id).set(c, { merge: true });
            }

            if (!silent) {
                let message = "";
                if (addedCount > 0 && updatedCount > 0) {
                    message = `${addedCount} campagne(s) ajoutée(s) et ${updatedCount} mise(s) à jour !`;
                } else if (addedCount > 0) {
                    message = `${addedCount} campagne(s) récupérée(s) !`;
                } else {
                    message = `${updatedCount} miniature(s) mise à jour !`;
                }

                showToast(message, 'success');
                setTimeout(() => location.reload(), 1500);
            }
        } else {
            if (!silent) showToast("Toutes les campagnes sont déjà à jour.", 'info');
        }
    } catch (error) {
        console.error("Erreur de récupération :", error);
        if (!silent) showToast("Erreur lors de la récupération. Vérifiez vos permissions Firebase.", 'error');
    }
};

window.createNewCampaign = async function (name) {
    const id = 'save_' + Date.now();
    campaignsList.push({ id, name });
    currentSaveId = id;
    localStorage.setItem('oregon_current_save_id', id);
    localStorage.setItem('oregon_campaigns_list', JSON.stringify(campaignsList));

    // Initialize with default state
    gameState = JSON.parse(JSON.stringify(defaultState));
    await saveGameData();
    location.reload(); // Hard reload to clear everything and start fresh
};

window.switchCampaign = async function (id) {
    currentSaveId = id;
    localStorage.setItem('oregon_current_save_id', id);

    // Sync current ID to Firebase settings before reload
    if (auth.currentUser) {
        await db.collection('settings').doc(auth.currentUser.uid).set({
            currentSaveId: currentSaveId
        }, { merge: true });
    }

    location.reload();
};

window.deleteCampaign = async function (id) {
    if (campaignsList.length <= 1) {
        showToast("Impossible de supprimer la seule campagne restante.", 'warning');
        return;
    }
    if (!confirm("Voulez-vous vraiment supprimer cette campagne ? Cette action est irréversible.")) return;

    campaignsList = campaignsList.filter(c => c.id !== id);
    if (currentSaveId === id) {
        currentSaveId = campaignsList[0].id;
        localStorage.setItem('oregon_current_save_id', currentSaveId);
    }
    localStorage.setItem('oregon_campaigns_list', JSON.stringify(campaignsList));

    // Suppression de la sous-collection journal_entries
    try {
        const snapshot = await db.collection('saves').doc(id).collection('journal_entries').get();
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    } catch (e) {
        console.warn("Erreur suppression sous-collection journal_entries :", e);
    }

    // Deleting from Firebase
    await db.collection('saves').doc(id).delete();
    await db.collection('campaigns').doc(id).delete();
    location.reload();
};
