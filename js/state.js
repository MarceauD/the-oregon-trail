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
            { id: 9, name: "Agilité", value: 50 },
            { id: 10, name: "Discrétion", value: 65 },
            { id: 11, name: "Dextérité", value: 40 },
        ],
        skills: [
            { id: 101, name: "Résilience", value: 85 },
            { id: 102, name: "Débrouillardise", value: 60 },
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
            { id: 301, text: "Résilience" },
            { id: 302, text: "Loyauté" },
            { id: 303, text: "Droiture" },
        ],
        weaknesses: [
            { id: 401, text: "Manque de confiance" },
            { id: 402, text: "Ignorant" },
            { id: 403, text: "Méfiant" },
        ],
        inventory: {
            firearms: [],
            clothing: [],
            companions: [],
            general: [
                { id: 801, text: "Vêtements vieux et sales", isAvailable: true },
                { id: 802, text: "Bottes de marche usées", isAvailable: true },
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

const imageGalleryList = [
    "altoona.png",
    "background.png",
    "cattleman_hat.jpg",
    "character.png",
    "cowboy_hat.png",
    "day1/TheOregonTrail_DAY1_1.png",
    "day1/TheOregonTrail_DAY1_2.png",
    "day1/TheOregonTrail_DAY1_3.png",
    "day1/TheOregonTrail_DAY1_4.png",
    "Eddy_Pilgrim.png",
    "fusil_sharps.jpg",
    "horseshoe_curve.png",
    "James_Blackmore.jpg",
    "knights_of_labor.jpg",
    "morgan_horse.jpg",
    "music_in_saloon.png",
    "npc/artus_flynn.png",
    "npc/benjamin.png",
    "npc/caleb_winters.png",
    "npc/edward_dunbar.png",
    "npc/elara_mcnamera.png",
    "npc/eugene_dunbar.png",
    "npc/finn.png",
    "npc/isaac_meeks.png",
    "npc/jedediah_harper.png",
    "npc/john_geary.png",
    "npc/journaliers.png",
    "npc/matronne.png",
    "npc/morris_diamond.png",
    "npc/mr_vogel.png",
    "npc/ollie.png",
    "npc/pisteur_eugene.png",
    "npc/regina_dunbar.png",
    "npc/silas_flynn.png",
    "npc/theodore_mcnamera.png",
    "orphelinat de harrisburg.png",
    "placeholder_npc.png",
    "placeholder_thread.png",
    "remington_derringer_m95.png",
    "remington_new_model.png",
    "smokes/12_sacagawea.png",
    "smokes/18_jesse_james.png",
    "smokes/34_samuel_colt.png",
    "smokes/37_lewis_and_clark_expedition.png",
    "spencer_m1865.jpg",
    "straw_hat.png",
    "threads/enterrer_caleb.png",
    "threads/exil_dans_les_bois.png",
    "threads/exprimer_ma_gratitude.png",
    "threads/la_part_d_ombre_de_benjamin.png",
    "threads/la_traque_d_eugene.png",
    "threads/le_secret_du_14_de_trefle.png",
    "threads/le_vautour_et_la_proie.png",
    "threads/retrouvailles_douloureuses.png",
    "usa_1866.jpg"
];

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
    console.log(`Partie [${currentSaveId}] sauvegardée sur Firebase !`);

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
        }
    }

    const doc = await getSaveDocRef().get();
    if (doc.exists) {
        console.log(`Données chargées pour [${currentSaveId}] depuis Firebase.`);
        return doc.data();
    } else {
        console.log(`Aucune sauvegarde Firebase trouvée pour [${currentSaveId}].`);
        return null;
    }
}

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

    // Deleting from Firebase
    await db.collection('saves').doc(id).delete();
    location.reload();
};
