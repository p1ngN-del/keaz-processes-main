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
        
        // Проверяем текстовое содержимое
        if (element.textContent && element.textContent.toLowerCase().includes(term)) {
            return true;
        }
        
        // Проверяем атрибуты
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
    // Например, из "proc26.html" -> "26"
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
            
            // 1. Подсвечиваем DOM-элементы (шаги), если они содержат слово
            const cards = document.querySelectorAll('.step-card, .proc-card');
            let foundElements = [];

            cards.forEach(card => {
                // Пропускаем карточки внутри детальной панели для навигации
                if (card.closest('#detailPanel')) {
                    return;
                }
                
                const isVisible = !!(card.offsetWidth || card.offsetHeight || card.getClientRects().length);
                if (!isVisible) return;

                if (containsSearchTermInDOM(card, searchTerm)) {
                    card.classList.add('highlight-card');
                    foundElements.push(card);
                } else {
                    card.classList.remove('highlight-card');
                }
            });

            // 2. Подсветка панели детализации
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

            // --- Показываем результат ---
            if (foundCount > 0) {
                // Есть подсвеченные шаги
                showNavigationUI(foundElements, foundCount);
            } else if (foundInJSON) {
                // В DOM не нашли, но в JSON слово есть
                showInfoMessage(`🔍 Слово "${searchTerm}" найдено в полном тексте процедуры, но не в названиях шагов.`);
            } else {
                // Нигде не найдено
                showNoResultsMessage(searchTerm);
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки procedures_data.json:', error);
            // Fallback: просто ищем в DOM
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
            
            if (foundElements.length > 0) {
                showNavigationUI(foundElements, foundElements.length);
            } else {
                showNoResultsMessage(searchTerm);
            }
        });

    // --- UI: Навигация по найденным элементам ---
    function showNavigationUI(foundElements, foundCount) {
        setTimeout(() => {
            foundElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        const notice = document.createElement('div');
        notice.textContent = `🔍 Найдено совпадений в шагах: ${foundCount}`;
        notice.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #f6b83e;
            color: #0a1929; padding: 10px 20px; border-radius: 40px;
            font-size: 0.85rem; font-weight: 500; z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: inherit;
        `;
        document.body.appendChild(notice);

        let currentIndex = 0;
        const nextBtn = document.createElement('div');
        nextBtn.textContent = '↓';
        nextBtn.title = 'Следующее совпадение';
        nextBtn.style.cssText = `
            position: fixed; bottom: 90px; right: 20px; background: #0a1929;
            color: #f6b83e; width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 1.4rem; z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: all 0.2s;
        `;
        nextBtn.onmouseenter = () => nextBtn.style.transform = 'scale(1.1)';
        nextBtn.onmouseleave = () => nextBtn.style.transform = 'scale(1)';
        nextBtn.onclick = () => {
            if (foundElements.length === 0) return;
            currentIndex = (currentIndex + 1) % foundElements.length;
            foundElements[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            foundElements.forEach(el => el.style.outline = '');
            foundElements[currentIndex].style.outline = '3px solid red';
            setTimeout(() => foundElements[currentIndex].style.outline = '', 1000);
        };
        document.body.appendChild(nextBtn);

        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                notice.remove();
                nextBtn.remove();
            }, 400);
        }, 8000);
    }

    function showInfoMessage(message) {
        const notice = document.createElement('div');
        notice.textContent = message;
        notice.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #f6b83e;
            color: #0a1929; padding: 10px 20px; border-radius: 40px;
            font-size: 0.85rem; font-weight: 500; z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: inherit;
        `;
        document.body.appendChild(notice);
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => notice.remove(), 400);
        }, 5000);
    }

    function showNoResultsMessage(term) {
        const notice = document.createElement('div');
        notice.textContent = `🔍 По запросу "${term}" ничего не найдено`;
        notice.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #6c757d;
            color: white; padding: 10px 20px; border-radius: 40px;
            font-size: 0.85rem; font-weight: 500; z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: inherit;
        `;
        document.body.appendChild(notice);
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => notice.remove(), 400);
        }, 3000);
    }
})();
