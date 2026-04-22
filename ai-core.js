// ai-core.js
// Единый модуль AI-ассистента для всего проекта

(function() {
    // Проверяем, не загружен ли уже модуль
    if (window.AICore) {
        console.log("AI Core уже загружен.");
        return;
    }

    console.log("Загрузка AI Core...");

    // --- Конфигурация ---
    const PROXY_URL = 'https://keeaz-ai-server-production.up.railway.app/api/chat';
    let proceduresFullData = [];

    // --- Вспомогательные функции ---

    // Загрузка данных о процедурах
    async function loadProceduresFullData() {
        if (proceduresFullData.length > 0) {
            return proceduresFullData;
        }
        try {
            const response = await fetch('procedures_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.procedures) {
                proceduresFullData = data.procedures;
                console.log(`✅ [AI Core] Загружено ${proceduresFullData.length} процедур.`);
            } else {
                console.warn("⚠️ [AI Core] Не найден массив 'procedures' в JSON.");
            }
            return proceduresFullData;
        } catch (error) {
            console.error('❌ [AI Core] Ошибка загрузки procedures_data.json:', error);
            return [];
        }
    }

    // Поиск релевантных процедур (УЛУЧШЕННАЯ ВЕРСИЯ)
function findRelevantProcedures(question, maxResults = 5) {
    if (!proceduresFullData || proceduresFullData.length === 0) {
        console.warn('⚠️ [AI Core] Данные процедур ещё не загружены');
        return [];
    }
    
    const questionLower = question.toLowerCase();
    
    // --- НАЧАЛО БЛОКА УЛУЧШЕНИЙ ---

    // 1. Словарь стоп-слов (русские предлоги, союзы, местоимения, которые мешают поиску)
    const stopWords = new Set([
        'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то', 'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за', 'бы', 'по', 'только', 'ее', 'мне', 'было', 'вот', 'от', 'меня', 'еще', 'нет', 'о', 'из', 'ему', 'теперь', 'когда', 'даже', 'ну', 'вдруг', 'ли', 'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибудь', 'опять', 'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей', 'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя', 'их', 'чем', 'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже', 'себе', 'под', 'будет', 'ж', 'тогда', 'кто', 'этот', 'того', 'потому', 'этого', 'какой', 'совсем', 'ним', 'здесь', 'этом', 'один', 'почти', 'мой', 'тем', 'чтобы', 'нее', 'сейчас', 'были', 'куда', 'зачем', 'всех', 'никогда', 'можно', 'при', 'наконец', 'два', 'об', 'другой', 'хоть', 'после', 'над', 'больше', 'тот', 'через', 'эти', 'нас', 'про', 'всего', 'них', 'какая', 'много', 'разве', 'три', 'эту', 'моя', 'впрочем', 'хорошо', 'свою', 'этой', 'перед', 'иногда', 'лучше', 'чуть', 'том', 'нельзя', 'такой', 'им', 'более', 'всегда', 'конечно', 'всю', 'между'
    ]);

    // 2. Словарь морфологических форм для ключевых слов (лемматизация)
    const morphologyMap = {
        'база': ['база', 'базы', 'базе', 'базу', 'базой', 'баз', 'базами', 'базах'],
        'аналог': ['аналог', 'аналоги', 'аналога', 'аналогу', 'аналогом', 'аналоге', 'аналогами', 'аналогах', 'аналогов'],
        'конкурент': ['конкурент', 'конкуренты', 'конкурента', 'конкуренту', 'конкурентом', 'конкуренте', 'конкурентам', 'конкурентами', 'конкурентах'],
        'цена': ['цена', 'цены', 'цене', 'цену', 'ценой', 'цен', 'ценам', 'ценами', 'ценах', 'ценообразование', 'ценообразования'],
        'сертификат': ['сертификат', 'сертификаты', 'сертификата', 'сертификату', 'сертификатом', 'сертификате', 'сертификатам', 'сертификатами', 'сертификатах'],
        'поставщик': ['поставщик', 'поставщики', 'поставщика', 'поставщику', 'поставщиком', 'поставщике', 'поставщикам', 'поставщиками', 'поставщиках', 'oem', 'odm'],
        'вывод': ['вывод', 'выводы', 'вывода', 'выводу', 'выводом', 'выводе', 'выводам', 'выводами', 'выводах', 'вывести', 'выведен'],
        'ввод': ['ввод', 'вводы', 'ввода', 'вводу', 'вводом', 'вводе', 'ввести', 'введен', 'завести', 'создать'],
        'процедура': ['процедура', 'процедуры', 'процедуре', 'процедуру', 'процедурой', 'процедур', 'процедурам', 'процедурами', 'процедурах'],
        'продукт': ['продукт', 'продукты', 'продукта', 'продукту', 'продуктом', 'продукте', 'продуктам', 'продуктами', 'продуктах'],
        'рентабельность': ['рентабельность', 'рентабельности', 'рентабельностью'],
        'контент': ['контент', 'контента', 'контенту', 'контентом', 'контенте'],
        'тнвэд': ['тнвэд', 'тн вэд']
    };

    // Разбиваем запрос на слова
    let rawWords = questionLower.split(/\s+/);
    let searchWords = [];

    // Обрабатываем каждое слово запроса
    rawWords.forEach(word => {
        // Если слово слишком короткое или это стоп-слово - пропускаем
        if (word.length < 2 || stopWords.has(word)) return;

        // Добавляем само слово
        searchWords.push(word);
        
        // Если для этого слова есть словарь морфологии, добавляем все его формы
        if (morphologyMap[word]) {
            searchWords.push(...morphologyMap[word]);
        } else {
            // Ищем совпадения по корню (если слово не найдено в явном словаре)
            // Это более простая проверка: если в запросе "сертификат", а в словаре есть ключ "сертификат"
            for (let key in morphologyMap) {
                if (word.includes(key) || key.includes(word)) {
                    searchWords.push(...morphologyMap[key]);
                }
            }
        }
    });

    // Убираем дубликаты, чтобы не считать одно и то же слово дважды
    searchWords = [...new Set(searchWords)];
    
    console.log('🔎 [AI Core] Ищем по словам (с морфологией):', searchWords);
    
    // --- КОНЕЦ БЛОКА УЛУЧШЕНИЙ ---

    // Остальная логика подсчета очков (та же, что и была)
    const scored = proceduresFullData.map(proc => {
        const fullText = (proc.num + ' ' + proc.name + ' ' + proc.content).toLowerCase();
        let score = 0;
        
        searchWords.forEach(word => {
            // Экранируем спецсимволы в слове для безопасности
            const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const matches = fullText.match(regex);
            if (matches) score += matches.length * 15;
            
            // Дополнительные очки за точное совпадение номера процедуры
            if (proc.num.toLowerCase() === word) score += 100;
            // Дополнительные очки за вхождение в название
            if (proc.name.toLowerCase().includes(word)) score += 30;
        });
        
        // Специальные правила
        if (questionLower.includes('тнвэд') || questionLower.includes('тн вэд')) {
            if (fullText.includes('тнвэд') || fullText.includes('тн вэд')) score += 100;
        }
        if (questionLower.includes('сертификат') && fullText.includes('сертификат')) score += 80;
        if (questionLower.includes('поставщик') && (fullText.includes('поставщик') || fullText.includes('oem'))) score += 80;
        if (questionLower.includes('база') && fullText.includes('баз')) score += 80; // <-- Спецправило для "базы"
        
        return { proc, score };
    });
    
    const relevant = scored
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)
        .map(item => item.proc);
    
    console.log(`🔍 [AI Core] Найдено ${relevant.length} релевантных процедур`);
    if (relevant.length > 0) {
        console.log('📋 Результаты:', relevant.map(p => `Процедура ${p.num}: ${p.name}`).join('; '));
    }
    return relevant;
}

    // Формирование Markdown в HTML
    function formatMessage(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`(.+?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>')
            .replace(/proc(\d+[a-z]*)\.html/gi, (match, num) => `<a href="proc${num}.html" target="_blank">Процедура ${num}</a>`)
            .replace(/Процедура\s+(\d+[a-z]*)/gi, (match, num) => `<a href="proc${num}.html" target="_blank">${match}</a>`)
            .replace(/процедуру\s+(\d+[a-z]*)/gi, (match, num) => `<a href="proc${num}.html" target="_blank">${match}</a>`);
    }

    // --- Внедрение стилей для виджета ---
    function injectStyles() {
        if (document.getElementById('ai-core-styles')) return;

        const style = document.createElement('style');
        style.id = 'ai-core-styles';
        style.textContent = `
            .ai-widget-hidden {
                display: none !important;
            }
            
            .ai-search-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 10px 20px;
                border-radius: 40px;
                background: linear-gradient(135deg, #f6b83e, #ff8c00);
                color: #0a1929;
                border: none;
                cursor: pointer;
                font-size: 0.95rem;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(246, 184, 62, 0.3);
                transition: all 0.3s ease;
                animation: softPulse 2.5s infinite;
                border: 2px solid rgba(255, 255, 255, 0.3);
                white-space: nowrap;
                margin-left: 12px;
            }
            .ai-search-btn:hover {
                transform: scale(1.05);
                box-shadow: 0 6px 18px rgba(246, 184, 62, 0.5);
                animation: none;
                background: linear-gradient(135deg, #ff8c00, #f6b83e);
                border-color: white;
            }
            @keyframes softPulse {
                0% { box-shadow: 0 4px 12px rgba(246, 184, 62, 0.3); }
                50% { box-shadow: 0 6px 18px rgba(246, 184, 62, 0.5), 0 0 0 3px rgba(246, 184, 62, 0.1); }
                100% { box-shadow: 0 4px 12px rgba(246, 184, 62, 0.3); }
            }
            .ai-widget {
                position: fixed;
                top: 50%;
                left: 24px;
                transform: translateY(-50%);
                width: 420px;
                max-width: calc(100vw - 40px);
                background: white;
                border-radius: 24px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                z-index: 9999;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .ai-widget.open {
                display: block;
                animation: slideInLeft 0.3s ease;
            }
            @keyframes slideInLeft {
                from { opacity: 0; transform: translateY(-50%) translateX(-20px); }
                to { opacity: 1; transform: translateY(-50%) translateX(0); }
            }
            .ai-header {
                background: linear-gradient(135deg, #0a1929, #1a2642);
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .ai-icon {
                font-size: 32px;
                animation: wave 2s infinite;
            }
            @keyframes wave {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-10deg); }
                75% { transform: rotate(10deg); }
            }
            .ai-title {
                flex: 1;
                font-weight: 600;
                font-size: 1.1rem;
                background: linear-gradient(90deg, #fff, #f6b83e);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .ai-close {
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                opacity: 0.7;
                transition: 0.2s;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
            }
            .ai-close:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }
            .ai-messages {
                height: 480px;
                max-height: 65vh;
                overflow-y: auto;
                padding: 20px;
                background: #f8fafc;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .ai-message {
                padding: 14px 18px;
                border-radius: 18px;
                max-width: 85%;
                word-wrap: break-word;
                font-size: 0.9rem;
                line-height: 1.5;
            }
            .ai-message-user {
                background: linear-gradient(135deg, #f6b83e, #ff8c00);
                color: #0a1929;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
                box-shadow: 0 4px 12px rgba(246, 184, 62, 0.3);
            }
            .ai-message-bot {
                background: white;
                color: #1e293b;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                border: 1px solid #e2e8f0;
            }
            .ai-message-bot a {
                color: #f6b83e;
                text-decoration: none;
                font-weight: 600;
                background: #fff3cf;
                padding: 2px 8px;
                border-radius: 20px;
                display: inline-block;
                margin: 2px 0;
            }
            .ai-message-bot a:hover {
                background: #f6b83e;
                color: #0a1929;
            }
            .ai-message-bot code {
                background: #1a2642;
                color: #f6b83e;
                padding: 2px 8px;
                border-radius: 6px;
                font-family: monospace;
            }
            .typing-indicator {
                display: flex;
                gap: 6px;
                padding: 14px 18px;
                background: white;
                border-radius: 18px;
                border-bottom-left-radius: 4px;
                align-self: flex-start;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                border: 1px solid #e2e8f0;
            }
            .typing-indicator span {
                width: 10px;
                height: 10px;
                background: #f6b83e;
                border-radius: 50%;
                animation: typing 1.4s infinite;
            }
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing {
                0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
                30% { transform: translateY(-10px); opacity: 1; }
            }
            .ai-input-row {
                display: flex;
                padding: 16px 20px;
                background: white;
                border-top: 1px solid #e2e8f0;
                gap: 12px;
            }
            .ai-input {
                flex: 1;
                padding: 12px 18px;
                border: 2px solid #e2e8f0;
                border-radius: 30px;
                font-size: 0.95rem;
                outline: none;
                transition: 0.2s;
            }
            .ai-input:focus {
                border-color: #f6b83e;
                box-shadow: 0 0 0 4px rgba(246, 184, 62, 0.15);
            }
            .ai-input::placeholder {
                color: #94a3b8;
            }
            .ai-send {
                background: linear-gradient(135deg, #f6b83e, #ff8c00);
                border: none;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 22px;
                color: #0a1929;
                transition: 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                box-shadow: 0 4px 12px rgba(246, 184, 62, 0.3);
            }
            .ai-send:hover {
                transform: scale(1.08) rotate(5deg);
                box-shadow: 0 6px 16px rgba(246, 184, 62, 0.4);
            }
            .ai-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            .ai-core-btn {
                margin-left: 12px;
            }
        `;
        document.head.appendChild(style);
    }

    // --- Основные функции виджета ---

    // Создание HTML-виджета
    function createWidget() {
    const oldWidget = document.getElementById('aiWidget');
    if (oldWidget) oldWidget.remove();

    injectStyles();

    const widgetHTML = `
        <div class="ai-widget ai-widget-hidden" id="aiWidget" style="position: fixed; left: 24px; top: 50%; transform: translateY(-50%);">
            <div class="ai-header" style="cursor: move;">
                <span class="ai-icon">🤖</span>
                <span class="ai-title">AI · Ассистент КЭАЗ</span>
                <button class="ai-close" onclick="AICore.toggleWidget()">✕</button>
            </div>
            <div class="ai-messages" id="aiMessages">
                <div class="ai-message ai-message-bot">
                    👋 <strong>Здравствуйте! Я AI-ассистент КЭАЗ.</strong><br><br>
                    <strong>🤖 Что я умею:</strong><br>
                    🔹 <strong>Искать процедуры</strong> — просто опишите задачу (например, «вывод продукта из ассортимента»).<br>
                    🔹 <strong>Объяснять процессы</strong> — расскажу, какие шаги и роли задействованы.<br>
                    🔹 <strong>Подсказывать ответственных</strong> — кто что делает в каждой процедуре.<br><br>
                    <strong>📋 Примеры запросов:</strong><br>
                    • «Как ввести новую номенклатуру?»<br>
                    • «Кто отвечает за ценообразование?»<br>
                    • «Что такое процедура 4н?»<br>
                    • «Как найти поставщика?»<br>
                    • «Как списать ТМЦ?»<br><br>
                    <em>👇 Введите ваш вопрос ниже.</em>
                </div>
            </div>
            <div class="ai-input-row">
                <input type="text" id="aiInput" class="ai-input" placeholder="Напишите ваш вопрос..." onkeypress="AICore.handleKeyPress(event)">
                <button class="ai-send" id="aiSendBtn" onclick="AICore.sendMessage()">➤</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    
    // ========== ПЕРЕТАСКИВАНИЕ ==========
    const widget = document.getElementById('aiWidget');
    const header = widget.querySelector('.ai-header');
    let isDragging = false;
    let offsetX, offsetY;
    
    // Восстанавливаем позицию
    const savedLeft = localStorage.getItem('aiWidgetLeft');
    const savedTop = localStorage.getItem('aiWidgetTop');
    if (savedLeft && savedTop) {
        widget.style.left = savedLeft;
        widget.style.top = savedTop;
        widget.style.transform = 'none';
    }
    
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.ai-close')) return;
        isDragging = true;
        const rect = widget.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        widget.style.position = 'fixed';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        let left = e.clientX - offsetX;
        let top = e.clientY - offsetY;
        
        left = Math.max(0, Math.min(window.innerWidth - widget.offsetWidth, left));
        top = Math.max(0, Math.min(window.innerHeight - widget.offsetHeight, top));
        
        widget.style.left = `${left}px`;
        widget.style.top = `${top}px`;
        widget.style.transform = 'none';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            document.body.style.userSelect = '';
            localStorage.setItem('aiWidgetLeft', widget.style.left);
            localStorage.setItem('aiWidgetTop', widget.style.top);
        }
    });
    // ====================================
}

    // ============================================
    // ПЕРЕТАСКИВАНИЕ И ИЗМЕНЕНИЕ РАЗМЕРА ВИДЖЕТА
    // ============================================
    
    function makeWidgetDraggableAndResizable(widgetElement) {
        let isDragging = false;
        let dragOffsetX = 0, dragOffsetY = 0;
        let isResizing = false;
        let startWidth = 0, startHeight = 0;
        let startX = 0, startY = 0;
        
        const header = widgetElement.querySelector('.ai-header');
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'ai-resize-handle';
        resizeHandle.innerHTML = '◢';
        resizeHandle.style.cssText = `
            position: absolute;
            bottom: 0;
            right: 0;
            width: 20px;
            height: 20px;
            cursor: nw-resize;
            font-size: 16px;
            color: #94a3b8;
            text-align: center;
            line-height: 18px;
            user-select: none;
            z-index: 10;
        `;
        widgetElement.appendChild(resizeHandle);
        
        const savedLeft = localStorage.getItem('aiWidgetLeft');
        const savedTop = localStorage.getItem('aiWidgetTop');
        const savedWidth = localStorage.getItem('aiWidgetWidth');
        const savedHeight = localStorage.getItem('aiWidgetHeight');
        
        if (savedLeft && savedTop) {
            widgetElement.style.left = savedLeft;
            widgetElement.style.top = savedTop;
            widgetElement.style.transform = 'none';
        }
        if (savedWidth && savedHeight) {
            widgetElement.style.width = savedWidth;
            widgetElement.style.height = savedHeight;
            const messagesDiv = widgetElement.querySelector('.ai-messages');
            if (messagesDiv) {
                messagesDiv.style.height = `calc(${savedHeight} - 130px)`;
            }
        }
        
        header.style.cursor = 'move';
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.ai-close')) return;
            isDragging = true;
            const rect = widgetElement.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            widgetElement.style.position = 'fixed';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let newLeft = e.clientX - dragOffsetX;
            let newTop = e.clientY - dragOffsetY;
            
            newLeft = Math.max(0, Math.min(window.innerWidth - widgetElement.offsetWidth, newLeft));
            newTop = Math.max(0, Math.min(window.innerHeight - widgetElement.offsetHeight, newTop));
            
            widgetElement.style.left = `${newLeft}px`;
            widgetElement.style.top = `${newTop}px`;
            widgetElement.style.transform = 'none';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                localStorage.setItem('aiWidgetLeft', widgetElement.style.left);
                localStorage.setItem('aiWidgetTop', widgetElement.style.top);
            }
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
                localStorage.setItem('aiWidgetWidth', widgetElement.style.width);
                localStorage.setItem('aiWidgetHeight', widgetElement.style.height);
            }
        });
        
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startWidth = widgetElement.offsetWidth;
            startHeight = widgetElement.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = Math.max(300, Math.min(window.innerWidth - 100, startWidth + (e.clientX - startX)));
            const newHeight = Math.max(400, Math.min(window.innerHeight - 100, startHeight + (e.clientY - startY)));
            
            widgetElement.style.width = `${newWidth}px`;
            widgetElement.style.height = `${newHeight}px`;
            
            const messagesDiv = widgetElement.querySelector('.ai-messages');
            if (messagesDiv) {
                messagesDiv.style.height = `${newHeight - 130}px`;
            }
        });
        
        const resetBtn = document.createElement('button');
        resetBtn.innerHTML = '📍';
        resetBtn.title = 'Вернуть в исходное положение';
        resetBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            opacity: 0.6;
            margin-left: 8px;
            padding: 0 4px;
        `;
        resetBtn.onclick = () => {
            widgetElement.style.left = '';
            widgetElement.style.top = '';
            widgetElement.style.transform = '';
            widgetElement.style.width = '';
            widgetElement.style.height = '';
            localStorage.removeItem('aiWidgetLeft');
            localStorage.removeItem('aiWidgetTop');
            localStorage.removeItem('aiWidgetWidth');
            localStorage.removeItem('aiWidgetHeight');
            
            const messagesDiv = widgetElement.querySelector('.ai-messages');
            if (messagesDiv) {
                messagesDiv.style.height = '';
            }
            
            widgetElement.style.left = '24px';
            widgetElement.style.top = '50%';
            widgetElement.style.transform = 'translateY(-50%)';
            widgetElement.style.width = '420px';
            widgetElement.style.height = '';
        };
        
        const titleSpan = widgetElement.querySelector('.ai-title');
        if (titleSpan) {
            titleSpan.appendChild(resetBtn);
        }
    }

    // --- Экспортируемый объект API ---
    // --- Экспортируемый объект API ---
    window.AICore = {
        initButton: function(containerSelector = 'h1') {
    if (document.querySelector('.ai-core-btn')) return;
    
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.warn(`[AI Core] Контейнер "${containerSelector}" не найден.`);
        return;
    }
    
    const btn = document.createElement('button');
    btn.className = 'ai-search-btn ai-core-btn';
    
    // === НАЧАЛО: Новый дизайн кнопки (Вариант 4) ===
    btn.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="background: linear-gradient(135deg, #f6b83e, #ff8c00); border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 26px; box-shadow: 0 4px 10px rgba(246, 184, 62, 0.3);">🤖</span>
            <div style="text-align: left;">
                <div style="font-weight: 700; font-size: 1rem; color: #0a1929;">AI-ассистент КЭАЗ</div>
                <div style="font-size: 0.75rem; color: #475569; white-space: nowrap;">Задайте вопрос о процедурах</div>
            </div>
        </div>
    `;
    btn.style.padding = '10px 20px 10px 16px';
    btn.style.background = 'white';
    btn.style.border = '2px solid #f6b83e';
    btn.style.boxShadow = '0 6px 16px rgba(246, 184, 62, 0.25)';
    btn.style.animation = 'softPulse 2.5s infinite'; // Оставляем анимацию
    btn.onclick = () => AICore.toggleWidget();
    // === КОНЕЦ: Новый дизайн кнопки ===
    
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.gap = '12px';
    container.appendChild(btn);
    
    injectStyles();
    createWidget();
    loadProceduresFullData();
},

        toggleWidget: function() {
            let widget = document.getElementById('aiWidget');
            if (!widget) {
                injectStyles();
                createWidget();
                widget = document.getElementById('aiWidget');
            }
            widget.classList.remove('ai-widget-hidden');
            widget.classList.toggle('open');
            if (widget.classList.contains('open')) {
                setTimeout(() => document.getElementById('aiInput').focus(), 100);
            } else {
                widget.classList.add('ai-widget-hidden');
            }
        },

        handleKeyPress: function(event) {
            if (event.key === 'Enter') AICore.sendMessage();
        },

        _showTypingIndicator: function() {
            const messagesDiv = document.getElementById('aiMessages');
            if (!messagesDiv) return;
            const div = document.createElement('div');
            div.className = 'typing-indicator';
            div.id = 'typingIndicator';
            div.innerHTML = '<span></span><span></span><span></span>';
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        },

        _removeTypingIndicator: function() {
            const el = document.getElementById('typingIndicator');
            if (el) el.remove();
        },

        _addMessage: function(text, sender) {
            const messagesDiv = document.getElementById('aiMessages');
            if (!messagesDiv) return;
            const div = document.createElement('div');
            div.className = `ai-message ai-message-${sender}`;
            div.innerHTML = formatMessage(text);
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        },

        sendMessage: async function() {
            const input = document.getElementById('aiInput');
            const btn = document.getElementById('aiSendBtn');
            if (!input || !btn) return;
            
            const message = input.value.trim();
            if (!message) return;
            
            input.value = '';
            AICore._addMessage(message, 'user');
            AICore._showTypingIndicator();
            btn.disabled = true;
            
            try {
                const allProcedures = await loadProceduresFullData();
                const relevantProcs = findRelevantProcedures(message, 5);
                
                let contextText = '';
                if (relevantProcs.length > 0) {
                    contextText = '\n\n=== РЕЛЕВАНТНЫЕ ПРОЦЕДУРЫ ИЗ БАЗЫ ЗНАНИЙ КЭАЗ ===\n\n';
                    relevantProcs.forEach((proc) => {
                        contextText += `--- ПРОЦЕДУРА ${proc.num}: ${proc.name} ---\n`;
                        const maxLength = 15000;
                        if (proc.content.length > maxLength) {
                            contextText += proc.content.substring(0, maxLength);
                            contextText += `\n... (процедура содержит ещё ${proc.content.length - maxLength} символов)`;
                        } else {
                            contextText += proc.content;
                        }
                        contextText += '\n\n';
                    });
                    contextText += '=== КОНЕЦ КОНТЕКСТА ===\n\n';
                }
                
                const h1 = document.querySelector('h1');
                const procName = h1 ? h1.textContent.replace('🤖AI', '').trim() : '';
                
                const messagesWithContext = [
                    {
                        role: 'system',
                        content: `Ты — AI-ассистент КЭАЗ. Помогай разобраться в процедуре: ${procName}. Отвечай на вопросы, основываясь на предоставленном контексте процедур. ВАЖНО: Указывай номер процедуры и номер шага, если возможно. В конце ответа добавь [PROC:номера] с номерами упомянутых процедур.`
                    },
                    {
                        role: 'user',
                        content: `КОНТЕКСТ:\n${contextText}\n\nВОПРОС: ${message}`
                    }
                ];
                
                const response = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messages: messagesWithContext })
                });
                
                AICore._removeTypingIndicator();
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                
                if (data.success) {
                    const procMatch = data.content.match(/\[PROC:([^\]]+)\]/);
                    let procNumbers = [];
                    if (procMatch && procMatch[1] !== 'none') {
                        procNumbers = procMatch[1].split(',').map(p => p.trim());
                    }
                    let cleanContent = data.content.replace(/\[PROC:[^\]]+\]/, '').trim();
                    AICore._addMessage(cleanContent, 'bot');
                    
                    if (procNumbers.length > 0 && typeof window.filterByAIProcedures === 'function') {
                        window.filterByAIProcedures(procNumbers);
                        
                        const messagesDiv = document.getElementById('aiMessages');
                        if (messagesDiv) {
                            const filterMsg = document.createElement('div');
                            filterMsg.className = 'ai-message ai-message-bot';
                            filterMsg.style.background = '#fff3cf';
                            filterMsg.style.borderColor = '#f6b83e';
                            filterMsg.innerHTML = `🎯 <strong>Карта отфильтрована</strong> — показаны процедуры: ${procNumbers.map(p => `<code style="background:#f6b83e; color:#0a1929; padding:2px 6px; border-radius:12px; margin:0 2px;">${p}</code>`).join(', ')}<br><br>
                            <a href="#" onclick="resetAIFilter(); return false;" style="color: #0a1929; background: #f6b83e; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-weight: 600; display: inline-block;">🔄 Сбросить фильтр</a>`;
                            messagesDiv.appendChild(filterMsg);
                            messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }
                    }
                } else {
                    AICore._addMessage('❌ Ошибка. Попробуйте позже.', 'bot');
                }
            } catch (e) {
                AICore._removeTypingIndicator();
                AICore._addMessage('❌ Не удалось подключиться к серверу.', 'bot');
                console.error(e);
            }
            
            btn.disabled = false;
        }
    };
    // --- АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ДЛЯ ВСЕХ СТРАНИЦ ---
    function initAICore() {
        function tryShowWelcome() {
            // Ждём, пока виджет точно создастся (максимум 10 попыток)
            let attempts = 0;
            const maxAttempts = 20;
            
            const showWidget = () => {
                const widget = document.getElementById('aiWidget');
                if (widget) {
                    console.log('🎉 [AI Core] Виджет найден, открываю приветствие...');
                    AICore.toggleWidget();
                    setTimeout(() => {
                        if (widget.classList.contains('open')) {
                            AICore.toggleWidget();
                        }
                    }, 5000); // Показываем 5 секунд
                } else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(showWidget, 100); // Пробуем ещё раз через 100 мс
                } else {
                    console.warn('⚠️ [AI Core] Виджет не найден после 2 секунд ожидания');
                }
            };
            
            setTimeout(showWidget, 1000); // Начать попытки через 1 секунду
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (window.AICore) {
                    window.AICore.initButton('h1');
                    // Всегда показываем приветствие (убираем проверку localStorage)
                    tryShowWelcome();
                }
            });
        } else {
            if (window.AICore) {
                window.AICore.initButton('h1');
                // Всегда показываем приветствие
                tryShowWelcome();
            }
        }
    }
    initAICore();
})();
