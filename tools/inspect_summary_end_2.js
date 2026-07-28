const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'saves', 'eddy', 'summary.txt');
const content = fs.readFileSync(filePath, 'utf-8');
console.log(content.slice(-4000));
