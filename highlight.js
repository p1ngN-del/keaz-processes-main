// highlight.js - подсветка блоков и шагов по поисковому запросу
// + ПОДКЛЮЧЕНИЕ AI ВИДЖЕТА СО СТИЛЯМИ (БЕЗ ПРАВКИ 29 ФАЙЛОВ)

// ============================================
// 1. ДОБАВЛЯЕМ СТИЛИ ДЛЯ AI ВИДЖЕТА (прямо в этот файл)
// ============================================
(function addAIStyles() {
    if (document.getElementById('ai-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-widget-styles';
    style.textContent = `
        /* Кнопка AI */
        .ai-search-btn {
            display: inline-flex !important;
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
            border: 2px solid rgba(255, 255, 255, 0.3);
            white-space: nowrap;
            margin-left: 12px;
        }
        .ai-search-btn:hover {
            transform: scale(1.05);
            background: linear-gradient(135deg, #ff8c00, #f6b83e);
        }
        /* Сам виджет - СКРЫТ ПО УМОЛЧАНИЮ */
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
            display: none !important; /* Жестко скрыт */
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .ai-widget.open {
            display: block !important; /* Показываем только когда есть класс open */
        }
        .ai-header {
            background: linear-gradient(135deg, #0a1929, #1a2642);
            color: white;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .ai-icon { font-size: 32px; }
        .ai-title {
            flex: 1;
            font-weight: 600;
            font-size: 1.1rem;
            background: linear-gradient(90deg, #fff, #f6b83e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .ai-close {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            opacity: 0.7;
            width: 30px;
            height: 30px;
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
        }
        .ai-message-user {
            background: linear-gradient(135deg, #f6b83e, #ff8c00);
            color: #0a1929;
            align-self: flex-end;
        }
        .ai-message-bot {
            background: white;
            color: #1e293b;
            align-self: flex-start;
            border: 1px solid #e2e8f0;
        }
        .ai-message-bot a {
            color: #f6b83e;
            text-decoration: none;
            font-weight: 600;
            background: #fff3cf;
            padding: 2px 8px;
            border-radius: 20px;
        }
        .typing-indicator {
            display: flex;
            gap: 6px;
            padding: 14px 18px;
            background: white;
            border-radius: 18px;
            align-self: flex-start;
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
        }
        .ai-input:focus { border-color: #f6b83e; }
        .ai-send {
            background: linear-gradient(135deg, #f6b83e, #ff8c00);
            border: none;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .ai-send:disabled { opacity: 0.5; cursor: not-allowed; }
        .ai-core-btn { margin-left: 12px; }
    `;
    document.head.appendChild(style);
})();

// ============================================
// 2. ФУНКЦИИ ДЛЯ КУК (оставляем как было)
// ============================================
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

// ============================================
// 3. ПОДСВЕТКА ПОИСКА (оставляем как было)
// ============================================
const urlParams = new URLSearchParams(window.location.search);
let searchTerm = urlParams.get('search');
if (!searchTerm) searchTerm = getCookie('searchTerm');
if (!searchTerm) {
    console.log('Нет параметра search. Подсветка отключена.');
    deleteCookie('searchTerm');
} else {
    searchTerm = decodeURIComponent(searchTerm).toLowerCase().trim();
    if (searchTerm) {
        setCookie('searchTerm', searchTerm, 1);
        console.log('Ищем в JSON:', searchTerm);
        if (!document.getElementById('highlight-styles')) {
            const style = document.createElement('style');
            style.id = 'highlight-styles';
            style.textContent = `
                .highlight-card { border: 3px solid #f6b83e !important; background-color: #fff3cf !important; }
                .highlight-panel { border: 3px solid #f6b83e !important; background-color: #fff3cf !important; }
            `;
            document.head.appendChild(style);
        }
        function containsSearchTermInDOM(element, term) {
            if (!element) return false;
            if (element.textContent && element.textContent.toLowerCase().includes(term)) return true;
            return false;
        }
        const path = window.location.pathname;
        const filename = path.substring(path.lastIndexOf('/') + 1);
        const procId = filename.replace('proc', '').replace('.html', '');
        fetch('procedures_data.json')
            .then(response => response.json())
            .then(data => {
                const procedure = data.procedures.find(p => p.id === procId);
                if (!procedure) return;
                const fullText = (procedure.num + ' ' + procedure.name + ' ' + procedure.content).toLowerCase();
                const foundInJSON = fullText.includes(searchTerm);
                const cards = document.querySelectorAll('.step-card, .proc-card');
                let foundElements = [];
                cards.forEach(card => {
                    if (card.closest('#detailPanel')) return;
                    if (!(card.offsetWidth || card.offsetHeight || card.getClientRects().length)) return;
                    if (containsSearchTermInDOM(card, searchTerm)) {
                        card.classList.add('highlight-card');
                        foundElements.push(card);
                    }
                });
                if (foundElements.length > 0) {
                    setTimeout(() => foundElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
                } else if (foundInJSON) {
                    console.log(`🔍 Слово "${searchTerm}" найдено в JSON, но не в DOM`);
                    const panel = document.getElementById('detailPanel');
                    if (panel) {
                        panel.classList.add('show');
                        const header = document.getElementById('detailHeader');
                        const text = document.getElementById('detailText');
                        const io = document.getElementById('detailIO');
                        if(header) header.innerHTML = `<span class="detail-number">🔍 Поиск</span><span class="detail-role">Результат</span>`;
                        if(text) text.innerHTML = `Текст "<strong>${searchTerm}</strong>" найден в описании процедуры, но не отображается на текущей диаграмме. Пожалуйста, ознакомьтесь с полным текстом процедуры или свяжитесь с ответственным.`;
                        if(io) io.innerHTML = '';
                        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            })
            .catch(error => console.error('Ошибка загрузки JSON:', error));
    }
}

// ============================================
// 4. АВТОМАТИЧЕСКИЕ ССЫЛКИ НА ВЫХОДЫ (оставляем как было)
// ============================================
(function() {
    if (window.location.pathname.includes('index')) return;
    const procId = window.location.pathname.match(/proc(\d+[a-z]*)\.html/)?.[1];
    if (!procId) return;
    const outputsMap = {
        '3': [], '4': ['11', '13', '15'], '4a': ['4', '23'], '4n': ['3', '29'], '5': ['6'], '6': [], '7': ['21'], '8': ['12'],
        '10': ['11', '22'], '11': ['14'], '12': ['22'], '13': ['20'], '14': ['20'], '15': ['13'], '16': [], '17': ['23', '24', '26'],
        '18': ['17', '19'], '19': ['24'], '20': ['25'], '21': ['18'], '22': ['8', '3'], '23': ['4', '4a'], '24': ['4'], '25': [],
        '26': ['31', '4a'], '27': ['17'], '28': ['30'], '29': [], '30': [], '31': []
    };
    const outputs = outputsMap[procId] || [];
    if (outputs.length === 0) return;
    const skipSteps = { '4': ['5'], '4a': ['22'] };
    const skipList = skipSteps[procId] || [];
    const wait = setInterval(function() {
        if (typeof window.showDetail === 'function') {
            clearInterval(wait);
            const original = window.showDetail;
            window.showDetail = function(stepId) {
                original(stepId);
                setTimeout(function() {
                    if (skipList.includes(stepId)) return;
                    const detailText = document.getElementById('detailText');
                    if (!detailText) return;
                    if (!detailText.textContent.includes('Выход') && !detailText.textContent.includes('📤')) return;
                    if (document.getElementById('autoOutputLinks')) return;
                    const links = outputs.map(num => 
                        `<a href="proc${num}.html" style="color:#1e6df2;background:#e6f0ff;padding:4px 12px;border-radius:20px;text-decoration:none;font-weight:600;margin:0 4px;display:inline-block;">Процедура ${num}</a>`
                    ).join('');
                    const linksBlock = document.createElement('div');
                    linksBlock.id = 'autoOutputLinks';
                    linksBlock.style.marginTop = '20px';
                    linksBlock.style.padding = '15px';
                    linksBlock.style.background = '#f0f7ff';
                    linksBlock.style.borderRadius = '12px';
                    linksBlock.style.border = '1px solid #1e6df2';
                    linksBlock.innerHTML = `<strong style="color:#0a1929;">🔗 Выходы в процедуры:</strong><br><div style="margin-top:10px;">${links}</div>`;
                    detailText.appendChild(linksBlock);
                    console.log(`✅ Ссылки добавлены для шага ${stepId} (в detailText)`);
                }, 200);
            };
        }
    }, 100);
})();

// ============================================
// 5. ИНИЦИАЛИЗАЦИЯ AI-АССИСТЕНТА (ИСПРАВЛЕНА)
// ============================================
if (!window.location.pathname.includes('index')) {
    (function() {
        function waitForAICore() {
            if (window.AICore) {
                // Просто вызываем инициализацию кнопки, виджет создастся сам, но будет скрыт
                window.AICore.initButton('h1');
            } else {
                setTimeout(waitForAICore, 100);
            }
        }
        waitForAICore();
    })();
}
