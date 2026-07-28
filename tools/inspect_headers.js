const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'saves', 'eddy', 'save.txt');
const content = fs.readFileSync(filePath, 'utf-8');

const headers = content.split('\n').filter(line => line.startsWith('===') && line.endsWith('==='));
console.log("=== HEADERS IN FILE ===");
console.log(headers);
