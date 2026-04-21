// highlight.js - подсветка блоков и шагов по поисковому запросу
(function() {
    console.log('highlight.js загружен (версия 3.0 - поиск по JSON)');

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
        console.log('Нет параметра search. Выход.');
        deleteCookie('searchTerm');
        return;
    }

    searchTerm = decodeURIComponent(searchTerm).toLowerCase().trim();
    if (!searchTerm) {
        deleteCookie('searchTerm');
        return;
    }
    
    setCookie('searchTerm', searchTerm, 1);
    console.log('Ищем в JSON:', searchTerm);

    // --- Добавление CSS-классов для подсветки ---
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

    // --- Вспомогательная функция для проверки текста в элементе и его атрибутах (для DOM) ---
    function containsSearchTermInDOM(element, term) {
        if (!element) return false;
        
        if (element.textContent && element.textContent.toLowerCase().includes(term)) {
            return true;
        }
        
        const attributesToCheck = ['data-step', 'data-proc-id', 'data-num', 'data-name'];
        for (let attr of attributesToCheck) {
            const attrValue = element.getAttribute(attr);
            if (attrValue && attrValue.toLowerCase().includes(term)) {
                return true;
            }
        }
        return false;
    }

    // --- Определяем ID текущей процедуры ---
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    const procId = filename.replace('proc', '').replace('.html', '');
    
    console.log('ID процедуры:', procId);

    // --- Загружаем JSON и ищем ---
    fetch('procedures_data.json')
        .then(response => response.json())
        .then(data => {
            const procedure = data.procedures.find(p => p.id === procId);
            
            if (!procedure) {
                console.log('Процедура не найдена в JSON');
                showNoResultsMessage(searchTerm);
                return;
            }

            const fullText = (procedure.num + ' ' + procedure.name + ' ' + procedure.content).toLowerCase();
            const foundInJSON = fullText.includes(searchTerm);
            
            console.log('Найдено в JSON:', foundInJSON);
            
            const cards = document.querySelectorAll('.step-card, .proc-card');
            let foundElements = [];

            cards.forEach(card => {
                if (card.closest('#detailPanel')) {
                    return;
                }
                
                const isVisible = !!(card.offsetWidth || card.offsetHeight || card.getClientRects().length);
                if (!isVisible) return;

                if (containsSearchTermInDOM(card, searchTerm)) {
                    card.classList.add('highlight-card');
                    foundElements.push(card);
                } else {
                    card.classList.remove('highlight-card');
                }
            });

            const detailPanel = document.getElementById('detailPanel');
            const detailText = document.getElementById('detailText');
            if (detailPanel && detailText) {
                if (detailText.textContent.toLowerCase().includes(searchTerm)) {
                    detailPanel.classList.add('highlight-panel');
                } else {
                    detailPanel.classList.remove('highlight-panel');
                }
            }

            const foundCount = foundElements.length;
            console.log(`Найдено в DOM: ${foundCount}`);

            if (foundCount > 0) {
                showNavigationUI(foundElements, foundCount);
            } else if (foundInJSON) {
                showInfoMessage(`🔍 Слово "${searchTerm}" найдено в полном тексте процедуры, но не в названиях шагов.`);
            } else {
                showNoResultsMessage(searchTerm);
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки procedures_data.json:', error);
            const cards = document.querySelectorAll('.step-card, .proc-card');
            let foundElements = [];
            
            cards.forEach(card => {
                if (card.closest('#detailPanel')) return;
                const isVisible = !!(card.offsetWidth || card.offsetHeight || card.getClientRects().length);
                if (!isVisible) return;

                if (containsSearchTermInDOM(card, searchTerm)) {
                    card.classList.add('highlight-card');
                    foundElements.push(card);
                } else {
                    card.classList.remove('highlight-card');
                }
            });
            
            if (foundElements.length > 0) {
                showNavigationUI(foundElements, foundElements.length);
            } else {
                showNoResultsMessage(searchTerm);
            }
        });

    // --- UI: Навигация по найденным элементам ---
    function showNavigationUI(foundElements, foundCount) {
        setTimeout(() => {
            foundElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        const notice = document.createElement('div');
        notice.textContent = `🔍 Найдено совпадений в шагах: ${foundCount}`;
        notice.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #f6b83e;
            color: #0a1929; padding: 10px 20px; border-radius: 40px;
            font-size: 0.85rem; font-weight: 500; z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: inherit;
        `;
        document.body.appendChild(notice);

        let currentIndex = 0;
        const nextBtn = document.createElement('div');
        nextBtn.textContent = '↓';
        nextBtn.title = 'Следующее совпадение';
        nextBtn.style.cssText = `
            position: fixed; bottom: 90px; right: 20px; background: #0a1929;
            color: #f6b83e; width: 40px; height: 40px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 1.4rem; z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: all 0.2s;
        `;
        nextBtn.onmouseenter = () => nextBtn.style.transform = 'scale(1.1)';
        nextBtn.onmouseleave = () => nextBtn.style.transform = 'scale(1)';
        nextBtn.onclick = () => {
            if (foundElements.length === 0) return;
            currentIndex = (currentIndex + 1) % foundElements.length;
            foundElements[currentIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            foundElements.forEach(el => el.style.outline = '');
            foundElements[currentIndex].style.outline = '3px solid red';
            setTimeout(() => foundElements[currentIndex].style.outline = '', 1000);
        };
        document.body.appendChild(nextBtn);

        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                notice.remove();
                nextBtn.remove();
            }, 400);
        }, 8000);
    }

    function showInfoMessage(message) {
        const notice = document.createElement('div');
        notice.textContent = message;
        notice.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #f6b83e;
            color: #0a1929; padding: 10px 20px; border-radius: 40px;
            font-size: 0.85rem; font-weight: 500; z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: inherit;
        `;
        document.body.appendChild(notice);
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => notice.remove(), 400);
        }, 5000);
    }

    function showNoResultsMessage(term) {
        const notice = document.createElement('div');
        notice.textContent = `🔍 По запросу "${term}" ничего не найдено`;
        notice.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; background: #6c757d;
            color: white; padding: 10px 20px; border-radius: 40px;
            font-size: 0.85rem; font-weight: 500; z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: inherit;
        `;
        document.body.appendChild(notice);
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => notice.remove(), 400);
        }, 3000);
    }
})();

// ============================================
// AI-АССИСТЕНТ ДЛЯ СТРАНИЦ ПРОЦЕДУР
// (автоматически добавляется на все proc*.html)
// ============================================

if (!window.location.pathname.includes('index')) {
    (function() {
        const style = document.createElement('style');
        style.textContent = `
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
                display: none;
                overflow: hidden;
                border: 1px solid #e2e8f0;
            }
            .ai-widget.open { display: block; animation: slideInLeft 0.3s ease; }
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
            .ai-icon { font-size: 32px; animation: wave 2s infinite; }
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
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
            }
            .ai-close:hover { opacity: 1; background: rgba(255, 255, 255, 0.1); }
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
            .ai-input:focus { border-color: #f6b83e; box-shadow: 0 0 0 4px rgba(246, 184, 62, 0.15); }
            .ai-send {
                background: linear-gradient(135deg, #f6b83e, #ff8c00);
                border: none;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 22px;
                color: #0a1929;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(246, 184, 62, 0.3);
            }
            .ai-send:disabled { opacity: 0.5; cursor: not-allowed; }
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
        `;
        document.head.appendChild(style);

        const widget = document.createElement('div');
        widget.className = 'ai-widget';
        widget.id = 'aiWidget';
        widget.innerHTML = `
            <div class="ai-header">
                <span class="ai-icon">🤖</span>
                <span class="ai-title">AI · Ассистент КЭАЗ</span>
                <button class="ai-close" onclick="window.toggleAIWidget()">✕</button>
            </div>
            <div class="ai-messages" id="aiMessagesProc">
                <div class="ai-message ai-message-bot">
                    👋 <strong>Здравствуйте!</strong><br><br>
                    Я AI-ассистент КЭАЗ. Задайте вопрос по этой процедуре.
                </div>
            </div>
            <div class="ai-input-row">
                <input type="text" id="aiInputProc" class="ai-input" placeholder="Напишите ваш вопрос..." onkeypress="window.handleAIKeyPressProc(event)">
                <button class="ai-send" id="aiSendBtnProc" onclick="window.sendAIMessageProc()">➤</button>
            </div>
        `;
        document.body.appendChild(widget);

        const btn = document.createElement('button');
        btn.className = 'ai-search-btn';
        btn.innerHTML = '<span>🤖</span><span>AI</span>';
        btn.title = 'Спросить AI-ассистента';
        btn.onclick = () => window.toggleAIWidget();
        
        const h1 = document.querySelector('h1');
        if (h1) {
            h1.style.display = 'flex';
            h1.style.alignItems = 'center';
            h1.style.justifyContent = 'center';
            h1.style.gap = '12px';
            h1.appendChild(btn);
        }

        const PROXY_URL = 'https://keeaz-ai-server-production.up.railway.app/api/chat';

        window.toggleAIWidget = function() {
            const w = document.getElementById('aiWidget');
            w.classList.toggle('open');
            if (w.classList.contains('open')) {
                setTimeout(() => document.getElementById('aiInputProc').focus(), 100);
            }
        };

        window.handleAIKeyPressProc = function(event) {
            if (event.key === 'Enter') window.sendAIMessageProc();
        };

        window.showTypingIndicatorProc = function() {
            const div = document.createElement('div');
            div.className = 'typing-indicator';
            div.id = 'typingIndicatorProc';
            div.innerHTML = '<span></span><span></span><span></span>';
            document.getElementById('aiMessagesProc').appendChild(div);
        };

        window.removeTypingIndicatorProc = function() {
            const el = document.getElementById('typingIndicatorProc');
            if (el) el.remove();
        };

        window.addMessageProc = function(text, sender) {
            const div = document.createElement('div');
            div.className = `ai-message ai-message-${sender}`;
            div.innerHTML = text.replace(/\n/g, '<br>');
            document.getElementById('aiMessagesProc').appendChild(div);
            div.scrollIntoView({ behavior: 'smooth' });
        };

        window.sendAIMessageProc = async function() {
            const input = document.getElementById('aiInputProc');
            const msg = input.value.trim();
            if (!msg) return;
            
            input.value = '';
            window.addMessageProc(msg, 'user');
            window.showTypingIndicatorProc();
            
            const btn = document.getElementById('aiSendBtnProc');
            btn.disabled = true;
            
            try {
                const procName = document.querySelector('h1')?.textContent?.replace('🤖AI', '').trim() || '';
                
                const response = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: [
                            { role: 'system', content: `Ты — AI-ассистент КЭАЗ. Помогай разобраться в процедуре: ${procName}. Отвечай кратко.` },
                            { role: 'user', content: msg }
                        ]
                    })
                });
                
                window.removeTypingIndicatorProc();
                const data = await response.json();
                
                if (data.success) {
                    window.addMessageProc(data.content, 'bot');
                } else {
                    window.addMessageProc('❌ Ошибка. Попробуйте позже.', 'bot');
                }
            } catch (e) {
                window.removeTypingIndicatorProc();
                window.addMessageProc('❌ Не удалось подключиться к серверу.', 'bot');
            }
            
            btn.disabled = false;
        };
    })();
}
// ============================================
// АВТОМАТИЧЕСКОЕ ДОБАВЛЕНИЕ ССЫЛОК НА ВЫХОДЫ (С ОТЛАДКОЙ)
// ============================================

(function addSmartOutputLinks() {
    console.log('🚀 Скрипт выходов запущен');
    
    // Только на страницах процедур
    if (window.location.pathname.includes('index')) {
        console.log('⏭️ Это index.html, пропускаем');
        return;
    }
    
    // Определяем ID текущей процедуры
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    const currentProcId = filename.replace('proc', '').replace('.html', '');
    console.log('📌 ID текущей процедуры:', currentProcId);
    
    // Загружаем JSON и находим выходы
    fetch('procedures_data.json')
        .then(response => response.json())
        .then(data => {
            console.log('📂 JSON загружен, процедур:', data.procedures.length);
            
            // Находим текущую процедуру
            const currentProc = data.procedures.find(p => p.id === currentProcId);
            if (!currentProc) {
                console.warn('⚠️ Процедура не найдена в JSON');
                return;
            }
            
            console.log('📋 Найдена процедура:', currentProc.num, currentProc.name);
            
            // Извлекаем выходы
            const outputs = extractOutputsFromContent(currentProc.content);
            console.log('🔢 Извлечённые выходы:', outputs);
            
            if (outputs.length === 0) {
                console.warn('⚠️ Выходы не найдены в content');
                return;
            }
            
            // Ждём showDetail
            console.log('⏳ Ожидание функции showDetail...');
            const waitForShowDetail = setInterval(() => {
                if (typeof window.showDetail === 'function') {
                    clearInterval(waitForShowDetail);
                    console.log('✅ showDetail найдена, перехватываем...');
                    
                    const originalShowDetail = window.showDetail;
                    
                    window.showDetail = function(stepId) {
                        console.log('🖱️ Вызван showDetail для шага:', stepId);
                        originalShowDetail(stepId);
                        
                        setTimeout(() => {
                            const detailText = document.getElementById('detailText');
                            if (!detailText) {
                                console.warn('⚠️ #detailText не найден');
                                return;
                            }
                            
                            const stepText = detailText.textContent;
                            console.log('📝 Текст шага (первые 100 символов):', stepText.substring(0, 100));
                            
                            const isOutputStep = stepText.includes('Выход из процедуры') || 
                                               stepText.includes('📤 ВЫХОД') ||
                                               stepText.includes('Выход в процедуру');
                            
                            console.log('🚪 Это выход?', isOutputStep);
                            
                            if (isOutputStep) {
                                console.log('🔗 Добавляем ссылки на выходы:', outputs);
                                addOutputLinksToDetailPanel(outputs);
                            }
                        }, 150);
                    };
                }
            }, 200);
        })
        .catch(error => {
            console.error('❌ Ошибка загрузки JSON:', error);
        });
    
    function extractOutputsFromContent(content) {
        const outputs = [];
        console.log('🔍 Ищем выходы в content (первые 500 символов):', content.substring(0, 500));
        
        // Ищем "ВЫХОДЫ:" или "➡️"
        const outputsMatch = content.match(/(?:ВЫХОДЫ|➡️)\s*[:]?\s*([0-9а-я,\s]+)/i);
        if (outputsMatch) {
            console.log('✅ Найдено совпадение:', outputsMatch[0]);
            const nums = outputsMatch[1].match(/\d+[а-я]?/g);
            if (nums) {
                nums.forEach(num => {
                    if (!outputs.includes(num)) outputs.push(num);
                });
            }
        } else {
            console.warn('⚠️ Паттерн "ВЫХОДЫ" или "➡️" не найден');
        }
        
        return outputs;
    }
    
    function addOutputLinksToDetailPanel(outputs) {
        console.log('🎨 Добавляем ссылки в панель...');
        
        const detailText = document.getElementById('detailText');
        if (!detailText) return;
        
        let html = detailText.innerHTML;
        
        // Проверяем, нет ли уже ссылок
        if (html.includes('Процедура')) {
            console.log('⏭️ Ссылки уже есть, пропускаем');
            return;
        }
        
        const outputLabels = ['Выход из процедуры', '📤 ВЫХОД', 'Выход в процедуру'];
        
        for (const label of outputLabels) {
            if (html.includes(label)) {
                console.log('✅ Найдена метка:', label);
                
                const links = outputs.map(num => 
                    `<a href="proc${num}.html" class="proc-link" style="color: #1e6df2; text-decoration: none; font-weight: 600; padding: 2px 8px; border-radius: 20px; background: #e6f0ff; margin: 0 4px;">Процедура ${num}</a>`
                ).join(', ');
                
                html = html.replace(label, `${label} ${links}`);
                detailText.innerHTML = html;
                console.log('✅ Ссылки добавлены');
                return;
            }
        }
        
        console.warn('⚠️ Ни одна метка выхода не найдена в HTML');
    }
})();
