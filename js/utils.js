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
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            document.documentElement.scrollTop = 0; // fallback immédiat si smooth behavior bug
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
        showToast(`Chemin "${text}" copié !`, 'success');
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

window.openImagePicker = function (targetId) {
    const overlay = document.getElementById('image-picker-overlay');
    const grid = document.getElementById('image-picker-grid');
    if (!overlay || !grid) return;

    grid.innerHTML = '';
    imageGalleryList.forEach(imageName => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'gallery-item';
        itemDiv.style.cursor = 'pointer';
        const imagePath = `images/${imageName}`;
        itemDiv.innerHTML = `
            <img src="${imagePath}" alt="${imageName}">
            <div class="gallery-item-path">${imageName}</div>
        `;
        itemDiv.onclick = () => selectImage(imagePath, targetId);
        grid.appendChild(itemDiv);
    });

    overlay.style.display = 'flex';
};

window.closeImagePicker = function () {
    document.getElementById('image-picker-overlay').style.display = 'none';
};

window.selectImage = async function (path, targetId) {
    if (targetId === 'character-portrait') {
        gameState.character.portrait = path;
        const display = document.getElementById('character-portrait-display');
        if (display) display.style.backgroundImage = `url('${path}')`;
        await saveGameData();
        if (typeof initCampaignBubbles === 'function') initCampaignBubbles();
    } else {
        const input = document.getElementById(targetId);
        if (input) input.value = path;
    }
    closeImagePicker();
};

window.handleImageUpload = function (fileInput, targetId) {
    // Gardé temporairement pour compatibilité si nécessaire, 
    // mais la bibliothèque du projet est désormais prioritaire.
    if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 300;
                let width = img.width;
                let height = img.height;
                if (width > MAX_WIDTH) {
                    height = Math.round((height * MAX_WIDTH) / width);
                    width = MAX_WIDTH;
                }
                canvas.width = !!width ? width : 100;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL('image/jpeg', 0.8);

                if (typeof targetId === 'string' && document.getElementById(targetId)) {
                    const el = document.getElementById(targetId);
                    if (el.tagName === 'INPUT') el.value = base64;
                    else el.style.backgroundImage = `url('${base64}')`;
                }
                return base64;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
    }
};

// Système de Toasts
window.showToast = function (message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // Auto-suppression après 3.5s
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

