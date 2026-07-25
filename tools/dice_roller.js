const stat = parseInt(process.argv[2], 10);
if (isNaN(stat)) {
    console.log("Usage: node dice_roller.js <stat_value>");
    process.exit(1);
}

const roll = Math.floor(Math.random() * 100) + 1; // 1 to 100
let result;

if (roll >= 1 && roll <= 5) {
    result = "SUCCÈS CRITIQUE";
} else if (roll >= 96 && roll <= 100) {
    result = "ÉCHEC CRITIQUE";
} else if (roll <= stat) {
    result = "RÉUSSITE";
} else {
    result = "ÉCHEC";
}

console.log(`Roll: ${roll} / ${stat} -> ${result}`);
