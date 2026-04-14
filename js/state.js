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

async function syncCloudGallery() {
    try {
        const snapshot = await db.collection('gallery').orderBy('createdAt', 'desc').get();
        cloudGallery = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Galerie Cloud synchronis\u00e9e :", cloudGallery.length, "images.");
    } catch (error) {
        console.error("Erreur lors de la synchronisation de la galerie Cloud :", error);
    }
}

let currentSaveId = localStorage.getItem('oregon_current_save_id') || 'mainSave';
let campaignsList = JSON.parse(localStorage.getItem('oregon_campaigns_list')) || [{ id: 'mainSave', name: 'Campagne Principale' }];

function getSaveDocRef() {
    return db.collection('saves').doc(currentSaveId);
}

const defaultState = {
    character: {
        portrait: "images/placeholder_npc.png",
        money: 0.00,
        identityFields: {
            name: "Edward 'Eddy' Dunbar",
            age: "18 ans",
            origin: "Harrisburg, Pennsylvanie",
            profession: "Fugitif"
        },
        history: "Edward 'Eddy' Dunbar...",
        stats: [
            { id: 1, name: "Force", value: 60 },
            { id: 2, name: "Endurance", value: 80 },
            { id: 3, name: "Charisme", value: 50 },
            { id: 4, name: "Connaissances", value: 30 },
            { id: 5, name: "Combat", value: 45 },
            { id: 6, name: "Perception", value: 65 },
            { id: 7, name: "Persuasion", value: 70 },
            { id: 8, name: "Survie", value: 35 },
            { id: 9, name: "Agilit\u00e9", value: 50 },
            { id: 10, name: "Discr\u00e9tion", value: 65 },
            { id: 11, name: "Dext\u00e9rit\u00e9", value: 40 },
        ],
        skills: [
            { id: 101, name: "R\u00e9silience", value: 85 },
            { id: 102, name: "D\u00e9brouillardise", value: 60 },
            { id: 103, name: "Jeu d'instrument", value: 60 },
            { id: 104, name: "Attaque sournoise", value: 70 },
            { id: 105, name: "Fuite", value: 65 },
            { id: 109, name: "Lecture", value: 5 },
            { id: 110, name: "Ecriture", value: 5 },
            { id: 111, name: "Equitation", value: 10 },
        ],
        specificKnowledge: [
            { id: 201, name: "Hard Times Come Again No More", description: "Triste et lent" }
        ],
        physicalState: [],
        mentalState: [],
        strengths: [
            { id: 301, text: "R\u00e9silience" },
            { id: 302, text: "Loyaut\u00e9" },
            { id: 303, text: "Droiture" },
        ],
        weaknesses: [
            { id: 401, text: "Manque de confiance" },
            { id: 402, text: "Ignorant" },
            { id: 403, text: "M\u00e9fiant" },
        ],
        inventory: {
            firearms: [],
            clothing: [],
            companions: [],
            general: [
                { id: 801, text: "V\u00eatements vieux et sales", isAvailable: true },
                { id: 802, text: "Bottes de marche us\u00e9es", isAvailable: true },
                { id: 807, text: "Instrument de musique", isAvailable: true },
                { id: 808, text: "Nourriture", isAvailable: true },
            ]
        },
        plotNotes: "" // Carnet d'intrigues
    },
    npcs: [],
    threads: [],
    journal: [],
    route: [
        { id: 1, city: "Harrisburg", x: 3164, y: 1013, type: "major-city", labelPosition: "top-right" },
    ]
};

let gameState = {};

const imageGalleryList = [];


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

    await getSaveDocRef().set(gameState);
    console.log(`Partie [${currentSaveId}] sauvegard\u00e9e sur Firebase !`);

    // Sync campaigns list to Firestore for cross-device persistence
    if (auth.currentUser) {
        await db.collection('settings').doc(auth.currentUser.uid).set({
            campaignsList: campaignsList,
            currentSaveId: currentSaveId
        });
    }
    localStorage.setItem('oregon_campaigns_list', JSON.stringify(campaignsList));
}

async function loadGameData() {
    // Before loading actual game data, try to sync the campaigns list from settings
    if (auth.currentUser) {
        const settingsDoc = await db.collection('settings').doc(auth.currentUser.uid).get();
        if (settingsDoc.exists) {
            const settings = settingsDoc.data();
            if (settings.campaignsList) {
                campaignsList = settings.campaignsList;
                localStorage.setItem('oregon_campaigns_list', JSON.stringify(campaignsList));
            }
            if (settings.currentSaveId) {
                currentSaveId = settings.currentSaveId;
                localStorage.setItem('oregon_current_save_id', currentSaveId);
            }
        }
    }

    const doc = await getSaveDocRef().get();
    if (doc.exists) {
        console.log(`Donn\u00e9es charg\u00e9es pour [${currentSaveId}] depuis Firebase.`);
        return doc.data();
    } else {
        console.log(`Aucune sauvegarde Firebase trouv\u00e9e pour [${currentSaveId}].`);
        return null;
    }
}

window.recoverOrphanedCampaigns = async function () {
    try {
        showToast("Recherche de campagnes en cours...", 'info');
        const snapshot = await db.collection('saves').get();
        let addedCount = 0;

        for (const doc of snapshot.docs) {
            const id = doc.id;
            const data = doc.data();
            const exists = campaignsList.find(c => c.id === id);

            if (!exists) {
                const name = data.character?.identityFields?.name || data.character?.name || `Campagne r\u00e9cup\u00e9r\u00e9e (${id})`;
                const portrait = data.character?.portrait || "images/placeholder_npc.png";
                campaignsList.push({ id, name, portrait });
                addedCount++;
            }
        }

        if (addedCount > 0) {
            localStorage.setItem('oregon_campaigns_list', JSON.stringify(campaignsList));
            if (auth.currentUser) {
                await db.collection('settings').doc(auth.currentUser.uid).set({
                    campaignsList: campaignsList,
                    currentSaveId: currentSaveId
                }, { merge: true });
            }
            showToast(`${addedCount} campagne(s) r\u00e9cup\u00e9r\u00e9e(s) !`, 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast("Aucune nouvelle campagne trouv\u00e9e.", 'info');
        }
    } catch (error) {
        console.error("Erreur de r\u00e9cup\u00e9ration :", error);
        showToast("Erreur lors de la r\u00e9cup\u00e9ration. V\u00e9rifiez vos permissions Firebase.", 'error');
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
            campaignsList: campaignsList,
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
    location.reload();
};
