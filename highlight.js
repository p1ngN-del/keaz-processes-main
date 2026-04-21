// highlight.js - подсветка блоков и шагов по поисковому запросу
// (без внешней обёртки, чтобы return не ломал остальное)

// --- Функции для работы с куками ---
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

// Получаем поисковый запрос
const urlParams = new URLSearchParams(window.location.search);
let searchTerm = urlParams.get('search');

if (!searchTerm) {
    searchTerm = getCookie('searchTerm');
}

if (!searchTerm) {
    console.log('Нет параметра search. Подсветка отключена.');
    deleteCookie('searchTerm');
} else {
    searchTerm = decodeURIComponent(searchTerm).toLowerCase().trim();
    if (searchTerm) {
        setCookie('searchTerm', searchTerm, 1);
        console.log('Ищем в JSON:', searchTerm);

        // --- Добавление CSS-классов для подсветки ---
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
                    
                    // --- ИСПРАВЛЕНИЕ: Показываем сообщение пользователю в панели деталей ---
                    const panel = document.getElementById('detailPanel');
                    if (panel) {
                        panel.classList.add('show');
                        const header = document.getElementById('detailHeader');
                        const text = document.getElementById('detailText');
                        const io = document.getElementById('detailIO');
                        if(header) header.innerHTML = `<span class="detail-number">🔍 Поиск</span><span class="detail-role">Результат</span>`;
                        if(text) text.innerHTML = `Текст "<strong>${searchTerm}</strong>" найден в описании процедуры, но не отображается на текущей диаграмме. Пожалуйста, ознакомьтесь с полным текстом процедуры или свяжитесь с ответственным.`;
                        if(io) io.innerHTML = ''; // Очищаем IO панель
                        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    // --- КОНЕЦ ИСПРАВЛЕНИЯ ---
                }
            })
            .catch(error => console.error('Ошибка загрузки JSON:', error));
    }
}

// ============================================
// АВТОМАТИЧЕСКИЕ ССЫЛКИ НА ВЫХОДЫ (БЕЗ ДУБЛЕЙ)
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
                    
                    // Проверяем, что это выход
                    if (!detailText.textContent.includes('Выход') && !detailText.textContent.includes('📤')) return;
                    
                    // ========== ИСПРАВЛЕННАЯ ПРОВЕРКА НА ДУБЛИ ==========
                    // Проверяем, нет ли уже нашего блока по его уникальному ID
                    if (document.getElementById('autoOutputLinks')) {
                        console.log('⚠️ Блок ссылок уже добавлен');
                        return;
                    }
                    // ==========================================
                    
                    // Создаём ссылки
                    const links = outputs.map(num => 
                        `<a href="proc${num}.html" style="color:#1e6df2;background:#e6f0ff;padding:4px 12px;border-radius:20px;text-decoration:none;font-weight:600;margin:0 4px;display:inline-block;">Процедура ${num}</a>`
                    ).join('');
                    
                    const linksBlock = document.createElement('div');
                    linksBlock.id = 'autoOutputLinks'; // <-- Добавлен уникальный ID
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
// ИНИЦИАЛИЗАЦИЯ AI-АССИСТЕНТА (НОВЫЙ КОД)
// ============================================
if (!window.location.pathname.includes('index')) {
    (function() {
        function waitForAICore() {
            if (window.AICore) {
                window.AICore.initButton('h1');
            } else {
                setTimeout(waitForAICore, 100);
            }
        }
        waitForAICore();
    })();
}
