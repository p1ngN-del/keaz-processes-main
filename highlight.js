// highlight.js - подсветка блоков по data-атрибуту
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
    
    // Сначала проходим по всем step-card и добавляем им data-search-text
    const cards = document.querySelectorAll('.step-card');
    cards.forEach(card => {
        // Собираем весь текст из карточки (включая дочерние элементы)
        const fullText = card.textContent.toLowerCase();
        card.setAttribute('data-search-text', fullText);
    });
    
    let foundCards = [];
    
    cards.forEach(card => {
        const text = card.getAttribute('data-search-text');
        if (text && text.includes(searchTerm)) {
            // Яркая подсветка
            card.style.border = '3px solid #f6b83e';
            card.style.backgroundColor = '#fff3cf';
            card.style.boxShadow = '0 0 0 3px rgba(246, 184, 62, 0.4), 0 8px 20px rgba(0,0,0,0.15)';
            card.style.transition = 'all 0.3s ease';
            card.style.transform = 'scale(1.02)';
            card.style.zIndex = '10';
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
    
    // Подсветка детальной панели
    const detailPanel = document.getElementById('detailPanel');
    if (detailPanel) {
        const panelText = detailPanel.textContent.toLowerCase();
        if (panelText.includes(searchTerm)) {
            detailPanel.style.border = '3px solid #f6b83e';
            detailPanel.style.backgroundColor = '#fff3cf';
            detailPanel.style.boxShadow = '0 0 0 3px rgba(246, 184, 62, 0.4), 0 8px 20px rgba(0,0,0,0.15)';
            detailPanel.style.transition = 'all 0.3s ease';
        }
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
            foundCards[currentIndex].style.border = '4px solid #f6b83e';
            foundCards[currentIndex].style.backgroundColor = '#ffe6a3';
            setTimeout(() => {
                foundCards[currentIndex].style.border = '3px solid #f6b83e';
                foundCards[currentIndex].style.backgroundColor = '#fff3cf';
            }, 500);
        };
        document.body.appendChild(nextBtn);
        
        // Автоудаление через 6 секунд
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => notice.remove(), 400);
            nextBtn.remove();
        }, 6000);
    }
})();
