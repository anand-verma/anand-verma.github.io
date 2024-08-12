document.getElementById('pdfFile').addEventListener('change', handleFileSelect);
document.getElementById('startProcessBtn').addEventListener('click', startBookmarkProcess);

let selectedFile;
let pdfDoc;
let pdfjsDoc;
let bookmarks = [];

async function handleFileSelect(event) {
    selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
        document.getElementById('startProcessBtn').disabled = false;
    } else {
        alert('Please upload a valid PDF file.');
    }
}

async function startBookmarkProcess() {
    if (selectedFile) {
        try {
            const arrayBuffer = await readFileAsArrayBuffer(selectedFile);
            pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
            pdfjsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const totalPages = pdfDoc.getPageCount();

            for (let i = 0; i < totalPages; i++) {
                const pageText = await getPageText(i + 1);
                const title = extractTitleFromText(pageText);
                if (title) {
                    bookmarks.push({ title, pageNum: i + 1 });
                }
                updateProgress(i + 1, totalPages);
            }

            await addBookmarksToPDF();

            document.getElementById('downloadBtn').disabled = false;

        } catch (error) {
            console.error('Error processing PDF:', error);
        }
    } else {
        alert('No PDF file selected.');
    }
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function getPageText(pageIndex) {
    const page = await pdfjsDoc.getPage(pageIndex);
    const textContent = await page.getTextContent();
    return textContent.items.map(item => item.str).join('\n');
}

function extractTitleFromText(text) {
    const dateRegex = /\d{2} \w+ \d{4}/;
    const timeRegex = /\d{2}:\d{2}/;
    const lines = text.split('\n').reverse();

    let dateFound = false;
    let timeFound = false;
    let title = null;

    let count = 0;
    for (const line of lines) {
        if (count < 7) {
            const trimmedLine = line.trim();
            if (timeRegex.test(trimmedLine)) timeFound = true;
            else if (dateRegex.test(trimmedLine)) dateFound = true;
            else if (dateFound && timeFound) {
                title = trimmedLine || "Untitled";
                console.log(count);
                break;
            }
            count += 1;
        } else {
            break;
        }
    }
    return title;
}

async function addBookmarksToPDF() {
    const toc = bookmarks.map(({ title, pageNum }) => ({
        title,
        dest: pdfDoc.getPage(pageNum - 1),
        parent: null
    }));

    toc.forEach(async ({ title, dest }, index) => {
        const pageRef = pdfDoc.getPage(index);
        await pdfDoc.addPageOutline(pageRef, title, index);
    });

    updateProgress(100, 100);
}

function updateProgress(currentPage, totalPages) {
    const progress = Math.round((currentPage / totalPages) * 100);
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${progress}%`;
    console.log(`Progress: ${progress}%`);
}

document.getElementById('downloadBtn').addEventListener('click', async () => {
    if (pdfDoc) {
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'processed.pdf';
        a.click();
        URL.revokeObjectURL(url);
    }
});
