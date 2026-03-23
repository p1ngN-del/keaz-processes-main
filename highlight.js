// highlight.js - подсветка блоков через CSS-класс
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
    
    // Добавляем CSS-класс для подсветки, если его ещё нет
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
    
    // Подсвечиваем блоки .step-card
    const cards = document.querySelectorAll('.step-card');
    let foundCards = [];
    
    cards.forEach(card => {
        if (containsText(card, searchTerm)) {
            card.classList.add('highlight-card');
            foundCards.push(card);
        } else {
            card.classList.remove('highlight-card');
        }
    });
    
    // Подсветка детальной панели
    const detailPanel = document.getElementById('detailPanel');
    if (detailPanel && containsText(detailPanel, searchTerm)) {
        detailPanel.classList.add('highlight-panel');
    } else if (detailPanel) {
        detailPanel.classList.remove('highlight-panel');
    }
    
    const foundCount = foundCards.length;
    console.log('Найдено блоков:', foundCount);
    
    if (foundCount > 0) {
        // Плавный скролл к первому
        setTimeout(() => {
            foundCards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        
        // Уведомление
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
            currentIndex = (currentIndex + 1) % foundCards.length;
            foundCards[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Временно усиливаем подсветку
            foundCards[currentIndex].classList.add('highlight-card');
            foundCards[currentIndex].style.transform = 'scale(1.03)';
            setTimeout(() => {
                foundCards[currentIndex].style.transform = '';
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
