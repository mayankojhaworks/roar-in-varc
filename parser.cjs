const fs = require('fs');
const path = require('path');

const inputDirectory = "C:\\Users\\Asus\\Downloads\\PYQ FILES FOR ROAR IN VARC";
const dataFolder = path.join(__dirname, 'src', 'data');

// CACHE BUSTER V4
const outputFilePath = path.join(dataFolder, 'pyqDataV4.json'); 

if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder, { recursive: true });
}

let database = [];

try {
    const files = fs.readdirSync(inputDirectory);
    console.log(`\n🔍 Found ${files.length} files. Starting line-by-line extraction...`);

    files.forEach(file => {
        if (!file.endsWith('.txt')) return;

        const rawText = fs.readFileSync(path.join(inputDirectory, file), 'utf-8');
        const lines = rawText.split(/\r?\n/);
        
        let blocks = [];
        let currentBlock = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (/^20\d{2}(?:\(Slot\d+\))?(?:-[A-Z]+(?:\(?\d+\)?)?-\d+|-RC\(?\d+\)?)$/.test(line)) {
                if (currentBlock) blocks.push(currentBlock);
                currentBlock = { id: line, lines: [] };
            } else if (currentBlock) {
                currentBlock.lines.push(line);
            }
        }
        if (currentBlock) blocks.push(currentBlock);

        let currentPassage = "";

        blocks.forEach(block => {
            const id = block.id;
            const text = block.lines.join('\n').trim();
            let type = id.includes("-RC") ? "RC" : "VA";

            if (id.match(/-RC\(?\d+\)?$/)) {
                const startIdx = text.indexOf('[');
                const endIdx = text.lastIndexOf(']');
                if (startIdx !== -1 && endIdx > startIdx) {
                    currentPassage = text.substring(startIdx + 1, endIdx).trim();
                }
            } else {
                const answerMatch = text.match(/Correct Answer:\s*([^\n]+)/);
                const answer = answerMatch ? answerMatch[1].trim() : "";

                const expMatch = text.match(/Explanation:\s*([\s\S]*)/);
                const explanation = expMatch ? expMatch[1].trim() : "";

                let qTextRaw = text.replace(/Correct Answer:[\s\S]*/, '').trim();

                // --- BULLETPROOF PASSAGE EXTRACTION ---
                if (type === "RC") {
                    let startIdx = qTextRaw.indexOf('[');
                    let endIdx = qTextRaw.lastIndexOf(']');

                    // Fix for missing closing brackets in the text files
                    if (startIdx !== -1 && endIdx === -1) {
                        let linesAfter = qTextRaw.substring(startIdx + 1).split('\n').filter(l => l.trim().length > 0);
                        if (linesAfter.length > 1) {
                            let lastLine = linesAfter[linesAfter.length - 1];
                            if (lastLine.length < 200 || lastLine.endsWith('?')) {
                                endIdx = qTextRaw.lastIndexOf(lastLine);
                            } else {
                                endIdx = qTextRaw.length;
                            }
                        } else {
                            endIdx = qTextRaw.length;
                        }
                    }

                    if (startIdx !== -1 && endIdx >= startIdx) {
                        let extracted = qTextRaw.substring(startIdx + 1, endIdx).replace(/\]/g, '').trim();
                        if (extracted.length > 20) {
                            currentPassage = extracted;
                        }
                        // Remove the passage from the question pane
                        let safeEnd = endIdx + (qTextRaw[endIdx] === ']' ? 1 : 0);
                        qTextRaw = qTextRaw.substring(0, startIdx).trim() + '\n\n' + qTextRaw.substring(safeEnd).trim();
                    } 
                    else if (currentPassage.length > 20) {
                        // If no brackets are found at all, forcefully remove the known passage text 
                        // from the question pane to prevent duplication.
                        let lines = qTextRaw.split('\n');
                        let cleanLines = lines.filter(line => {
                            if (line.trim().length < 80) return true;
                            let snippet = line.trim().substring(0, 50);
                            return !currentPassage.includes(snippet);
                        });
                        qTextRaw = cleanLines.join('\n').trim();
                    }
                }

                qTextRaw = qTextRaw.trim();

                const options = [];
                for (let j = 1; j <= 4; j++) {
                    const optRegex = new RegExp(`Option ${j}:\\s*([\\s\\S]*?)(?=Option ${j+1}:|$)`, 'i');
                    const optMatch = qTextRaw.match(optRegex);
                    if (optMatch) {
                        options.push(optMatch[1].trim());
                        qTextRaw = qTextRaw.replace(optMatch[0], '').trim();
                    }
                }

                database.push({
                    id: id,
                    type: type,
                    passage: type === "RC" ? currentPassage : null,
                    question: qTextRaw,
                    options: options.length > 0 ? options : null,
                    correctAnswer: answer,
                    explanation: explanation
                });
            }
        });
    });

    fs.writeFileSync(outputFilePath, JSON.stringify(database, null, 2));
    console.log(`\n🎉 SUCCESS! Generated BULLETPROOF pyqDataV4.json`);

} catch (error) {
    console.error("❌ Error reading files.", error);
}