// highlight.js - подсветка блоков и шагов по поисковому запросу
(function() {
    console.log('highlight.js загружен (версия 2.0)');

    // --- Функции для работы с куками (более надежный способ передачи данных между страницами) ---
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

    // Получаем поисковый запрос из параметров URL (для страниц процедур)
    const urlParams = new URLSearchParams(window.location.search);
    let searchTerm = urlParams.get('search');
    
    // Если в URL нет параметра, пробуем получить из куки (на случай перехода не по ссылке)
    if (!searchTerm) {
        searchTerm = getCookie('searchTerm');
    }

    if (!searchTerm) {
        console.log('Нет параметра search в URL и в куках');
        return;
    }

    // Декодируем и очищаем поисковый запрос
    searchTerm = decodeURIComponent(searchTerm).toLowerCase().trim();
    if (!searchTerm) return;
    
    // Сохраняем поисковый запрос в куки для надежности
    setCookie('searchTerm', searchTerm, 1);
    
    console.log('Ищем (из URL или кук):', searchTerm);

    // --- Добавление CSS-классов для подсветки, если их ещё нет ---
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

    // --- Функция для проверки, содержит ли элемент искомый текст ---
    // Ищет как в текстовом содержимом, так и в значениях атрибутов
    function containsSearchTerm(element, term) {
        if (!element) return false;
        
        // Проверяем текстовое содержимое
        if (element.textContent && element.textContent.toLowerCase().includes(term)) {
            return true;
        }
        
        // Проверяем некоторые ключевые атрибуты, если они есть
        const attributesToCheck = ['data-step', 'data-proc-id', 'data-num', 'data-name'];
        for (let attr of attributesToCheck) {
            const attrValue = element.getAttribute(attr);
            if (attrValue && attrValue.toLowerCase().includes(term)) {
                return true;
            }
        }
        
        return false;
    }

    // --- Функция для глубокой проверки наличия текста (используется для панели деталей) ---
    function containsTextDeep(node, term) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.toLowerCase().includes(term);
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                   !['SCRIPT', 'STYLE'].includes(node.tagName)) {
            for (let child of node.childNodes) {
                if (containsTextDeep(child, term)) return true;
            }
        }
        return false;
    }

    // --- Логика подсветки ---
    
    // 1. Подсвечиваем карточки на странице
    // Ищем как карточки процедур (`.proc-card`), так и шаги (`.step-card`)
    const cards = document.querySelectorAll('.proc-card, .step-card');
    let foundElements = [];

    cards.forEach(card => {
        if (containsSearchTerm(card, searchTerm)) {
            card.classList.add('highlight-card');
            foundElements.push(card);
        } else {
            card.classList.remove('highlight-card');
        }
    });

    // 2. Подсветка детальной панели (если она есть и содержит текст)
    const detailPanel = document.getElementById('detailPanel');
    if (detailPanel) {
        // Для панели деталей используем глубокий поиск, так как там много вложенного текста
        if (containsTextDeep(detailPanel, searchTerm)) {
            detailPanel.classList.add('highlight-panel');
        } else {
            detailPanel.classList.remove('highlight-panel');
        }
    }

    const foundCount = foundElements.length;
    console.log(`Найдено элементов: ${foundCount}`);

    // --- UI для навигации по найденным элементам ---
    if (foundCount > 0) {
        // Плавный скролл к первому найденному элементу
        setTimeout(() => {
            foundElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        // Создаем уведомление
        const notice = document.createElement('div');
        notice.textContent = `🔍 Найдено совпадений: ${foundCount}`;
        notice.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #f6b83e;
            color: #0a1929; padding: 10px 20px; border-radius: 40px;
            font-size: 0.85rem; font-weight: 500; z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: inherit;
        `;
        document.body.appendChild(notice);

        // Кнопка "Следующий элемент"
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
            
            // Визуально выделяем текущий элемент
            foundElements.forEach(el => el.style.outline = '');
            foundElements[currentIndex].style.outline = '3px solid red';
            setTimeout(() => foundElements[currentIndex].style.outline = '', 1000);
        };
        document.body.appendChild(nextBtn);

        // Автоматическое скрытие уведомления и кнопки через 8 секунд
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                notice.remove();
                nextBtn.remove();
            }, 400);
        }, 8000);
    } else {
        // Уведомление, если ничего не найдено
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
})();
