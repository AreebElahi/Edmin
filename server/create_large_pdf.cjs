const fs = require('fs');
const PDFDocument = require('pdfkit');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('large_test.pdf'));

for (let i = 1; i <= 60; i++) {
  if (i === 1) {
    doc.text(`This is Page ${i}. The Beginning. Topics: Initial setup, introduction, early history.`);
  } else if (i === 30) {
    doc.text(`This is Page ${i}. The Middle. Topics: Advanced mechanics, middle ages, core architecture.`);
  } else if (i === 60) {
    doc.text(`This is Page ${i}. The End. Topics: Conclusion, future outlook, modern era.`);
  } else {
    doc.text(`This is Page ${i}. Filler content for page ${i}.`);
  }
  
  if (i < 60) {
    doc.addPage();
  }
}

doc.end();
console.log("large_test.pdf created!");
