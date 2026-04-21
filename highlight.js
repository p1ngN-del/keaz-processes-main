// highlight.js - подсветка блоков и шагов по поисковому запросу
(function() {
    console.log('highlight.js загружен (версия 3.0 - поиск по JSON)');

    // --- Функции для работы с куками ---
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = name + '=; Max-Age=-99999999; path=/';
    }

    // Получаем поисковый запрос
    const urlParams = new URLSearchParams(window.location.search);
    let searchTerm = urlParams.get('search');
    
    if (!searchTerm) {
        searchTerm = getCookie('searchTerm');
    }

    if (!searchTerm) {
        console.log('Нет параметра search. Выход.');
        deleteCookie('searchTerm');
        return;
    }

    searchTerm = decodeURIComponent(searchTerm).toLowerCase().trim();
    if (!searchTerm) {
        deleteCookie('searchTerm');
        return;
    }
    
    setCookie('searchTerm', searchTerm, 1);
    console.log('Ищем в JSON:', searchTerm);

    // --- Добавление CSS-классов для подсветки ---
    if (!document.getElementById('highlight-styles')) {
        const style = document.createElement('style');
        style.id = 'highlight-styles';
        style.textContent = `
            .highlight-card {
                border: 3px solid #f6b83e !important;
                background-color: #fff3cf !important;
                box-shadow: 0 0 0 3px rgba(246, 184, 62, 0.4), 0 8px 20px rgba(0,0,0,0.15) !important;
                transition: all 0.3s ease !important;
                transform: scale(1.02) !important;
                z-index: 10 !important;
                position: relative !important;
            }
            .highlight-panel {
                border: 3px solid #f6b83e !important;
                background-color: #fff3cf !important;
                box-shadow: 0 0 0 3px rgba(246, 184, 62, 0.4), 0 8px 20px rgba(0,0,0,0.15) !important;
                transition: all 0.3s ease !important;
            }
        `;
        document.head.appendChild(style);
    }

    // --- Вспомогательная функция для проверки текста в элементе и его атрибутах (для DOM) ---
    function containsSearchTermInDOM(element, term) {
        if (!element) return false;
        
        if (element.textContent && element.textContent.toLowerCase().includes(term)) {
            return true;
        }
        
        const attributesToCheck = ['data-step', 'data-proc-id', 'data-num', 'data-name'];
        for (let attr of attributesToCheck) {
            const attrValue = element.getAttribute(attr);
            if (attrValue && attrValue.toLowerCase().includes(term)) {
                return true;
            }
        }
        return false;
    }

    // --- Определяем ID текущей процедуры ---
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    const procId = filename.replace('proc', '').replace('.html', '');
    
    console.log('ID процедуры:', procId);

    // --- Загружаем JSON и ищем ---
    fetch('procedures_data.json')
        .then(response => response.json())
        .then(data => {
            const procedure = data.procedures.find(p => p.id === procId);
            
            if (!procedure) {
                console.log('Процедура не найдена в JSON');
                showNoResultsMessage(searchTerm);
                return;
            }

            const fullText = (procedure.num + ' ' + procedure.name + ' ' + procedure.content).toLowerCase();
            const foundInJSON = fullText.includes(searchTerm);
            
            console.log('Найдено в JSON:', foundInJSON);
            
            const cards = document.querySelectorAll('.step-card, .proc-card');
            let foundElements = [];

            cards.forEach(card => {
                if (card.closest('#detailPanel')) return;
                
                const isVisible = !!(card.offsetWidth || card.offsetHeight || card.getClientRects().length);
                if (!isVisible) return;

                if (containsSearchTermInDOM(card, searchTerm)) {
                    card.classList.add('highlight-card');
                    foundElements.push(card);
                } else {
                    card.classList.remove('highlight-card');
                }
            });

            const detailPanel = document.getElementById('detailPanel');
            const detailText = document.getElementById('detailText');
            if (detailPanel && detailText) {
                if (detailText.textContent.toLowerCase().includes(searchTerm)) {
                    detailPanel.classList.add('highlight-panel');
                } else {
                    detailPanel.classList.remove('highlight-panel');
                }
            }

            const foundCount = foundElements.length;
            console.log(`Найдено в DOM: ${foundCount}`);

            if (foundCount > 0) {
                showNavigationUI(foundElements, foundCount);
            } else if (foundInJSON) {
                showInfoMessage(`🔍 Слово "${searchTerm}" найдено в полном тексте процедуры, но не в названиях шагов.`);
            } else {
                showNoResultsMessage(searchTerm);
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки procedures_data.json:', error);
        });

    function showNavigationUI(foundElements, foundCount) {
        setTimeout(() => foundElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        // ... (остальной код showNavigationUI без изменений)
    }

    function showInfoMessage(message) {
        const notice = document.createElement('div');
        notice.textContent = message;
        notice.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #f6b83e;
            color: #0a1929; padding: 10px 20px; border-radius: 40px;
            font-size: 0.85rem; font-weight: 500; z-index: 10000;
        `;
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 5000);
    }

    function showNoResultsMessage(term) {
        const notice = document.createElement('div');
        notice.textContent = `🔍 По запросу "${term}" ничего не найдено`;
        notice.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #6c757d;
            color: white; padding: 10px 20px; border-radius: 40px;
            font-size: 0.85rem; font-weight: 500; z-index: 10000;
        `;
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 3000);
    }
})();

// ============================================
// AI-АССИСТЕНТ ДЛЯ СТРАНИЦ ПРОЦЕДУР
// ============================================
if (!window.location.pathname.includes('index')) {
    (function() {
        // ... (весь код AI-ассистента, который у вас уже есть, без изменений) ...
    })();
}

// ============================================
// ССЫЛКИ НА ВЫХОДЫ (ТОЛЬКО ДЛЯ ПРОЦЕДУРЫ 4)
// ============================================
(function() {
    if (!window.location.pathname.includes('proc4.html')) return;
    
    const outputs = ['11', '13', '15'];
    
    const waitForShowDetail = setInterval(() => {
        if (typeof window.showDetail === 'function') {
            clearInterval(waitForShowDetail);
            
            const original = window.showDetail;
            window.showDetail = function(stepId) {
                original(stepId);
                
                setTimeout(() => {
                    const detailText = document.getElementById('detailText');
                    if (!detailText) return;
                    
                    // Проверяем, выход ли это (шаги 40, 56, 58)
                    if (stepId === '40' || stepId === '56' || stepId === '58') {
                        let html = detailText.innerHTML;
                        if (!html.includes('Процедура')) {
                            const links = outputs.map(n => 
                                `<a href="proc${n}.html" style="color: #1e6df2; background: #e6f0ff; padding: 2px 8px; border-radius: 20px; text-decoration: none; font-weight: 600; margin: 0 4px;">Процедура ${n}</a>`
                            ).join(', ');
                            html = html.replace('Выход из процедуры', `Выход в процедуры ${links}`);
                            detailText.innerHTML = html;
                        }
                    }
                }, 100);
            };
        }
    }, 200);
})();
