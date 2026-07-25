const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const pdfArg = process.argv[2];
const outputArg = process.argv[3];

if (!pdfArg || !outputArg) {
    console.log("Usage: node extract_pdf_raw.js <path_to_pdf> <path_to_txt>");
    process.exit(1);
}

const pdfPath = path.isAbsolute(pdfArg) ? pdfArg : path.join(process.cwd(), pdfArg);
const outputPath = path.isAbsolute(outputArg) ? outputArg : path.join(process.cwd(), outputArg);

if (!fs.existsSync(pdfPath)) {
    console.error(`Erreur : Le fichier ${pdfPath} n'existe pas.`);
    process.exit(1);
}

console.log(`Lecture du fichier PDF: ${path.basename(pdfPath)}...`);
const dataBuffer = fs.readFileSync(pdfPath);

console.log("Extraction du texte via PDFParse...");
const parser = new PDFParse({ data: dataBuffer });

parser.getText().then(function(data) {
    // Ensure parent directory of output exists
    const parentDir = path.dirname(outputPath);
    if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, data.text, 'utf8');
    console.log(`Extraction réussie ! Le texte brut a été sauvegardé dans : ${outputPath}`);
    console.log(`Nombre total de pages extraites : ${data.pages.length}`);
}).catch(function(err) {
    console.error("Erreur lors de l'extraction du PDF :", err);
});
