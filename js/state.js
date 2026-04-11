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

const saveDocRef = db.collection('saves').doc('mainSave');

const defaultState = {
    character: {
        money: 0.00,
        identityFields: {
            name: "Edward 'Eddy' Dunbar",
            age: "18 ans",
            origin: "Harrisburg, Pennsylvanie",
            profession: "Fugitif"
        },
        history: "Edward 'Eddy' Dunbar, 18 ans...",
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
            { id: 103, name: "Jeu de banjo", value: 60 },
            { id: 104, name: "Attaque sournoise", value: 70 },
            { id: 105, name: "Fuite", value: 65 },
            { id: 109, name: "Lecture", value: 5 },
            { id: 110, name: "Ecriture", value: 5 },
            { id: 110, name: "Equitation", value: 10 },
        ],
        banjoMelodies: [
            { id: 201, name: "Hard Times Come Again No More", description: "Triste et lent" }
        ],
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
                { id: 807, text: "Banjo dans son étui", isAvailable: true },
                { id: 808, text: "Nourriture", isAvailable: true },
            ]
        }
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
    "Eddy_Pilgrim.png",
    "horseshoe_curve.png",
    "James_Blackmore.jpg",
    "knights_of_labor.jpg",
    "music_in_saloon.png",
    "remington_derringer_m95.png",
    "character.png",
    "background.png",
    "cattleman_hat.jpg",
    "fusil_sharps.jpg",
    "morgan_horse.jpg",
    "remington_new_model.png",
    "spencer_m1865.jpg",
    "straw_hat.png",
    "smokes/12_sacagawea.png",
    "smokes/18_jesse_james.png",
    "smokes/34_samuel_colt.png",
    "smokes/37_lewis_and_clark_expedition.png",
    "day1/TheOregonTrail_DAY1_1.png",
    "day1/TheOregonTrail_DAY1_2.png",
    "day1/TheOregonTrail_DAY1_3.png",
    "day1/TheOregonTrail_DAY1_4.png",
];

async function saveGameData() {
    await saveDocRef.set(gameState);
    console.log("Partie sauvegardée sur Firebase !");
}

async function loadGameData() {
    const doc = await saveDocRef.get();
    if (doc.exists) {
        console.log("Données chargées depuis Firebase.");
        return doc.data();
    } else {
        console.log("Aucune sauvegarde Firebase trouvée.");
        return null;
    }
}
