const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'saves', 'eddy', 'save.txt');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.includes('350') && (line.toLowerCase().includes('boisseau') || line.toLowerCase().includes('dollars'))) {
        console.log(`${index + 1}: ${line.trim()}`);
    }
});
