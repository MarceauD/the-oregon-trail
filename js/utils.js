// Utilitaires généraux
function isMobile() {
    return window.innerWidth <= 768;
}

// Rendre un modal déplaçable
function makeDraggable(modalElement, headerElement) {
    let isDragging = false;
    let offsetX, offsetY;

    headerElement.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - modalElement.offsetLeft;
        offsetY = e.clientY - modalElement.offsetTop;
        headerElement.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let newTop = e.clientY - offsetY;
        let newLeft = e.clientX - offsetX;
        if (newTop < 0) newTop = 0;
        modalElement.style.left = `${newLeft}px`;
        modalElement.style.top = `${newTop}px`;
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        headerElement.style.cursor = 'move';
    });
}

// Retour en haut
document.addEventListener('DOMContentLoaded', () => {
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) backToTopBtn.classList.add('visible');
            else backToTopBtn.classList.remove('visible');
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Raccourcis clavier (Alt + Num)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modalOverlay = document.getElementById('modal-overlay');
            if (modalOverlay && modalOverlay.classList.contains('active') && typeof closeModal === 'function') {
                closeModal();
            }
        }
        if (e.altKey) {
            e.preventDefault();
            switch (e.key) {
                case '&': showSection('character'); break;
                case 'é': showSection('npcs'); break;
                case '"': showSection('threads'); break;
                case '\'': showSection('journal'); break;
                case '(': showSection('tables'); break;
                case '-': showSection('map'); break;
                case 'è': showSection('gallery'); break;
            }
        }
    });
});

// Lanceur de dé
document.addEventListener('DOMContentLoaded', () => {
    const diceRollerContainer = document.getElementById('dice-roller-container');
    const diceButton = document.getElementById('dice-roller-button');
    const diceOverlay = document.getElementById('dice-overlay');
    const diceCube = document.getElementById('dice-cube');

    if (diceButton) {
        diceButton.addEventListener('click', (event) => {
            event.stopPropagation();
            diceRollerContainer.classList.toggle('open');
        });
        document.addEventListener('click', () => {
            if (diceRollerContainer.classList.contains('open')) {
                diceRollerContainer.classList.remove('open');
            }
        });

        window.rollDice = function (sides) {
            diceRollerContainer.classList.remove('open');
            diceOverlay.classList.add('show');
            diceCube.classList.remove('rolling');
            diceCube.textContent = '?';
            void diceCube.offsetWidth;
            diceCube.classList.add('rolling');

            setTimeout(() => {
                const result = Math.floor(Math.random() * sides) + 1;
                diceCube.textContent = result;
            }, 1000);
        }

        diceOverlay.addEventListener('click', () => {
            diceOverlay.classList.remove('show');
        });
    }
});

function showSection(sectionId) {
    const contentSections = document.querySelectorAll('.content-section');
    const navButtons = document.querySelectorAll('.nav-button');

    contentSections.forEach(section => section.classList.remove('active'));
    navButtons.forEach(button => button.classList.remove('active'));

    document.getElementById(sectionId).classList.add('active');
    const btn = document.querySelector(`.nav-button[onclick="showSection('${sectionId}')"]`);
    if (btn) btn.classList.add('active');

    if (sectionId === 'map' && typeof renderRoute === 'function') renderRoute();
    else if (sectionId === 'gallery' && typeof renderGallery === 'function') renderGallery();
}

function renderGallery() {
    const container = document.getElementById('gallery-container');
    if (!container) return;
    container.innerHTML = '';
    imageGalleryList.forEach(imageName => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'gallery-item';
        const imagePath = `images/${imageName}`;
        itemDiv.innerHTML = `
            <img src="${imagePath}" alt="${imageName}">
            <div class="gallery-item-path">${imagePath}</div>
        `;
        container.appendChild(itemDiv);
    });
}

window.copyToClipboard = function (text) {
    navigator.clipboard.writeText(text).then(() => {
        alert(`Chemin "${text}" copié dans le presse-papiers !`);
    }).catch(err => {
        console.error("Erreur de copie : ", err);
    });
}

window.showPdf = function (fileName) {
    const pdfViewer = document.getElementById('pdf-viewer');
    if (pdfViewer) {
        pdfViewer.src = `pdfs/${fileName}`;
    }
}
