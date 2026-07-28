const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'saves', 'eddy', 'summary.txt');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);
const lastLines = lines.slice(-40);
lastLines.forEach((line, index) => {
    console.log(`${lines.length - 40 + index + 1}: ${line}`);
});
