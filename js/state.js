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
    const { type, path, value, campaignId } = event.data;
    // On ne traite le message que si c'est la même campagne que l'onglet actuel
    if (type === 'STATE_UPDATE' && campaignId === currentSaveId) {
        console.log(`[Sync] Mise à jour reçue d'un autre onglet : ${path} =`, value);
        setDeepValue(gameState, path, value);
        if (typeof renderAll === 'function') renderAll();
    }
};

/**
 * Sauvegarde chirurgicale d'un champ précis sur Firebase et diffusion aux autres onglets
 * @param {string} path - Chemin en notation pointée (ex: "character.money")
 * @param {any} value - Nouvelle valeur
 */
window.savePartialData = async function (path, value) {
    if (isReadOnly) return;

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
        // console.log(`[Firebase] Champ mis à jour : ${path}`);
    } catch (error) {
        console.error(`Erreur lors de la mise à jour partielle (${path}):`, error);
        // Fallback sur set merge si le document n'accepte pas l'update (ex: inexistant)
        await getSaveDocRef().set(gameState, { merge: true });
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

    // Sauvegarde de l'état avec fusion (merge) pour éviter d'écraser les changements concurrents sur d'autres champs
    await getSaveDocRef().set(gameState, { merge: true });
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
            console.log(`Donn\u00e9es charg\u00e9es pour [${currentSaveId}] depuis Firebase.`);
            return doc.data();
        }
    } catch (e) {
        console.error("Erreur chargement save doc :", e);
    }

    console.log(`Aucune sauvegarde Firebase trouv\u00e9e pour [${currentSaveId}].`);
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
    if (!confirm("Voulez-vous vraiment supprimer cette campagne ? Cette action est irr\u00e9versible.")) return;

    campaignsList = campaignsList.filter(c => c.id !== id);
    if (currentSaveId === id) {
        currentSaveId = campaignsList[0].id;
        localStorage.setItem('oregon_current_save_id', currentSaveId);
    }
    localStorage.setItem('oregon_campaigns_list', JSON.stringify(campaignsList));

    // Deleting from Firebase
    await db.collection('saves').doc(id).delete();
    await db.collection('campaigns').doc(id).delete();
    location.reload();
};
