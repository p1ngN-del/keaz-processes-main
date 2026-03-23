// highlight.js - подсветка поискового запроса на странице процедуры
(function() {
    // Получаем поисковый запрос из URL
    const urlParams = new URLSearchParams(window.location.search);
    let searchTerm = urlParams.get('search');
    
    // Если нет в URL, пробуем взять из localStorage (на случай, если перешли не по ссылке)
    if (!searchTerm) {
        searchTerm = localStorage.getItem('searchTerm');
    }
    
    if (!searchTerm) {
        console.log('Нет поискового запроса');
        return;
    }
    
    // Декодируем
    searchTerm = decodeURIComponent(searchTerm);
    console.log('Подсветка:', searchTerm);
    
    // Экранируем спецсимволы для регулярного выражения
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    
    // Функция подсветки текста внутри элемента (рекурсивно обходит узлы)
    function highlightNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (regex.test(text)) {
                // Сбрасываем lastIndex, так как test его сдвинул
                regex.lastIndex = 0;
                const span = document.createElement('span');
                let lastIndex = 0;
                let match;
                
                // Находим все совпадения
                while ((match = regex.exec(text)) !== null) {
                    // Текст до совпадения
                    const before = text.substring(lastIndex, match.index);
                    if (before) {
                        span.appendChild(document.createTextNode(before));
                    }
                    // Само совпадение (оборачиваем в mark)
                    const mark = document.createElement('mark');
                    mark.style.backgroundColor = '#f6b83e';
                    mark.style.color = '#0a1929';
                    mark.style.padding = '0 2px';
                    mark.style.borderRadius = '4px';
                    mark.style.fontWeight = '500';
                    mark.textContent = match[0];
                    span.appendChild(mark);
                    
                    lastIndex = match.index + match[0].length;
                }
                // Текст после последнего совпадения
                const after = text.substring(lastIndex);
                if (after) {
                    span.appendChild(document.createTextNode(after));
                }
                
                node.parentNode.replaceChild(span, node);
                return true;
            }
        } else if (node.nodeType === Node.ELEMENT_NODE && 
                   !['SCRIPT', 'STYLE', 'MARK'].includes(node.tagName)) {
            // Проходим по дочерним узлам в обратном порядке, чтобы не ломать итерацию
            const children = Array.from(node.childNodes);
            for (let i = children.length - 1; i >= 0; i--) {
                highlightNode(children[i]);
            }
        }
        return false;
    }
    
    // Запускаем подсветку
    highlightNode(document.body);
    
    // Считаем количество подсвеченных элементов
    const marks = document.querySelectorAll('mark');
    const count = marks.length;
    
    if (count > 0) {
        // Показываем уведомление
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
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: inherit;
        `;
        notice.innerHTML = `🔍 Найдено ${count} совпадений по запросу "${searchTerm}"`;
        document.body.appendChild(notice);
        
        // Автоматически скрываем через 4 секунды
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => notice.remove(), 400);
        }, 4000);
        
        // Добавляем кнопку прокрутки к следующему совпадению (опционально)
        let currentMarkIndex = 0;
        const scrollBtn = document.createElement('div');
        scrollBtn.style.cssText = `
            position: fixed;
            bottom: 90px;
            right: 20px;
            background: #0a1929;
            color: #f6b83e;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 1.2rem;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            font-family: monospace;
        `;
        scrollBtn.innerHTML = '↓';
        scrollBtn.title = 'Перейти к следующему совпадению';
        scrollBtn.onclick = () => {
            if (marks.length === 0) return;
            marks[currentMarkIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            marks.forEach(m => m.style.backgroundColor = '#f6b83e');
            marks[currentMarkIndex].style.backgroundColor = '#ffaa33';
            currentMarkIndex = (currentMarkIndex + 1) % marks.length;
        };
        document.body.appendChild(scrollBtn);
    }
})();
