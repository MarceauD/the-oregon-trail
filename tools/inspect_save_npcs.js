const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'saves', 'eddy', 'save.txt');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

for (let i = 110; i <= 200; i++) {
    console.log(`${i}: ${lines[i - 1]}`);
}
