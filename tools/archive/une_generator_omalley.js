const verbs = ["Acquire", "Avoid", "Command", "Compensate", "Discard", "Foster", "Guard", "Impart", "Inspect", "Intimidate", "Manage", "Monitor", "Oppress", "Persevere", "Preserve", "Protect", "Pursue", "Reassure", "Refine", "Search", "Secure", "Seize", "Serve", "Strengthen", "Study", "Support", "Suppress", "Survey", "Test", "Thwart", "Understand", "Uphold", "Watch"];
const nouns = ["Asset", "Burden", "Danger", "Debt", "Favor", "Goal", "Honor", "Knowledge", "Loss", "Needs", "Power", "Prize", "Record", "Relationship", "Resource", "Security", "Status", "Supply", "Support", "Work", "Wealth", "Justice", "Vengeance", "Family", "Health", "Peace"];

console.log("=== UNE NPC GENERATOR: O'MALLEY ===");
const m1 = `${verbs[Math.floor(Math.random() * verbs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
const m2 = `${verbs[Math.floor(Math.random() * verbs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
const m3 = `${verbs[Math.floor(Math.random() * verbs.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;

console.log("Relationship: Hostile");
console.log("Power: Comparable");
console.log("Motive 1:", m1);
console.log("Motive 2:", m2);
console.log("Motive 3:", m3);
