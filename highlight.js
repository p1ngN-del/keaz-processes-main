// highlight.js - подсветка поискового запроса
(function() {
    console.log('highlight.js загружен');
    
    // Получаем поисковый запрос из URL
    const urlParams = new URLSearchParams(window.location.search);
    let searchTerm = urlParams.get('search');
    
    if (!searchTerm) {
        console.log('Нет параметра search в URL');
        return;
    }
    
    // Декодируем и приводим к нижнему регистру для поиска
    searchTerm = decodeURIComponent(searchTerm).toLowerCase();
    console.log('Ищем:', searchTerm);
    
    // Функция для подсветки текста
    function highlightText(node, term) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const lowerText = text.toLowerCase();
            const index = lowerText.indexOf(term);
            
            if (index !== -1) {
                const span = document.createElement('span');
                const before = text.substring(0, index);
                const match = text.substring(index, index + term.length);
                const after = text.substring(index + term.length);
                
                span.appendChild(document.createTextNode(before));
                
                const mark = document.createElement('mark');
                mark.style.backgroundColor = '#f6b83e';
                mark.style.color = '#0a1929';
                mark.style.padding = '0 2px';
                mark.style.borderRadius = '4px';
                mark.style.fontWeight = '500';
                mark.textContent = match;
                span.appendChild(mark);
                
                span.appendChild(document.createTextNode(after));
                
                node.parentNode.replaceChild(span, node);
                return true;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                   !['SCRIPT', 'STYLE', 'MARK', 'CODE', 'PRE'].includes(node.tagName)) {
            let changed = false;
            const children = Array.from(node.childNodes);
            for (let child of children) {
                if (highlightText(child, term)) {
                    changed = true;
                }
            }
            return changed;
        }
        return false;
    }
    
    // Запускаем подсветку
    highlightText(document.body, searchTerm);
    
    // Считаем количество подсвеченных элементов
    const marks = document.querySelectorAll('mark');
    const count = marks.length;
    console.log('Найдено совпадений:', count);
    
    if (count > 0) {
        // Показываем уведомление
        const notice = document.createElement('div');
        notice.textContent = `🔍 Найдено ${count} совпадений по запросу "${searchTerm}"`;
        notice.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #f6b83e;
            color: #0a1929;
            padding: 8px 16px;
            border-radius: 40px;
            font-size: 0.8rem;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: inherit;
        `;
        document.body.appendChild(notice);
        
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => notice.remove(), 400);
        }, 4000);
    } else {
        console.log('Совпадений не найдено');
        // Показываем сообщение, что ничего не найдено
        const notice = document.createElement('div');
        notice.textContent = `🔍 Ничего не найдено по запросу "${searchTerm}"`;
        notice.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #e2e8f0;
            color: #1e293b;
            padding: 8px 16px;
            border-radius: 40px;
            font-size: 0.8rem;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 3000);
    }
})();
