// highlight.js - подсветка блоков и шагов по поисковому запросу (универсальный поиск)
(function() {
    console.log('highlight.js загружен (версия 2.3 - универсальный поиск)');

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
    console.log('Ищем:', searchTerm);

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

    // --- УНИВЕРСАЛЬНАЯ функция проверки ---
    function containsSearchTermUniversal(element, term) {
        if (!element) return false;
        
        // 1. Проверяем ВЕСЬ HTML-контент элемента (включая скрытые блоки)
        // .innerHTML содержит полный HTML, .textContent - весь текст
        if (element.innerHTML && element.innerHTML.toLowerCase().includes(term)) {
            return true;
        }
        
        // 2. Проверяем атрибуты
        const attributesToCheck = ['data-step', 'data-proc-id', 'data-num', 'data-name'];
        for (let attr of attributesToCheck) {
            const attrValue = element.getAttribute(attr);
            if (attrValue && attrValue.toLowerCase().includes(term)) {
                return true;
            }
        }

        // 3. Проверка в глобальном объекте stepData (если он есть)
        let stepId = element.getAttribute('data-step');
        if (stepId) {
            const baseStepId = stepId.split('-')[0];
            
            if (typeof window.stepData !== 'undefined' && window.stepData && window.stepData[baseStepId]) {
                const data = window.stepData[baseStepId];
                // Собираем весь текст из объекта шага
                const fullStepText = (
                    (data.number || '') + ' ' + 
                    (data.role || '') + ' ' + 
                    (data.text || '') + ' ' + 
                    (data.inputs || []).join(' ') + ' ' + 
                    (data.outputs || []).join(' ')
                ).toLowerCase();
                
                if (fullStepText.includes(term)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // --- Логика подсветки ---
    
    const cards = document.querySelectorAll('.step-card, .proc-card');
    let foundElements = [];

    cards.forEach(card => {
        // Пропускаем карточки внутри детальной панели (чтобы кнопка "Далее" не скроллила в закрытый блок)
        if (card.closest('#detailPanel')) {
            // Но если они внутри панели, мы всё равно можем их подсветить, но не добавляем в навигацию
            if (containsSearchTermUniversal(card, searchTerm)) {
                card.classList.add('highlight-card');
            }
            return;
        }
        
        const isVisible = !!(card.offsetWidth || card.offsetHeight || card.getClientRects().length);
        if (!isVisible) return;

        if (containsSearchTermUniversal(card, searchTerm)) {
            card.classList.add('highlight-card');
            foundElements.push(card);
        } else {
            card.classList.remove('highlight-card');
        }
    });

    // Подсветка панели детализации
    const detailPanel = document.getElementById('detailPanel');
    const detailText = document.getElementById('detailText');
    if (detailPanel && detailText) {
        if (detailText.innerHTML.toLowerCase().includes(searchTerm)) {
            detailPanel.classList.add('highlight-panel');
        } else {
            detailPanel.classList.remove('highlight-panel');
        }
    }

    const foundCount = foundElements.length;
    console.log(`Найдено видимых элементов: ${foundCount}`);

    // --- UI (Навигация) ---
    if (foundCount > 0) {
        setTimeout(() => {
            foundElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        const notice = document.createElement('div');
        notice.textContent = `🔍 Найдено совпадений: ${foundCount}`;
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
    } else {
        // Проверяем, может быть слово найдено в скрытых карточках внутри detailPanel?
        const hiddenHighlights = document.querySelectorAll('#detailPanel .highlight-card');
        if (hiddenHighlights.length > 0) {
            const notice = document.createElement('div');
            notice.textContent = `🔍 Совпадения найдены в описании шагов. Откройте панель деталей.`;
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
        } else {
            const notice = document.createElement('div');
            notice.textContent = `🔍 По запросу "${searchTerm}" ничего не найдено`;
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
    }
})();
