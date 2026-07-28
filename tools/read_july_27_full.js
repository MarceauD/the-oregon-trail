const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'saves', 'eddy', 'save.txt');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

let startIndex = -1;

lines.forEach((line, index) => {
    if (line.includes('### 27 juillet 1868') || line.includes('27 juillet 1868')) {
        startIndex = index;
    }
});

if (startIndex !== -1) {
    console.log(`July 27 starts at line: ${startIndex + 1}`);
    const july27Lines = lines.slice(startIndex);
    july27Lines.forEach((line, index) => {
        console.log(`${startIndex + index + 1}: ${line}`);
    });
} else {
    console.log("July 27 not found");
}
