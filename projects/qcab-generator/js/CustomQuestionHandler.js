// CustomQuestionHandler.js
// Handles the "Add Own Questions" mode independently from populateQuestions.js.
// Exposes: window.getCustomQuestions() and window.isCustomQuestionMode()

(function () {
    "use strict";

    const filtersDiv = document.getElementById("filters");
    const table = document.getElementById("questionsTable");
    const selectAll = document.getElementById("selectAll");
    const summaryDiv = document.getElementById("selectedSummary");
    const generateButton = document.getElementById("generateQCAB");

    if (!filtersDiv || !table) {
        console.error("CustomQuestionHandler: required DOM elements not found.");
        return;
    }

    let customQuestions = [];
    let editingId = null;
    let customIdCounter = 1;

    function isCustomMode() {
        const selected = document.querySelector("input[name='mode']:checked");
        return selected && selected.value === "custom";
    }

    window.isCustomQuestionMode = isCustomMode;

    window.getCustomQuestions = function () {
        return customQuestions.map(q => ({ ...q }));
    };

    function clearCustomSummary() {
        if (!summaryDiv) return;
        summaryDiv.style.display = "none";
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
                        <textarea id="customQuestionText" rows="5"
                            placeholder="Enter your question..." required></textarea>
                    </div>

                    <div class="custom-fields-row">
                        <div class="custom-field">
                            <label for="customMarks">Marks</label>
                            <input id="customMarks" type="number" min="1" max="1000"
                                step="1" value="10" required>
                        </div>

                        <div class="custom-field">
                            <label for="customPages">Answer Pages</label>
                            <input id="customPages" type="number" min="1" max="100"
                                step="1" value="2" required>
                            <small>You control the exact answer space.</small>
                        </div>

                        <div class="custom-field">
                            <label for="customWordLimit">Word Limit <span>(optional)</span></label>
                            <input id="customWordLimit" type="number" min="1" max="10000"
                                step="1" placeholder="e.g. 150">
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
        const textInput = document.getElementById("customQuestionText");
        const marksInput = document.getElementById("customMarks");
        const pagesInput = document.getElementById("customPages");
        const wordInput = document.getElementById("customWordLimit");
        const errorDiv = document.getElementById("customQuestionError");

        form.addEventListener("submit", function (event) {
            event.preventDefault();

            const questionText = textInput.value.trim();
            const marks = Number(marksInput.value);
            const pages = Number(pagesInput.value);
            const wordLimit = wordInput.value.trim() === "" ? null : Number(wordInput.value);

            const errors = [];

            if (!questionText) errors.push("Please enter a question.");
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

            const question = {
                id: editingId || `custom_${customIdCounter++}`,
                question_id: editingId || `CUSTOM_${customIdCounter}`,
                question_text: questionText,
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

            render();
        });

        const cancelButton = document.getElementById("cancelCustomEdit");
        if (cancelButton) {
            cancelButton.addEventListener("click", function () {
                editingId = null;
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
            items.innerHTML = `
                <div class="custom-empty-state">
                    Add your first question above to build the QCAB.
                </div>
            `;
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

            const text = document.createElement("div");
            text.className = "custom-question-text";
            text.textContent = q.question_text;

            const meta = document.createElement("div");
            meta.className = "custom-question-meta";

            const marks = document.createElement("span");
            marks.textContent = `${q.marks} Marks`;

            const pages = document.createElement("span");
            pages.textContent = `${q.pages} Page${q.pages === 1 ? "" : "s"}`;

            meta.appendChild(marks);
            meta.appendChild(pages);

            if (q.word_limit) {
                const words = document.createElement("span");
                words.textContent = `${q.word_limit} Words`;
                meta.appendChild(words);
            }

            content.appendChild(text);
            content.appendChild(meta);

            const actions = document.createElement("div");
            actions.className = "custom-question-actions";

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "custom-small-button";
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => {
                editingId = q.id;
                render();
                document.getElementById("customQuestionText").focus();
                document.getElementById("customQuestionText").scrollIntoView({ behavior: "smooth", block: "center" });
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "custom-small-button custom-delete-button";
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => {
                customQuestions = customQuestions.filter(item => item.id !== q.id);
                if (editingId === q.id) editingId = null;
                render();
            });

            const upButton = document.createElement("button");
            upButton.type = "button";
            upButton.className = "custom-small-button";
            upButton.textContent = "↑";
            upButton.title = "Move question up";
            upButton.disabled = index === 0;
            upButton.addEventListener("click", () => {
                if (index === 0) return;
                [customQuestions[index - 1], customQuestions[index]] =
                    [customQuestions[index], customQuestions[index - 1]];
                render();
            });

            const downButton = document.createElement("button");
            downButton.type = "button";
            downButton.className = "custom-small-button";
            downButton.textContent = "↓";
            downButton.title = "Move question down";
            downButton.disabled = index === customQuestions.length - 1;
            downButton.addEventListener("click", () => {
                if (index === customQuestions.length - 1) return;
                [customQuestions[index], customQuestions[index + 1]] =
                    [customQuestions[index + 1], customQuestions[index]];
                render();
            });

            actions.appendChild(upButton);
            actions.appendChild(downButton);
            actions.appendChild(editButton);
            actions.appendChild(deleteButton);

            card.appendChild(number);
            card.appendChild(content);
            card.appendChild(actions);
            items.appendChild(card);
        });
    }

    function handleModeChange() {
        if (isCustomMode()) {
            render();
        } else {
            // Restore controls owned by the existing PYQ mode.
            table.style.display = "";
            if (selectAll) selectAll.disabled = false;
        }
    }

    document.querySelectorAll("input[name='mode']").forEach(radio => {
        radio.addEventListener("change", handleModeChange);
    });

    // In case the page starts in custom mode in a future version.
    if (isCustomMode()) render();
})();
