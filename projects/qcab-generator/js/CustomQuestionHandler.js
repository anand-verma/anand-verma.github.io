// CustomQuestionHandler.js
// Handles "Add Own Questions" without changing populateQuestions.js.
// Supports question text plus images pasted directly into the editor.
// Exposes: window.getCustomQuestions() and window.isCustomQuestionMode()

(function () {
    "use strict";

    const filtersDiv = document.getElementById("filters");
    const table = document.getElementById("questionsTable");
    const selectAll = document.getElementById("selectAll");
    const summaryDiv = document.getElementById("selectedSummary");

    if (!filtersDiv || !table) {
        console.error("CustomQuestionHandler: required DOM elements not found.");
        return;
    }

    let customQuestions = [];
    let editingId = null;
    let customIdCounter = 1;
    let savedRange = null;

    function isCustomMode() {
        const selected = document.querySelector("input[name='mode']:checked");
        return !!selected && selected.value === "custom";
    }

    window.isCustomQuestionMode = isCustomMode;

    window.getCustomQuestions = function () {
        return customQuestions.map(q => ({ ...q }));
    };

    function saveEditorSelection() {
        const editor = document.getElementById("customQuestionText");
        if (!editor) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
            savedRange = range.cloneRange();
        }
    }

    function restoreEditorSelection() {
        const editor = document.getElementById("customQuestionText");
        if (!editor) return;
        editor.focus();

        const selection = window.getSelection();
        selection.removeAllRanges();

        if (savedRange && editor.contains(savedRange.commonAncestorContainer)) {
            selection.addRange(savedRange);
            return;
        }

        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        selection.addRange(range);
    }

    function placeCaretAfter(node) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.setStartAfter(node);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        savedRange = range.cloneRange();
    }

    function insertHTMLAtCaret(html) {
        restoreEditorSelection();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        range.deleteContents();

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        const fragment = document.createDocumentFragment();
        let lastNode = null;

        while (wrapper.firstChild) {
            lastNode = fragment.appendChild(wrapper.firstChild);
        }

        range.insertNode(fragment);
        if (lastNode) placeCaretAfter(lastNode);
    }

    function insertTextAtCaret(text) {
        if (!text) return;
        insertHTMLAtCaret(escapeHTML(text).replace(/\n/g, "<br>"));
    }

    function sanitizeQuestionHTML(html) {
        const template = document.createElement("template");
        template.innerHTML = html || "";

        template.content
            .querySelectorAll("script,style,iframe,object,embed,form,video,audio,link,meta")
            .forEach(el => el.remove());

        template.content.querySelectorAll("*").forEach(el => {
            [...el.attributes].forEach(attr => {
                const name = attr.name.toLowerCase();
                if (name.startsWith("on") || name === "style" || name === "id") {
                    el.removeAttribute(attr.name);
                }
            });

            if (el.tagName === "IMG") {
                const src = el.getAttribute("src") || "";
                if (!src.startsWith("data:image/")) {
                    el.remove();
                } else {
                    el.setAttribute("alt", el.getAttribute("alt") || "Question image");
                    el.setAttribute("draggable", "false");
                }
            }
        });

        return template.innerHTML.trim();
    }

    function plainTextFromHTML(html) {
        const div = document.createElement("div");
        div.innerHTML = html || "";
        return (div.textContent || "").replace(/\u00a0/g, " ").trim();
    }

    function escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function resizeImage(file, callback) {
        const reader = new FileReader();

        reader.onload = function () {
            const img = new Image();
            img.onload = function () {
                const maxDimension = 1400;
                const scale = Math.min(
                    1,
                    maxDimension / Math.max(img.naturalWidth, img.naturalHeight)
                );

                const width = Math.max(1, Math.round(img.naturalWidth * scale));
                const height = Math.max(1, Math.round(img.naturalHeight * scale));
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    callback(null);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Keep PNG transparency; convert other formats to JPEG to reduce size.
                const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
                callback(canvas.toDataURL(outputType, 0.88));
            };
            img.onerror = () => callback(null);
            img.src = reader.result;
        };

        reader.onerror = () => callback(null);
        reader.readAsDataURL(file);
    }

    function insertPastedImage(file, editor, errorDiv) {
        if (!file || !file.type.startsWith("image/")) {
            errorDiv.textContent = "Please choose an image file.";
            return;
        }

        if (file.size > 8 * 1024 * 1024) {
            errorDiv.textContent = "Image is too large. Please choose an image below 8 MB.";
            return;
        }

        errorDiv.textContent = "Preparing image...";
        resizeImage(file, dataUrl => {
            if (!dataUrl) {
                errorDiv.textContent = "Could not read that image.";
                return;
            }

            errorDiv.textContent = "";
            insertHTMLAtCaret(
                `<img class="qc-question-image" src="${dataUrl}" alt="Question image" draggable="false"><br>`
            );
            editor.focus();
        });
    }

    function clearEditor(editor) {
        editor.innerHTML = "";
        savedRange = null;
        editor.focus();
    }

    function clearCustomSummary() {
        if (summaryDiv) summaryDiv.style.display = "none";
    }

    function render() {
        if (!isCustomMode()) return;

        table.style.display = "none";
        if (selectAll) {
            selectAll.checked = false;
            selectAll.indeterminate = false;
            selectAll.disabled = true;
        }
        clearCustomSummary();

        filtersDiv.innerHTML = `
            <div class="custom-question-panel">
                
                <form id="customQuestionForm" novalidate>
                    <div class="custom-field">
                        <label for="customQuestionText">Question</label>
                        <div class="custom-editor-toolbar" role="toolbar" aria-label="Question tools">
                            <button type="button" id="clearQuestionButton" class="custom-toolbar-button">Clear</button>
                            <span class="custom-toolbar-help">Type text or paste text and images directly into the question box.</span>
                        </div>
                        <div id="customQuestionText" class="custom-rich-editor" contenteditable="true"
                            role="textbox" aria-multiline="true" data-placeholder="Enter your question...type text or paste text and images directly into the question box."></div>
                    </div>

                    <div class="custom-fields-row">
                        <div class="custom-field">
                            <label for="customMarks">Marks</label>
                            <input id="customMarks" type="number" min="1" max="1000" step="1" value="10" required>
                        </div>

                        <div class="custom-field">
                            <label for="customPages">Answer Pages</label>
                            <input id="customPages" type="number" min="1" max="100" step="1" value="2" required>
                            <small>Exact answer space in the PDF.</small>
                        </div>

                        <div class="custom-field">
                            <label for="customWordLimit">Word Limit <span>(optional)</span></label>
                            <input id="customWordLimit" type="number" min="1" max="10000" step="1" placeholder="e.g. 150">
                        </div>
                    </div>

                    <div id="customQuestionError" class="custom-error" role="alert"></div>

                    <div class="custom-form-actions">
                        <button type="submit" id="addCustomQuestion" class="custom-primary-button">
                            ${editingId ? "Update Question" : "+ Add Question"}
                        </button>
                        ${editingId ? '<button type="button" id="cancelCustomEdit" class="custom-secondary-button">Cancel</button>' : ""}
                    </div>
                </form>

                <div class="custom-question-list">
                    <div class="custom-list-header">
                        <div>
                            <h3>Your Questions</h3>
                            <span id="customQuestionCount">0 questions</span>
                        </div>
                        <div id="customTotals" class="custom-totals"></div>
                    </div>
                    <div id="customQuestionItems"></div>
                </div>
            </div>
        `;

        const form = document.getElementById("customQuestionForm");
        const editor = document.getElementById("customQuestionText");
        const marksInput = document.getElementById("customMarks");
        const pagesInput = document.getElementById("customPages");
        const wordInput = document.getElementById("customWordLimit");
        const errorDiv = document.getElementById("customQuestionError");

        if (editingId) {
            const existing = customQuestions.find(q => q.id === editingId);
            if (existing) {
                editor.innerHTML = existing.question_html || escapeHTML(existing.question_text || "");
                marksInput.value = existing.marks;
                pagesInput.value = existing.pages;
                wordInput.value = existing.word_limit || "";
            }
        }

        ["keyup", "mouseup", "focus", "input"].forEach(eventName => {
            editor.addEventListener(eventName, saveEditorSelection);
        });

        // Handle direct image pasting. If the clipboard also contains text,
        // preserve that text and insert the image at the same caret position.
        editor.addEventListener("paste", event => {
            const items = event.clipboardData && event.clipboardData.items;
            if (!items) return;

            const imageItem = [...items].find(item => item.type.startsWith("image/"));
            if (!imageItem) return; // Normal text/rich-text paste remains native.

            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            const file = imageItem.getAsFile();

            if (text) {
                insertTextAtCaret(text);
                insertHTMLAtCaret("<br>");
            }

            if (file) insertPastedImage(file, editor, errorDiv);
        });

        document.getElementById("clearQuestionButton").addEventListener("click", () => clearEditor(editor));

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const questionHTML = sanitizeQuestionHTML(editor.innerHTML);
            const questionText = plainTextFromHTML(questionHTML);
            const marks = Number(marksInput.value);
            const pages = Number(pagesInput.value);
            const wordLimit = wordInput.value.trim() === "" ? null : Number(wordInput.value);

            const errors = [];
            if (!questionText && !questionHTML.includes("<img")) {
                errors.push("Please enter a question or add an image.");
            }
            if (!Number.isInteger(marks) || marks < 1 || marks > 1000) {
                errors.push("Marks must be a whole number between 1 and 1000.");
            }
            if (!Number.isInteger(pages) || pages < 1 || pages > 100) {
                errors.push("Answer pages must be a whole number between 1 and 100.");
            }
            if (wordLimit !== null && (!Number.isInteger(wordLimit) || wordLimit < 1 || wordLimit > 10000)) {
                errors.push("Word limit must be a whole number between 1 and 10000.");
            }

            if (errors.length) {
                errorDiv.textContent = errors.join(" ");
                return;
            }

            const id = editingId || `custom_${customIdCounter++}`;
            const question = {
                id,
                question_id: `CUSTOM_${id.replace(/^custom_/, "")}`,
                question_text: questionText,
                question_html: questionHTML,
                marks,
                pages
            };

            if (wordLimit !== null) question.word_limit = wordLimit;

            if (editingId) {
                const index = customQuestions.findIndex(q => q.id === editingId);
                if (index !== -1) customQuestions[index] = question;
                editingId = null;
            } else {
                customQuestions.push(question);
            }

            savedRange = null;
            render();
        });

        const cancelButton = document.getElementById("cancelCustomEdit");
        if (cancelButton) {
            cancelButton.addEventListener("click", () => {
                editingId = null;
                savedRange = null;
                render();
            });
        }

        renderCustomQuestionList();
    }

    function renderCustomQuestionList() {
        const items = document.getElementById("customQuestionItems");
        const count = document.getElementById("customQuestionCount");
        const totals = document.getElementById("customTotals");
        if (!items || !count || !totals) return;

        count.textContent = `${customQuestions.length} question${customQuestions.length === 1 ? "" : "s"}`;
        const totalMarks = customQuestions.reduce((sum, q) => sum + Number(q.marks || 0), 0);
        const totalPages = customQuestions.reduce((sum, q) => sum + Number(q.pages || 0), 0);
        totals.textContent = customQuestions.length
            ? `${totalMarks} Marks • ${totalPages} Answer Pages`
            : "";

        if (!customQuestions.length) {
            items.innerHTML = '<div class="custom-empty-state">Add your first question above to build the QCAB.</div>';
            return;
        }

        items.innerHTML = "";

        customQuestions.forEach((q, index) => {
            const card = document.createElement("div");
            card.className = "custom-question-card";

            const number = document.createElement("div");
            number.className = "custom-question-number";
            number.textContent = `Q${index + 1}`;

            const content = document.createElement("div");
            content.className = "custom-question-content";

            const preview = document.createElement("div");
            preview.className = "custom-question-text custom-question-preview";
            preview.innerHTML = q.question_html || escapeHTML(q.question_text);
            preview.querySelectorAll("img").forEach(img => img.setAttribute("alt", "Question image"));
            content.appendChild(preview);

            const meta = document.createElement("div");
            meta.className = "custom-question-meta";
            [
                `${q.marks} Marks`,
                `${q.pages} Page${q.pages === 1 ? "" : "s"}`,
                q.word_limit ? `${q.word_limit} Words` : null
            ].filter(Boolean).forEach(label => {
                const span = document.createElement("span");
                span.textContent = label;
                meta.appendChild(span);
            });
            content.appendChild(meta);

            const actions = document.createElement("div");
            actions.className = "custom-question-actions";

            const makeButton = (label, className, handler, disabled = false, title = "") => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `custom-small-button ${className || ""}`;
                button.textContent = label;
                button.disabled = disabled;
                button.title = title;
                button.addEventListener("click", handler);
                return button;
            };

            actions.appendChild(makeButton("↑", "", () => {
                if (index === 0) return;
                [customQuestions[index - 1], customQuestions[index]] = [
                    customQuestions[index],
                    customQuestions[index - 1]
                ];
                render();
            }, index === 0, "Move question up"));

            actions.appendChild(makeButton("↓", "", () => {
                if (index === customQuestions.length - 1) return;
                [customQuestions[index], customQuestions[index + 1]] = [
                    customQuestions[index + 1],
                    customQuestions[index]
                ];
                render();
            }, index === customQuestions.length - 1, "Move question down"));

            actions.appendChild(makeButton("Edit", "", () => {
                editingId = q.id;
                render();
                const questionEditor = document.getElementById("customQuestionText");
                if (questionEditor) questionEditor.focus();
            }));

            actions.appendChild(makeButton("Delete", "custom-delete-button", () => {
                customQuestions = customQuestions.filter(item => item.id !== q.id);
                if (editingId === q.id) editingId = null;
                render();
            }));

            card.append(number, content, actions);
            items.appendChild(card);
        });
    }

    function handleModeChange() {
        if (isCustomMode()) {
            render();
        } else {
            table.style.display = "";
            if (selectAll) selectAll.disabled = false;
        }
    }

    document.querySelectorAll("input[name='mode']").forEach(radio => {
        radio.addEventListener("change", handleModeChange);
    });

    if (isCustomMode()) render();
})();
