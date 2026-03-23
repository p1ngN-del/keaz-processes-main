// highlight.js - подсветка блоков, а не текста
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
    
    // Функция проверки, содержит ли элемент искомый текст
    function containsText(node, term) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent.toLowerCase().includes(term);
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                   !['SCRIPT', 'STYLE'].includes(node.tagName)) {
            for (let child of node.childNodes) {
                if (containsText(child, term)) return true;
            }
        }
        return false;
    }
    
    // Подсвечиваем блоки .step-card, где есть искомый текст
    const cards = document.querySelectorAll('.step-card');
    let foundCount = 0;
    
    cards.forEach(card => {
        if (containsText(card, searchTerm)) {
            card.style.border = '3px solid #f6b83e';
            card.style.backgroundColor = '#fff9e6';
            card.style.boxShadow = '0 0 0 3px rgba(246, 184, 62, 0.2), 0 4px 12px rgba(0,0,0,0.1)';
            card.style.transition = 'all 0.2s';
            foundCount++;
        } else {
            // Восстанавливаем исходный стиль (убираем подсветку)
            card.style.border = '';
            card.style.backgroundColor = '';
            card.style.boxShadow = '';
        }
    });
    
    // Также проверяем детальную панель, если открыта
    const detailPanel = document.getElementById('detailPanel');
    if (detailPanel && containsText(detailPanel, searchTerm)) {
        detailPanel.style.border = '3px solid #f6b83e';
        detailPanel.style.backgroundColor = '#fff9e6';
        detailPanel.style.transition = 'all 0.2s';
    }
    
    console.log('Найдено блоков:', foundCount);
    
    if (foundCount > 0) {
        const notice = document.createElement('div');
        notice.textContent = `🔍 Найдено ${foundCount} блоков по запросу "${searchTerm}"`;
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
