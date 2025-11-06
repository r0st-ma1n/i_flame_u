/*----------------------------------------*/
/* Search Functionality Script
/*----------------------------------------*/

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('text-to-find');
    const searchBtn = document.querySelector('.search-btn');

    if (searchInput && searchBtn) {
        searchBtn.addEventListener('click', function() {
            FindOnPage('text-to-find', true);
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                FindOnPage('text-to-find', true);
                e.preventDefault();
            }
        });
    }
});

function FindOnPage(inputId, searchDirection) {
    const input = document.getElementById(inputId);
    const text = input.value.trim();

    if (text === "") {
        alert("Введите текст для поиска");
        return;
    }

    removeHighlights();

    if (!searchDirection) {
        return;
    }

    const elements = document.querySelectorAll('body *:not(script):not(style):not(input):not(textarea)');
    let found = false;

    elements.forEach(element => {
        if (element.children.length === 0 && element.textContent) {
            const content = element.textContent;
            const regex = new RegExp(text, 'gi');

            if (regex.test(content)) {
                found = true;
                const newContent = content.replace(regex, match =>
                    `<span class="highlight">${match}</span>`
                );
                element.innerHTML = newContent;
            }
        }
    });

    const firstMatch = document.querySelector('.highlight');
    if (firstMatch) {
        firstMatch.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        setTimeout(() => {
            firstMatch.style.backgroundColor = '#FFC107';
        }, 500);
    } else {
        alert("Ничего не найдено");
    }
}

// Функция для удаления подсветки
function removeHighlights() {
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        const parent = highlight.parentNode;
        parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
        parent.normalize();
    });
}

function cancelSearch() {
    const searchInput = document.getElementById('text-to-find');
    if (searchInput) {
        searchInput.value = '';
    }
    removeHighlights();
}