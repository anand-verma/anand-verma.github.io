// generatePDF.js

document.getElementById("generateQCAB").addEventListener("click", () => {
    // Custom questions have their own handler and do not use the PYQ selection map.
    if (typeof window.isCustomQuestionMode === "function" && window.isCustomQuestionMode()) {
        if (typeof window.getCustomQuestions !== "function") {
            alert("Custom question handler not loaded!");
            return;
        }

        const customQuestions = window.getCustomQuestions();

        if (customQuestions.length === 0) {
            alert("Add at least one custom question first!");
            return;
        }

        customQuestions.forEach((q, i) => {
            q.question_number = i + 1;
        });

        generateQCABPDF(customQuestions);
        return;
    }

    if (typeof window.getSelectedQuestions !== "function") {
        alert("Selection logic not loaded!");
        return;
    }

    const selectedQuestions = window.getSelectedQuestions();
    if (selectedQuestions.length === 0) {
        alert("Select questions first!");
        return;
    }

    // Existing PYQ behaviour: keep current marks-based ordering.
    selectedQuestions.sort((a, b) => a.marks - b.marks);

    // Ensure sequential numbering (1,2,3...)
    selectedQuestions.forEach((q, i) => {
        q.question_number = i + 1;
    });

    generateQCABPDF(selectedQuestions);
});

function getAnswerPages(q) {
    // Permanent rule:
    // 1. If q.pages is supplied and is a valid positive number, use it.
    // 2. Otherwise fall back to the existing marks-based calculation.
    const explicitPages = Number(q.pages);

    if (Number.isFinite(explicitPages) && explicitPages > 0) {
        return Math.ceil(explicitPages);
    }

    const marks = Number(q.marks) || 0;
    return Math.max(1, Math.ceil(marks / 6));
}

function generateQCABPDF(questions) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageHeight = 297, pageWidth = 210;
    const leftMargin = 25, rightMargin = 185, topMargin = 15, bottomMargin = 282;

    doc.setFont("Times", "Roman");
    doc.setFontSize(12);

    // ---------- PART 1: Render Question Listing ----------
    let currentY = topMargin;
    const localWidth = rightMargin - leftMargin + 4;
    const lineHeight = 6;

    questions.forEach((q, index) => {
        const qHeader = `${q.question_number}. `;
        const qText = `${q.question_text}   [${q.marks} M${q.word_limit ? ` / ${q.word_limit} W` : ""}${q.year ? ` / ${q.year}` : ""}]`;
        const splitText = doc.splitTextToSize(qText, localWidth);
        const totalHeight = splitText.length * lineHeight + lineHeight;

        if (currentY + totalHeight > pageHeight - 15) {
            doc.addPage();
            currentY = topMargin;
        }

        doc.text(qHeader, leftMargin - 10, currentY);
        doc.text(splitText, leftMargin + 2, currentY);

        currentY += totalHeight;
    });

    // ---------- PART 2: Render QCAB Pages ----------
    questions.forEach((q) => {
        const pagesNeeded = getAnswerPages(q);

        for (let p = 0; p < pagesNeeded; p++) {
            doc.addPage();

            // Margins
            doc.setLineWidth(0.3);
            doc.line(leftMargin, topMargin, leftMargin, bottomMargin);
            doc.line(rightMargin, topMargin, rightMargin, bottomMargin);

            // Footer
            const footerText = `XXXX-${q.question_id || `CUSTOM_${q.question_number}`}`;
            doc.setFontSize(8);
            doc.text(footerText, leftMargin - 10, bottomMargin + 3);

            if (p === 0) {
                // Left Question Number
                doc.setFontSize(12);
                doc.text(`Q. ${q.question_number}`, leftMargin - 15, topMargin + 5);

                // Question Text
                const localQuestionWidth = rightMargin - leftMargin - 4;
                const questionText = `${q.question_text}`;
                const splitText = doc.splitTextToSize(questionText, localQuestionWidth);
                let currentY = topMargin + 5;
                doc.text(splitText, leftMargin + 2, currentY);

                // Marks / Word limit / Year (right margin top)
                currentY = topMargin + 5;
                const metadata = [
                    q.marks != null ? `${q.marks} M` : "",
                    q.year ? `${q.year}` : ""
                ].filter(Boolean).join(" / ");
                doc.text(metadata, rightMargin + 2, currentY);
            } else {
                // Right Margin Text (only for continuation pages)
                const localWidth = 23;
                const splitText = doc.splitTextToSize(
                    "Candidates must not write on this margin",
                    localWidth
                );
                let currentY = topMargin + 5;
                doc.text(splitText, rightMargin + 2, currentY);
            }
        }
    });

    window.generatedPDF = doc;
    if (window.generatedPDF) {
        window.generatedPDF.save("QCAB.pdf");
    }
}

document.getElementById("downloadPDF").addEventListener("click", () => {
    if (window.generatedPDF) {
        window.generatedPDF.save("QCAB.pdf");
        document.getElementById("downloadPDF").style.display = "none";
    }
});
