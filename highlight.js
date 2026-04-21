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
    // НЕ ДЕЛАЕМ return, чтобы остальной код выполнился!
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
                }
            })
            .catch(error => console.error('Ошибка загрузки JSON:', error));
    }
}

// ============================================
// AI-АССИСТЕНТ ДЛЯ СТРАНИЦ ПРОЦЕДУР
// ============================================
if (!window.location.pathname.includes('index')) {
    (function() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-search-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 40px; background: linear-gradient(135deg, #f6b83e, #ff8c00); color: #0a1929; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600; box-shadow: 0 4px 12px rgba(246,184,62,0.3); margin-left: 12px; }
            .ai-widget { position: fixed; top: 50%; left: 24px; transform: translateY(-50%); width: 420px; background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); z-index: 9999; display: none; }
            .ai-widget.open { display: block; }
            .ai-header { background: linear-gradient(135deg, #0a1929, #1a2642); color: white; padding: 16px 20px; display: flex; align-items: center; gap: 12px; }
            .ai-messages { height: 480px; overflow-y: auto; padding: 20px; background: #f8fafc; }
            .ai-input-row { display: flex; padding: 16px 20px; gap: 12px; }
            .ai-input { flex: 1; padding: 12px 18px; border: 2px solid #e2e8f0; border-radius: 30px; }
            .ai-send { background: linear-gradient(135deg, #f6b83e, #ff8c00); border: none; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; font-size: 22px; }
        `;
        document.head.appendChild(style);

        const widget = document.createElement('div');
        widget.className = 'ai-widget';
        widget.id = 'aiWidget';
        widget.innerHTML = `
            <div class="ai-header"><span>🤖</span><span>AI · Ассистент КЭАЗ</span><button onclick="window.toggleAIWidget()">✕</button></div>
            <div class="ai-messages" id="aiMessagesProc"><div class="ai-message-bot" style="padding:14px;background:white;border-radius:18px;">👋 Задайте вопрос по этой процедуре.</div></div>
            <div class="ai-input-row"><input type="text" id="aiInputProc" class="ai-input" placeholder="Напишите ваш вопрос..." onkeypress="if(event.key==='Enter')window.sendAIMessageProc()"><button class="ai-send" id="aiSendBtnProc" onclick="window.sendAIMessageProc()">➤</button></div>
        `;
        document.body.appendChild(widget);

        const btn = document.createElement('button');
        btn.className = 'ai-search-btn';
        btn.innerHTML = '<span>🤖</span><span>AI</span>';
        btn.onclick = () => window.toggleAIWidget();
        
        const h1 = document.querySelector('h1');
        if (h1) { h1.style.display = 'flex'; h1.style.alignItems = 'center'; h1.style.justifyContent = 'center'; h1.style.gap = '12px'; h1.appendChild(btn); }

        const PROXY_URL = 'https://keeaz-ai-server-production.up.railway.app/api/chat';

        window.toggleAIWidget = function() { document.getElementById('aiWidget').classList.toggle('open'); };
        window.sendAIMessageProc = async function() {
            const input = document.getElementById('aiInputProc'); const msg = input.value.trim(); if (!msg) return;
            input.value = ''; 
            const msgs = document.getElementById('aiMessagesProc');
            msgs.innerHTML += `<div style="text-align:right;margin:8px"><span style="background:#f6b83e;padding:10px;border-radius:18px;">${msg}</span></div>`;
            const btn = document.getElementById('aiSendBtnProc'); btn.disabled = true;
            try {
                const response = await fetch(PROXY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [ { role: 'system', content: 'Ты — AI-ассистент КЭАЗ. Отвечай кратко.' }, { role: 'user', content: msg } ] }) });
                const data = await response.json();
                if (data.success) msgs.innerHTML += `<div style="margin:8px"><span style="background:white;padding:10px;border-radius:18px;">${data.content}</span></div>`;
                else msgs.innerHTML += `<div style="margin:8px"><span style="background:#ffcccc;padding:10px;border-radius:18px;">❌ Ошибка</span></div>`;
            } catch (e) { msgs.innerHTML += `<div style="margin:8px"><span style="background:#ffcccc;padding:10px;border-radius:18px;">❌ Нет связи</span></div>`; }
            btn.disabled = false;
        };
    })();
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
                    
                    // ========== НОВАЯ ПРОВЕРКА НА ДУБЛИ ==========
                    // Проверяем, есть ли уже ссылки в блоке "➡️ Выходы"
                    const ioBlock = document.getElementById('detailIO');
                    if (ioBlock && ioBlock.innerHTML.includes('Процедура ' + outputs[0])) {
                        console.log('⚠️ Ссылки уже есть в detailIO, пропускаем');
                        return;
                    }
                    
                    // Проверяем, нет ли уже нашего блока
                    if (detailText.innerHTML.includes('🔗 Выходы в процедуры')) {
                        console.log('⚠️ Блок ссылок уже добавлен');
                        return;
                    }
                    // ==========================================
                    
                    // Создаём ссылки
                    const links = outputs.map(num => 
                        `<a href="proc${num}.html" style="color:#1e6df2;background:#e6f0ff;padding:4px 12px;border-radius:20px;text-decoration:none;font-weight:600;margin:0 4px;display:inline-block;">Процедура ${num}</a>`
                    ).join('');
                    
                    const linksBlock = document.createElement('div');
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
