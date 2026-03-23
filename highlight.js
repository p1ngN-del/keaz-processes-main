// highlight.js - яркая подсветка блоков
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
    let foundCards = [];
    
    cards.forEach(card => {
        if (containsText(card, searchTerm)) {
            // Яркая подсветка
            card.style.border = '3px solid #f6b83e';
            card.style.backgroundColor = '#fff3cf';
            card.style.boxShadow = '0 0 0 3px rgba(246, 184, 62, 0.4), 0 8px 20px rgba(0,0,0,0.15)';
            card.style.transition = 'all 0.3s ease';
            card.style.transform = 'scale(1.02)';
            card.style.zIndex = '10';
            foundCount++;
            foundCards.push(card);
        } else {
            // Восстанавливаем исходный стиль
            card.style.border = '';
            card.style.backgroundColor = '';
            card.style.boxShadow = '';
            card.style.transform = '';
            card.style.zIndex = '';
        }
    });
    
    // Плавный скролл к первому найденному блоку
    if (foundCards.length > 0) {
        setTimeout(() => {
            foundCards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
    
    // Также проверяем детальную панель, если открыта
    const detailPanel = document.getElementById('detailPanel');
    if (detailPanel && containsText(detailPanel, searchTerm)) {
        detailPanel.style.border = '3px solid #f6b83e';
        detailPanel.style.backgroundColor = '#fff3cf';
        detailPanel.style.boxShadow = '0 0 0 3px rgba(246, 184, 62, 0.4), 0 8px 20px rgba(0,0,0,0.15)';
        detailPanel.style.transition = 'all 0.3s ease';
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
            padding: 10px 20px;
            border-radius: 40px;
            font-size: 0.85rem;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-family: inherit;
        `;
        document.body.appendChild(notice);
        
        // Кнопка "Следующий блок"
        let currentIndex = 0;
        const nextBtn = document.createElement('div');
        nextBtn.textContent = '↓';
        nextBtn.title = 'Следующий блок';
        nextBtn.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            background: #0a1929;
            color: #f6b83e;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 1.4rem;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            transition: all 0.2s;
        `;
        nextBtn.onmouseenter = () => nextBtn.style.transform = 'scale(1.1)';
        nextBtn.onmouseleave = () => nextBtn.style.transform = 'scale(1)';
        nextBtn.onclick = () => {
            if (foundCards.length === 0) return;
            // Снимаем дополнительную подсветку с предыдущего
            foundCards.forEach(c => c.style.border = '3px solid #f6b83e');
            currentIndex = (currentIndex + 1) % foundCards.length;
            foundCards[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Временно усиливаем подсветку текущего
            foundCards[currentIndex].style.border = '4px solid #f6b83e';
            foundCards[currentIndex].style.backgroundColor = '#ffe6a3';
            setTimeout(() => {
                foundCards[currentIndex].style.border = '3px solid #f6b83e';
                foundCards[currentIndex].style.backgroundColor = '#fff3cf';
            }, 500);
        };
        document.body.appendChild(nextBtn);
        
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => notice.remove(), 400);
            nextBtn.remove();
        }, 6000);
    }
})();
