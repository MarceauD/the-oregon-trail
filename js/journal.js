document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('journal-entry-text')) {
        tinymce.init({
            selector: '#journal-entry-text',
            license_key: 'gpl',
            plugins: 'lists link image table code help wordcount fullscreen',
            toolbar: 'bold italic underline | blocks | link image | alignleft aligncenter alignright | fullscreen',
            language: 'fr_FR',
            menubar: false,
            skin: 'oxide-dark',
            content_css: 'dark',
            content_style: `
                body { 
                    background-color: #191922; 
                    color: #E2E8F0;
                    font-family: 'Lora', serif;
                    font-size: 1.1em; 
                    line-height: 1.7; 
                }
                img { max-width: 100%; height: auto; display: block; margin: 10px 0; border-radius: 8px; }
                h1, h2, h3 { color: #E2E8F0; font-family: 'Merriweather', serif; }
                a { color: #F59E0B; }
            `,
        });
    }
});

function renderJournal() {
    const journalContent = document.getElementById('journal-content');
    if (!journalContent) return;
    journalContent.innerHTML = '';
    const sortedJournal = [...gameState.journal].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedJournal.forEach(item => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'journal-entry';
        entryDiv.innerHTML = `
            <div class="journal-header">
                <p class="journal-date">${new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                <div class="button-group">
                    <button class="card-button" onclick="openModal('journal', ${item.id})" title="Modifier">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160V416c0 53 43 96 96 96H352c53 0 96-43 96-96V320c0-17.7-14.3-32-32-32s-32 14.3-32 32v96c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h96c17.7 0 32-14.3 32-32s-14.3-32-32-32H96z"/></svg>
                    </button>
                    <button class="card-button delete-button" onclick="deleteItem('journal', ${item.id})" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg>
                    </button>
                </div>
            </div>
            <div class="journal-content-display">
                ${item.entry} 
            </div>
        `;
        journalContent.appendChild(entryDiv);
    });
}

async function saveJournalEntry(newContent) {
    const id = currentJournalEditId; // vient de main.js
    const journalData = {
        date: (id ? gameState.journal.find(j => j.id === id).date : document.getElementById('journal-date').value),
        entry: newContent
    };

    if (id) {
        const index = gameState.journal.findIndex(j => j.id === id);
        gameState.journal[index] = { ...gameState.journal[index], ...journalData };
    } else {
        journalData.id = Date.now();
        gameState.journal.push(journalData);
    }
    await saveGameData();
    renderJournal();
}

// Mode lecture
document.addEventListener('DOMContentLoaded', () => {
    const readingModeOverlay = document.getElementById('reading-mode-overlay');
    const openReadingModeBtn = document.getElementById('reading-mode-button');
    const closeReadingModeBtn = document.getElementById('reading-mode-close-button');
    const bookContainer = document.getElementById('book-container');
    const pageCounterDisplay = document.getElementById('page-counter-display');
    const pageJumper = document.getElementById('page-jumper');
    const pageJumpInput = document.getElementById('page-jump-input');
    const prevPageBtn = document.getElementById('prev-page-btn');
    const nextPageBtn = document.getElementById('next-page-btn');

    let currentJournalIndex = 0;
    let sortedJournal = [];

    if (!readingModeOverlay) return;

    function displayJournalPage(index, direction = '') {
        currentJournalIndex = index;
        const totalPages = sortedJournal.length;
        const item = sortedJournal[index];
        const date = new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const newBookContent = document.createElement('div');
        newBookContent.className = 'book-content';

        const article = document.createElement('article');
        article.className = 'journal-entry';
        article.innerHTML = `
            <div class="journal-header"><p class="journal-date">${date}</p></div>
            <div class="journal-content-display">${item.entry}</div>
        `;
        newBookContent.appendChild(article);

        const currentContent = bookContainer.querySelector('.book-content');
        if (direction && currentContent) {
            const exitAnimation = direction === 'next' ? 'page-exit-left' : 'page-exit-right';
            const enterAnimation = direction === 'next' ? 'page-enter-right' : 'page-enter-left';
            currentContent.classList.add(exitAnimation);
            newBookContent.classList.add(enterAnimation);
            setTimeout(() => currentContent.remove(), 300);
        } else {
            bookContainer.innerHTML = '';
        }
        bookContainer.appendChild(newBookContent);

        pageCounterDisplay.textContent = `Page ${index + 1} / ${totalPages}`;
        prevPageBtn.disabled = (index === 0);
        nextPageBtn.disabled = (index === totalPages - 1);
    }

    function openReadingMode() {
        sortedJournal = [...gameState.journal].sort((a, b) => new Date(a.date) - new Date(b.date));
        if (sortedJournal.length > 0) {
            displayJournalPage(0);
            readingModeOverlay.classList.add('active');
        } else alert("Le journal est vide.");
    }

    function closeReadingMode() { readingModeOverlay.classList.remove('active'); }

    if (openReadingModeBtn) openReadingModeBtn.addEventListener('click', openReadingMode);
    if (closeReadingModeBtn) closeReadingModeBtn.addEventListener('click', closeReadingMode);

    if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
        if (currentJournalIndex < sortedJournal.length - 1) displayJournalPage(currentJournalIndex + 1, 'next');
    });
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
        if (currentJournalIndex > 0) displayJournalPage(currentJournalIndex - 1, 'prev');
    });

    if (pageJumper) pageJumper.addEventListener('click', () => {
        pageCounterDisplay.style.display = 'none';
        pageJumpInput.style.display = 'inline-block';
        pageJumpInput.value = currentJournalIndex + 1;
        pageJumpInput.focus();
        pageJumpInput.select();
    });

    function handlePageJump() {
        pageCounterDisplay.style.display = 'inline-block';
        pageJumpInput.style.display = 'none';
        let targetPage = parseInt(pageJumpInput.value, 10);
        if (isNaN(targetPage) || targetPage < 1 || targetPage > sortedJournal.length) return;
        const newIndex = targetPage - 1;
        if (newIndex !== currentJournalIndex) {
            displayJournalPage(newIndex, newIndex > currentJournalIndex ? 'next' : 'prev');
        }
    }
    if (pageJumpInput) {
        pageJumpInput.addEventListener('blur', handlePageJump);
        pageJumpInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') handlePageJump(); });
    }

    // Quick View Modal
    const quickViewModal = document.getElementById('quick-view-modal');
    const quickViewTitle = document.getElementById('quick-view-title');
    const quickViewContent = document.getElementById('quick-view-content');
    const quickViewCloseBtn = document.getElementById('quick-view-close-button');

    window.openQuickView = function (type) {
        quickViewContent.innerHTML = '';
        if (type === 'character') {
            quickViewTitle.textContent = 'Fiche de Personnage';
            const characterSheetContent = document.getElementById('character').cloneNode(true);
            characterSheetContent.classList.add('active');
            quickViewContent.appendChild(characterSheetContent);
        } else if (type === 'tables') {
            quickViewTitle.textContent = 'Tables Aléatoires';
            const tablesContent = document.getElementById('tables').cloneNode(true);
            tablesContent.classList.add('active');
            quickViewContent.appendChild(tablesContent);
        }
        quickViewModal.classList.add('active');
    }

    function closeQuickView() {
        quickViewModal.classList.remove('active');
        quickViewContent.innerHTML = '';
    }
    if (quickViewCloseBtn) quickViewCloseBtn.addEventListener('click', closeQuickView);
    if (quickViewModal) makeDraggable(quickViewModal, document.getElementById('quick-view-header'));
});
