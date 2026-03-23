// Подсветка поискового запроса на странице процедуры
(function() {
    // Получаем поисковый запрос из URL или из localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let searchTerm = urlParams.get('search');
    
    // Если нет в URL, пробуем взять из localStorage
    if (!searchTerm) {
        searchTerm = localStorage.getItem('searchTerm');
    }
    
    if (!searchTerm) return;
    
    // Декодируем и приводим к нижнему регистру для поиска
    const searchTermDecoded = decodeURIComponent(searchTerm).toLowerCase();
    
    // Функция для подсветки текста внутри элемента
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
                mark.textContent = match;
                span.appendChild(mark);
                span.appendChild(document.createTextNode(after));
                
                node.parentNode.replaceChild(span, node);
                return true;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                   !['SCRIPT', 'STYLE', 'MARK'].includes(node.tagName)) {
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
    
    // Запускаем подсветку по всему body
    highlightText(document.body, searchTermDecoded);
    
    // Показываем уведомление о найденном
    const count = document.querySelectorAll('mark').length;
    if (count > 0) {
        const notice = document.createElement('div');
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
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notice.innerHTML = `🔍 Найдено ${count} совпадений по запросу "${searchTermDecoded}"`;
        document.body.appendChild(notice);
        
        setTimeout(() => {
            notice.style.opacity = '0';
            setTimeout(() => notice.remove(), 500);
        }, 3000);
    }
})();
