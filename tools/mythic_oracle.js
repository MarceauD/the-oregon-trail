const oddsTable = {
    'impossible': { target: 10, eYes: 2, eNo: 91 },
    'no way': { target: 15, eYes: 3, eNo: 82 }, // approximate
    'very unlikely': { target: 25, eYes: 5, eNo: 86 },
    'unlikely': { target: 35, eYes: 7, eNo: 88 },
    '50/50': { target: 50, eYes: 10, eNo: 91 },
    'somewhat likely': { target: 65, eYes: 13, eNo: 94 },
    'likely': { target: 75, eYes: 15, eNo: 96 },
    'very likely': { target: 85, eYes: 17, eNo: 98 },
    'near sure thing': { target: 90, eYes: 18, eNo: 99 },
    'a sure thing': { target: 95, eYes: 19, eNo: 100 }
};

const arg = process.argv[2] ? process.argv[2].toLowerCase() : '50/50';

if (!oddsTable[arg]) {
    console.log(`Odds non reconnus. Veuillez utiliser une probabilité valide: ${Object.keys(oddsTable).join(', ')}`);
    console.log(`Exemple: node mythic_oracle.js "likely"`);
    process.exit(1);
}

const table = oddsTable[arg];
const roll = Math.floor(Math.random() * 100) + 1; // 1-100

// Determine Random Event (doubles under chaos factor, which is 5, so 11,22,33,44,55)
// Let's do random event logic:
// Actually, standard mythic CF5: if roll is double and <= 55, random event.
const isDouble = (roll % 11 === 0);
const randomEvent = (isDouble && roll <= 55);

let answer = "";
if (roll <= table.eYes) {
    answer = "OUI EXCEPTIONNEL";
} else if (roll <= table.target) {
    answer = "OUI";
} else if (roll >= table.eNo) {
    answer = "NON EXCEPTIONNEL";
} else {
    answer = "NON";
}

if (randomEvent) {
    answer += " + ÉVÉNEMENT ALÉATOIRE !";
}

console.log(`[Mythic Oracle (CF5) - Odds: ${arg}]`);
console.log(`Jet: ${roll}`);
console.log(`Réponse: ${answer}`);
