// ai-core.js - РАБОЧАЯ ВЕРСИЯ (кнопка всегда видна + читает HTML процедур)
(function() {
    if (window.AICore) return;
    
    console.log("🤖 AI Core загружается...");
    
    const PROXY_URL = 'https://keaz-processes-main-production.up.railway.app/api/chat';
    let proceduresFullData = [];
    let proceduresHtmlSteps = new Map(); // храним шаги из HTML

    // ========== ЗАГРУЗКА JSON ==========
    async function loadProceduresFullData() {
        if (proceduresFullData.length > 0) return proceduresFullData;
        try {
            const response = await fetch('procedures_data.json?v=' + Date.now());
            const data = await response.json();
            if (data.procedures) {
                proceduresFullData = data.procedures;
                console.log(`✅ Загружено ${proceduresFullData.length} процедур из JSON`);
            }
            return proceduresFullData;
        } catch (error) {
            console.error('❌ Ошибка загрузки procedures_data.json:', error);
            return [];
        }
    }

    // ========== ЗАГРУЗКА HTML (ВСЕХ ПРОЦЕДУР) ==========
    async function loadAllProceduresHtml() {
        const procNumbers = ['1','2','3','4','4a','4n','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33','34','35','36','37','38','39','40','41','42','43','44','45','46','47'];
        
        console.log(`📄 Загружаем HTML для ${procNumbers.length} процедур...`);
        
        for (const num of procNumbers) {
            try {
                const response = await fetch(`proc${num}.html?v=${Date.now()}`);
                if (!response.ok) continue;
                const html = await response.text();
                
                // Извлекаем stepData из HTML
                const steps = extractStepsFromHtml(html, num);
                if (steps && Object.keys(steps).length > 0) {
                    proceduresHtmlSteps.set(num, steps);
                    console.log(`✅ Загружена процедура ${num}: ${Object.keys(steps).length} шагов`);
                }
            } catch (e) {
                console.warn(`⚠️ Не удалось загрузить proc${num}.html:`, e.message);
            }
        }
        console.log(`📚 Загружено HTML-процедур: ${proceduresHtmlSteps.size}`);
    }

    // ========== ПАРСИНГ stepData ИЗ HTML ==========
    function extractStepsFromHtml(html, procNum) {
        const steps = {};
        
        // Ищем объект stepData = { ... }
        const stepDataMatch = html.match(/const stepData = (\{[\s\S]*?\n\}\);?\s*?\]?\s*?[\n<]/);
        if (stepDataMatch && stepDataMatch[1]) {
            try {
                const stepsObj = parseStepDataString(stepDataMatch[1]);
                if (stepsObj) {
                    for (const [stepId, stepInfo] of Object.entries(stepsObj)) {
                        steps[stepId] = {
                            number: stepInfo.number || stepId,
                            role: stepInfo.role || 'Не указана',
                            text: (stepInfo.text || '').substring(0, 800),
                            inputs: stepInfo.inputs || [],
                            outputs: stepInfo.outputs || []
                        };
                    }
                }
            } catch (e) {
                console.warn(`Ошибка парсинга stepData для proc${procNum}:`, e);
            }
        }
        
        return steps;
    }

    function parseStepDataString(str) {
        try {
            const result = {};
            // Ищем блоки вида "1: { ... }"
            const blocks = str.match(/\d+:\s*\{[\s\S]*?\n\}/g);
            if (!blocks) return null;
            
            for (const block of blocks) {
                const numMatch = block.match(/^(\d+):/);
                if (!numMatch) continue;
                const stepNum = numMatch[1];
                
                const roleMatch = block.match(/role:\s*["']([^"']+)["']/);
                const textMatch = block.match(/text:\s*["']([^"']+)["']/);
                const inputsMatch = block.match(/inputs:\s*\[([^\]]*)\]/);
                const outputsMatch = block.match(/outputs:\s*\[([^\]]*)\]/);
                
                result[stepNum] = {
                    number: stepNum,
                    role: roleMatch ? roleMatch[1] : '',
                    text: textMatch ? textMatch[1] : '',
                    inputs: inputsMatch ? inputsMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')) : [],
                    outputs: outputsMatch ? outputsMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')) : []
                };
            }
            return Object.keys(result).length > 0 ? result : null;
        } catch (e) {
            return null;
        }
    }

    // ========== ФОРМИРУЕМ ПОЛНЫЙ КОНТЕКСТ ДЛЯ AI ==========
    function buildFullContext() {
        let context = '';
        
        // Добавляем JSON
        if (proceduresFullData.length > 0) {
            context += '=== ДАННЫЕ ИЗ JSON ===\n';
            for (const proc of proceduresFullData) {
                context += `[${proc.num}] ${proc.name}\n`;
                if (proc.content) context += `${proc.content.substring(0, 1200)}\n`;
                if (proc.roles) context += `Роли: ${proc.roles.join(', ')}\n`;
            }
        }
        
        // Добавляем HTML-шаги
        if (proceduresHtmlSteps.size > 0) {
            context += '\n=== ПОДРОБНЫЕ ШАГИ ИЗ HTML ===\n';
            for (const [procNum, steps] of proceduresHtmlSteps.entries()) {
                context += `\n[ПРОЦЕДУРА ${procNum} - ШАГИ]\n`;
                for (const [stepId, step] of Object.entries(steps)) {
                    context += `  ШАГ ${step.number}: ${step.role}\n`;
                    context += `    ${step.text.substring(0, 300)}\n`;
                }
            }
        }
        
        return context;
    }

    // ========== ФОРМАТИРОВАНИЕ СООБЩЕНИЯ С ССЫЛКАМИ ==========
    function formatMessage(text) {
        let cleanText = text;
        
        // Убираем старые теги
        cleanText = cleanText.replace(/<a[^>]*>Процедура\s+(\d+[a-z]*)<\/a>/gi, 'Процедура $1');
        cleanText = cleanText.replace(/<a[^>]*>процедуру\s+(\d+[a-z]*)<\/a>/gi, 'процедуру $1');
        
        // Преобразуем Markdown-подобные заголовки
        cleanText = cleanText.replace(/^###\s+(.+)$/gm, '<strong style="font-size:1.05rem; display:block; margin:12px 0 8px 0;">$1</strong>');
        cleanText = cleanText.replace(/^##\s+(.+)$/gm, '<strong style="font-size:1rem; display:block; margin:10px 0 6px 0;">$1</strong>');
        cleanText = cleanText.replace(/^#\s+(.+)$/gm, '<strong style="font-size:0.95rem; display:block; margin:8px 0 4px 0;">$1</strong>');
        cleanText = cleanText.replace(/^[-*]\s+(.+)$/gm, '<span style="display:block; margin-left:16px;">• $1</span>');
        cleanText = cleanText.replace(/^\d+\.\s+(.+)$/gm, '<span style="display:block; margin-left:8px;"><strong>$&</strong></span>');
        cleanText = cleanText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, '<br>');
        
        // Превращаем "Процедура X" в кликабельную ссылку
        cleanText = cleanText.replace(/Процедура\s+(\d+[a-z]*)/gi, (match, num) => {
            return `<a href="proc${num}.html" class="proc-link" style="color:#f6b83e; font-weight:600; background:#fff3cf; padding:2px 8px; border-radius:16px; text-decoration:none;">${match}</a>`;
        });
        
        cleanText = cleanText.replace(/процедуру\s+(\d+[a-z]*)/gi, (match, num) => {
            return `<a href="proc${num}.html" class="proc-link" style="color:#f6b83e; font-weight:600; background:#fff3cf; padding:2px 8px; border-radius:16px; text-decoration:none;">${match}</a>`;
        });
        
        // Превращаем [PROC:X] в ссылку
        cleanText = cleanText.replace(/\[PROC:(\d+(?:,\d+)*)\]/gi, (match, nums) => {
            const procList = nums.split(',');
            const links = procList.map(num => 
                `<a href="proc${num}.html" class="proc-link" style="color:#f6b83e; font-weight:600; background:#fff3cf; padding:2px 8px; border-radius:16px; text-decoration:none;">Процедура ${num}</a>`
            ).join(', ');
            return links;
        });
        
        return cleanText;
    }

    // ========== СТИЛИ ==========
    function injectStyles() {
        if (document.getElementById('ai-core-styles')) return;
        const style = document.createElement('style');
        style.id = 'ai-core-styles';
        style.textContent = `
            .ai-widget-hidden { display: none !important; }
            .ai-floating-button {
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 10000;
                background: linear-gradient(135deg, #f6b83e, #ff8c00);
                border: none;
                border-radius: 50%;
                width: 56px;
                height: 56px;
                font-size: 28px;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .ai-floating-button:hover {
                transform: scale(1.1);
                box-shadow: 0 8px 20px rgba(246,184,62,0.4);
            }
            .ai-widget {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 450px;
                max-width: calc(100vw - 40px);
                background: white;
                border-radius: 24px;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                z-index: 10001;
                overflow: hidden;
                border: 1px solid #e2e8f0;
                display: none;
            }
            .ai-widget.open { display: block; }
            .ai-header {
                background: linear-gradient(135deg, #0a1929, #1a2642);
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: move;
            }
            .ai-icon { font-size: 32px; animation: wave 2s infinite; }
            @keyframes wave { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
            .ai-title { flex: 1; font-weight: 600; font-size: 1.1rem; background: linear-gradient(90deg, #fff, #f6b83e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .ai-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px; border-radius: 8px; }
            .ai-close:hover { background: rgba(255,255,255,0.1); }
            .ai-messages { height: 480px; max-height: 65vh; overflow-y: auto; padding: 20px; background: #f8fafc; display: flex; flex-direction: column; gap: 16px; font-size: 0.9rem; }
            .ai-message { padding: 14px 18px; border-radius: 18px; max-width: 85%; word-wrap: break-word; line-height: 1.5; }
            .ai-message-user { background: linear-gradient(135deg, #f6b83e, #ff8c00); color: #0a1929; align-self: flex-end; border-bottom-right-radius: 4px; }
            .ai-message-bot { background: white; color: #1e293b; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
            .ai-message-bot .proc-link { color: #f6b83e; font-weight: 600; background: #fff3cf; padding: 2px 8px; border-radius: 20px; display: inline-block; text-decoration: none; }
            .ai-message-bot .proc-link:hover { background: #f6b83e; color: #0a1929; }
            .typing-indicator { display: flex; gap: 6px; padding: 14px 18px; background: white; border-radius: 18px; border-bottom-left-radius: 4px; align-self: flex-start; border: 1px solid #e2e8f0; }
            .typing-indicator span { width: 10px; height: 10px; background: #f6b83e; border-radius: 50%; animation: typing 1.4s infinite; }
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing { 0%,60%,100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-10px); opacity: 1; } }
            .ai-input-row { display: flex; padding: 16px 20px; background: white; border-top: 1px solid #e2e8f0; gap: 12px; }
            .ai-input { flex: 1; padding: 12px 18px; border: 2px solid #e2e8f0; border-radius: 30px; font-size: 0.95rem; outline: none; }
            .ai-input:focus { border-color: #f6b83e; box-shadow: 0 0 0 4px rgba(246,184,62,0.15); }
            .ai-send { background: linear-gradient(135deg, #f6b83e, #ff8c00); border: none; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; font-size: 22px; color: #0a1929; display: flex; align-items: center; justify-content: center; font-weight: bold; }
            .ai-send:hover { transform: scale(1.08) rotate(5deg); }
            .ai-send:disabled { opacity: 0.5; cursor: not-allowed; }
            .ai-resize-handle { position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nw-resize; font-size: 16px; color: #94a3b8; text-align: center; line-height: 18px; user-select: none; z-index: 10; }
        `;
        document.head.appendChild(style);
    }

    // ========== СОЗДАНИЕ ВИДЖЕТА ==========
    function createWidget() {
        const oldWidget = document.getElementById('aiWidget');
        if (oldWidget) oldWidget.remove();
        injectStyles();
        
        const widgetHTML = `
            <div class="ai-widget ai-widget-hidden" id="aiWidget">
                <div class="ai-header"><span class="ai-icon">🤖</span><span class="ai-title">AI · Ассистент КЭАЗ</span><button class="ai-close" onclick="AICore.toggleWidget()">✕</button></div>
                <div class="ai-messages" id="aiMessages"><div class="ai-message ai-message-bot"><strong>🤖 AI-ассистент КЭАЗ готов к работе.</strong><br><br>Я анализирую JSON и HTML-файлы процедур. Задайте вопрос.</div></div>
                <div class="ai-input-row"><input type="text" id="aiInput" class="ai-input" placeholder="Напишите ваш вопрос..." onkeypress="AICore.handleKeyPress(event)"><button class="ai-send" id="aiSendBtn" onclick="AICore.sendMessage()">➤</button></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        // Добавляем плавающую кнопку
        if (!document.getElementById('aiFloatingButton')) {
            const floatBtn = document.createElement('button');
            floatBtn.id = 'aiFloatingButton';
            floatBtn.className = 'ai-floating-button';
            floatBtn.innerHTML = '🤖';
            floatBtn.onclick = () => window.AICore?.toggleWidget();
            document.body.appendChild(floatBtn);
        }
        
        // Ресайз и драг (упрощённо)
        const widget = document.getElementById('aiWidget');
        const header = widget.querySelector('.ai-header');
        let isDragging = false, offsetX, offsetY;
        
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.ai-close')) return;
            isDragging = true;
            const rect = widget.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            widget.style.position = 'fixed';
            widget.style.left = `${rect.left}px`;
            widget.style.top = `${rect.top}px`;
            widget.style.transform = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let left = e.clientX - offsetX;
            let top = e.clientY - offsetY;
            left = Math.max(0, Math.min(window.innerWidth - widget.offsetWidth, left));
            top = Math.max(0, Math.min(window.innerHeight - widget.offsetHeight, top));
            widget.style.left = `${left}px`;
            widget.style.top = `${top}px`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    // ========== AI ==========
    window.AICore = {
        initButton: function() {
            // Не нужно — кнопка уже создана
            createWidget();
            loadProceduresFullData().then(() => loadAllProceduresHtml());
        },
        
        toggleWidget: function() {
            const widget = document.getElementById('aiWidget');
            if (!widget) {
                createWidget();
                return;
            }
            widget.classList.toggle('open');
            widget.classList.remove('ai-widget-hidden');
            if (widget.classList.contains('open')) {
                setTimeout(() => document.getElementById('aiInput')?.focus(), 100);
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
            document.getElementById('typingIndicator')?.remove();
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
        
        getStartProc: async function(role, procedures) {
            try {
                const response = await fetch(PROXY_URL.replace('/api/chat', '/api/get-start-proc'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role, procedures })
                });
                if (!response.ok) return null;
                const data = await response.json();
                return data.success ? data.procId : null;
            } catch (e) {
                return null;
            }
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
                if (proceduresFullData.length === 0) {
                    await loadProceduresFullData();
                }
                if (proceduresHtmlSteps.size === 0) {
                    await loadAllProceduresHtml();
                }
                
                const fullContext = buildFullContext();
                console.log(`📚 Размер контекста: ${Math.round(fullContext.length / 1024)} KB`);
                
                const systemPrompt = `Ты — AI-ассистент КЭАЗ. Анализируй JSON и HTML-шаги процедур.
Дай пошаговый ответ с ролями. В конце добавь [PROC:номера].

БАЗА ЗНАНИЙ:
${fullContext.substring(0, 35000)}

ВОПРОС: ${message}`;

                const response = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
                        fullData: proceduresFullData
                    })
                });
                
                AICore._removeTypingIndicator();
                
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data = await response.json();
                
                if (data.success) {
                    let cleanContent = data.content;
                    
                    const procMatch = cleanContent.match(/\[PROC:([^\]]+)\]/);
                    let procNumbers = [];
                    if (procMatch && procMatch[1] !== 'none') {
                        procNumbers = procMatch[1].split(',').map(p => p.trim());
                        cleanContent = cleanContent.replace(/\[PROC:[^\]]+\]/, '');
                    }
                    
                    cleanContent = formatMessage(cleanContent);
                    AICore._addMessage(cleanContent, 'bot');
                    
                    if (procNumbers.length > 0 && typeof window.filterByAIProcedures === 'function') {
                        window.filterByAIProcedures(procNumbers);
                    }
                } else {
                    AICore._addMessage('Ошибка. Попробуйте позже.', 'bot');
                }
            } catch (e) {
                AICore._removeTypingIndicator();
                AICore._addMessage('Ошибка подключения к серверу.', 'bot');
                console.error(e);
            }
            
            btn.disabled = false;
        }
    };
    
    // Запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.AICore.initButton());
    } else {
        window.AICore.initButton();
    }
})();
