// highlight.js - подсветка без поломки обработчиков
(function() {
    console.log('highlight.js загружен');
    
    const urlParams = new URLSearchParams(window.location.search);
    let searchTerm = urlParams.get('search');
    
    if (!searchTerm) {
        console.log('Нет параметра search в URL');
        return;
    }
    
    searchTerm = decodeURIComponent(searchTerm).toLowerCase();
    console.log('Ищем:', searchTerm);
    
    // Функция для подсветки без замены узлов (сохраняет обработчики)
    function highlightTextSafe(node, term) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const lowerText = text.toLowerCase();
            const index = lowerText.indexOf(term);
            
            if (index !== -1) {
                // Создаём временный контейнер
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
                   !['SCRIPT', 'STYLE', 'MARK', 'A'].includes(node.tagName) &&
                   !node.hasAttribute('onclick')) {
            // Пропускаем элементы с onclick и ссылки, чтобы не ломать обработчики
            const children = Array.from(node.childNodes);
            for (let child of children) {
                highlightTextSafe(child, term);
            }
        }
        return false;
    }
    
    // Запускаем подсветку (обойдёт step-card с onclick, чтобы их не сломать)
    const cards = document.querySelectorAll('.step-card');
    cards.forEach(card => {
        // Сохраняем исходный onclick
        const originalOnclick = card.getAttribute('onclick');
        // Временно удаляем атрибут, чтобы подсветка не сломала
        if (originalOnclick) {
            card.removeAttribute('onclick');
        }
        // Подсвечиваем текст внутри карточки
        highlightTextSafe(card, searchTerm);
        // Восстанавливаем onclick
        if (originalOnclick) {
            card.setAttribute('onclick', originalOnclick);
        }
    });
    
    // Также подсвечиваем текст в детальной панели, если она открыта
    const detailPanel = document.getElementById('detailPanel');
    if (detailPanel) {
        highlightTextSafe(detailPanel, searchTerm);
    }
    
    const marks = document.querySelectorAll('mark');
    const count = marks.length;
    console.log('Найдено совпадений:', count);
    
    if (count > 0) {
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
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(notice);
        setTimeout(() => notice.remove(), 4000);
    }
})();
