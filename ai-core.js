// ai-core.js - ЧИТАЕТ HTML-ФАЙЛЫ ПРОЦЕДУР
(function() {
    if (window.AICore) return;
    
    console.log("🤖 AI Core загружается (режим чтения HTML)...");
    
    const PROXY_URL = 'https://keaz-processes-main-production.up.railway.app/api/chat';
    let proceduresFullData = [];
    let proceduresHtmlContent = new Map(); // храним HTML-текст каждой процедуры

    // Загружаем ВСЕ HTML-файлы процедур и извлекаем из них текст шагов
    async function loadAllProceduresHtml() {
        const procNumbers = [];
        for (let i = 1; i <= 47; i++) {
            const num = i.toString();
            // пропускаем 4a, 4n и т.д. — они отдельно
            if (['4a', '4n', '4н'].includes(num)) continue;
            procNumbers.push(num);
        }
        // Добавляем спецномера
        const specialNums = ['4a', '4n', '4н', '42', '43', '44', '45', '46', '47'];
        procNumbers.push(...specialNums);
        
        console.log(`📄 Загружаем HTML для ${procNumbers.length} процедур...`);
        
        for (const num of procNumbers) {
            try {
                const response = await fetch(`proc${num}.html?v=${Date.now()}`);
                if (!response.ok) continue;
                const html = await response.text();
                
                // Извлекаем содержимое шагов из HTML
                const stepData = extractStepsFromHtml(html, num);
                if (stepData && Object.keys(stepData).length > 0) {
                    proceduresHtmlContent.set(num, stepData);
                    console.log(`✅ Загружена процедура ${num}: ${Object.keys(stepData).length} шагов`);
                }
            } catch (e) {
                console.warn(`⚠️ Не удалось загрузить proc${num}.html:`, e.message);
            }
        }
        
        console.log(`📚 Загружено HTML-процедур: ${proceduresHtmlContent.size}`);
    }

    // Извлекаем шаги из HTML процедуры
    function extractStepsFromHtml(html, procNum) {
        const steps = {};
        
        // Ищем stepData объект в JavaScript (как в proc1.html, proc2.html и т.д.)
        const stepDataMatch = html.match(/const stepData = (\{[\s\S]*?\n\}\);?\s*?\]?\s*?[\n<]/);
        if (stepDataMatch && stepDataMatch[1]) {
            try {
                // Пытаемся извлечь данные шагов
                const stepsObj = extractStepDataFromString(stepDataMatch[1]);
                if (stepsObj) {
                    for (const [stepId, stepInfo] of Object.entries(stepsObj)) {
                        steps[stepId] = {
                            num: stepInfo.number || stepId,
                            role: stepInfo.role || 'Не указана',
                            text: stepInfo.text || '',
                            inputs: stepInfo.inputs || [],
                            outputs: stepInfo.outputs || []
                        };
                    }
                }
            } catch (e) {
                console.warn(`Ошибка парсинга stepData для proc${procNum}:`, e);
            }
        }
        
        // Альтернативный поиск: ищем div.step-card с описаниями
        if (Object.keys(steps).length === 0) {
            const stepCards = html.match(/<div class="step-card[^>]*data-step="([^"]+)"[^>]*>[\s\S]*?<\/div>/gi);
            if (stepCards) {
                stepCards.forEach((card, idx) => {
                    const stepNumMatch = card.match(/data-step="([^"]+)"/);
                    const titleMatch = card.match(/<div class="step-title">([^<]+)<\/div>/);
                    const previewMatch = card.match(/<div class="step-preview">([^<]+)<\/div>/);
                    
                    if (stepNumMatch) {
                        steps[stepNumMatch[1]] = {
                            num: stepNumMatch[1],
                            role: 'См. детали',
                            text: `${titleMatch ? titleMatch[1] : ''}. ${previewMatch ? previewMatch[1] : ''}`,
                            inputs: [],
                            outputs: []
                        };
                    }
                });
            }
        }
        
        return steps;
    }

    function extractStepDataFromString(str) {
        try {
            // Очищаем строку
            let cleanStr = str
                .replace(/,\s*\]/g, ']')
                .replace(/,\s*\}/g, '}')
                .replace(/\/\/[^\n]*/g, '')
                .replace(/\n/g, ' ');
            
            // Находим числа и строки
            const numbers = {};
            const numberMatches = cleanStr.match(/(\d+):\s*\{/g);
            if (numberMatches) {
                numberMatches.forEach(match => {
                    const num = match.match(/\d+/)[0];
                    numbers[num] = true;
                });
            }
            
            // Простой парсинг: собираем все блоки вида "номер: { ... }"
            const stepBlocks = cleanStr.match(/\d+:\s*\{[\s\S]*?\n\}/g);
            if (!stepBlocks) return null;
            
            const result = {};
            for (const block of stepBlocks) {
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
            console.error('Ошибка парсинга stepData:', e);
            return null;
        }
    }

    async function loadProceduresFullData() {
        if (proceduresFullData.length > 0) return proceduresFullData;
        try {
            // Загружаем JSON
            const response = await fetch('procedures_data.json?v=' + Date.now());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.procedures) {
                proceduresFullData = data.procedures;
                console.log(`✅ Загружено ${proceduresFullData.length} процедур из JSON`);
            }
            
            // Загружаем HTML
            await loadAllProceduresHtml();
            
            return proceduresFullData;
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            return [];
        }
    }

    function buildFullContext(question) {
        let context = '';
        
        // Добавляем данные из JSON
        if (proceduresFullData.length > 0) {
            context += '=== ДАННЫЕ ИЗ JSON ===\n';
            proceduresFullData.forEach(proc => {
                context += `\n[ПРОЦЕДУРА ${proc.num}] ${proc.name}\n`;
                if (proc.content) context += `Содержание: ${proc.content.substring(0, 1500)}\n`;
                if (proc.roles) context += `Роли: ${proc.roles.join(', ')}\n`;
                if (proc.inputs) context += `Входы: ${proc.inputs.join(', ')}\n`;
                if (proc.outputs) context += `Выходы: ${proc.outputs.join(', ')}\n`;
            });
        }
        
        // Добавляем данные из HTML (шаги процедур)
        if (proceduresHtmlContent.size > 0) {
            context += '\n=== ДЕТАЛЬНЫЕ ШАГИ ИЗ HTML-ФАЙЛОВ ===\n';
            for (const [procNum, steps] of proceduresHtmlContent.entries()) {
                context += `\n[ПРОЦЕДУРА ${procNum} - ПОДРОБНЫЕ ШАГИ]\n`;
                for (const [stepId, step] of Object.entries(steps)) {
                    context += `  ШАГ ${step.num}: ${step.role}\n`;
                    context += `    ${step.text.substring(0, 500)}\n`;
                    if (step.inputs && step.inputs.length) {
                        context += `    Входы: ${step.inputs.join(', ')}\n`;
                    }
                    if (step.outputs && step.outputs.length) {
                        context += `    Выходы: ${step.outputs.join(', ')}\n`;
                    }
                }
            }
        }
        
        return context;
    }

    function formatMessage(text) {
        let cleanText = text
            .replace(/<a[^>]*>Процедура\s+(\d+[a-z]*)<\/a>/gi, 'Процедура $1')
            .replace(/<a[^>]*>процедуру\s+(\d+[a-z]*)<\/a>/gi, 'процедуру $1');
        
        cleanText = cleanText
            .replace(/^###\s+(.+)$/gm, '<strong style="font-size:1.05rem; display:block; margin:12px 0 8px 0;">$1</strong>')
            .replace(/^##\s+(.+)$/gm, '<strong style="font-size:1rem; display:block; margin:10px 0 6px 0;">$1</strong>')
            .replace(/^#\s+(.+)$/gm, '<strong style="font-size:0.95rem; display:block; margin:8px 0 4px 0;">$1</strong>')
            .replace(/^[-*]\s+(.+)$/gm, '<span style="display:block; margin-left:16px;">• $1</span>')
            .replace(/^\d+\.\s+(.+)$/gm, '<span style="display:block; margin-left:8px;"><strong>$&</strong></span>')
            .replace(/\*\*/g, '').replace(/\*/g, '').replace(/\n/g, '<br>');
        
        // Превращаем "Процедура X" в ссылку
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

    function injectStyles() {
        if (document.getElementById('ai-core-styles')) return;
        const style = document.createElement('style');
        style.id = 'ai-core-styles';
        style.textContent = `
            .ai-widget-hidden { display: none !important; }
            .ai-search-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 40px; background: linear-gradient(135deg, #f6b83e, #ff8c00); color: #0a1929; border: none; cursor: pointer; font-size: 0.95rem; font-weight: 600; box-shadow: 0 4px 12px rgba(246,184,62,0.3); transition: all 0.3s ease; animation: softPulse 2.5s infinite; border: 2px solid rgba(255,255,255,0.3); white-space: nowrap; margin-left: 12px; }
            .ai-search-btn:hover { transform: scale(1.05); box-shadow: 0 6px 18px rgba(246,184,62,0.5); animation: none; background: linear-gradient(135deg, #ff8c00, #f6b83e); }
            @keyframes softPulse { 0% { box-shadow: 0 4px 12px rgba(246,184,62,0.3); } 50% { box-shadow: 0 6px 18px rgba(246,184,62,0.5), 0 0 0 3px rgba(246,184,62,0.1); } 100% { box-shadow: 0 4px 12px rgba(246,184,62,0.3); } }
            .ai-widget { position: fixed; top: 50%; left: 24px; transform: translateY(-50%); width: 450px; max-width: calc(100vw - 40px); background: white; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); z-index: 9999; overflow: hidden; border: 1px solid #e2e8f0; display: none; }
            .ai-widget.open { display: block; animation: slideInLeft 0.3s ease; }
            @keyframes slideInLeft { from { opacity: 0; transform: translateY(-50%) translateX(-20px); } to { opacity: 1; transform: translateY(-50%) translateX(0); } }
            .ai-header { background: linear-gradient(135deg, #0a1929, #1a2642); color: white; padding: 16px 20px; display: flex; align-items: center; gap: 12px; cursor: move; }
            .ai-icon { font-size: 32px; animation: wave 2s infinite; }
            @keyframes wave { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
            .ai-title { flex: 1; font-weight: 600; font-size: 1.1rem; background: linear-gradient(90deg, #fff, #f6b83e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .ai-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; opacity: 0.7; transition: 0.2s; padding: 0; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
            .ai-close:hover { opacity: 1; background: rgba(255,255,255,0.1); }
            .ai-messages { height: 500px; max-height: 70vh; overflow-y: auto; padding: 20px; background: #f8fafc; display: flex; flex-direction: column; gap: 16px; font-size: 0.9rem; }
            .ai-message { padding: 14px 18px; border-radius: 18px; max-width: 85%; word-wrap: break-word; line-height: 1.5; }
            .ai-message-user { background: linear-gradient(135deg, #f6b83e, #ff8c00); color: #0a1929; align-self: flex-end; border-bottom-right-radius: 4px; box-shadow: 0 4px 12px rgba(246,184,62,0.3); }
            .ai-message-bot { background: white; color: #1e293b; align-self: flex-start; border-bottom-left-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .ai-message-bot .proc-link { color: #f6b83e; font-weight: 600; background: #fff3cf; padding: 2px 8px; border-radius: 20px; display: inline-block; text-decoration: none; }
            .ai-message-bot .proc-link:hover { background: #f6b83e; color: #0a1929; }
            .ai-message-bot strong { color: #0a1929; }
            .typing-indicator { display: flex; gap: 6px; padding: 14px 18px; background: white; border-radius: 18px; border-bottom-left-radius: 4px; align-self: flex-start; box-shadow: 0 2px 8px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
            .typing-indicator span { width: 10px; height: 10px; background: #f6b83e; border-radius: 50%; animation: typing 1.4s infinite; }
            .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
            .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
            @keyframes typing { 0%,60%,100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-10px); opacity: 1; } }
            .ai-input-row { display: flex; padding: 16px 20px; background: white; border-top: 1px solid #e2e8f0; gap: 12px; }
            .ai-input { flex: 1; padding: 12px 18px; border: 2px solid #e2e8f0; border-radius: 30px; font-size: 0.95rem; outline: none; transition: 0.2s; }
            .ai-input:focus { border-color: #f6b83e; box-shadow: 0 0 0 4px rgba(246,184,62,0.15); }
            .ai-send { background: linear-gradient(135deg, #f6b83e, #ff8c00); border: none; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; font-size: 22px; color: #0a1929; transition: 0.2s; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 4px 12px rgba(246,184,62,0.3); }
            .ai-send:hover { transform: scale(1.08) rotate(5deg); }
            .ai-send:disabled { opacity: 0.5; cursor: not-allowed; }
            .ai-resize-handle { position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nw-resize; font-size: 16px; color: #94a3b8; text-align: center; line-height: 18px; user-select: none; z-index: 10; }
        `;
        document.head.appendChild(style);
    }

    function createWidget() {
        const oldWidget = document.getElementById('aiWidget');
        if (oldWidget) oldWidget.remove();
        injectStyles();
        
        const widgetHTML = `
            <div class="ai-widget ai-widget-hidden" id="aiWidget">
                <div class="ai-header"><span class="ai-icon">🤖</span><span class="ai-title">AI · Ассистент КЭАЗ</span><button class="ai-close" onclick="AICore.toggleWidget()">✕</button></div>
                <div class="ai-messages" id="aiMessages"><div class="ai-message ai-message-bot"><strong>🤖 AI-ассистент КЭАЗ готов к работе.</strong><br><br>Я анализирую JSON и HTML-файлы всех процедур. Задайте вопрос.</div></div>
                <div class="ai-input-row"><input type="text" id="aiInput" class="ai-input" placeholder="Напишите ваш вопрос..." onkeypress="AICore.handleKeyPress(event)"><button class="ai-send" id="aiSendBtn" onclick="AICore.sendMessage()">➤</button></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        const widget = document.getElementById('aiWidget');
        const header = widget.querySelector('.ai-header');
        let isDragging = false, offsetX, offsetY;
        
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
        
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'ai-resize-handle';
        resizeHandle.innerHTML = '◢';
        widget.appendChild(resizeHandle);
        
        let isResizing = false, startWidth, startHeight, startX, startY;
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            isResizing = true;
            startWidth = widget.offsetWidth;
            startHeight = widget.offsetHeight;
            startX = e.clientX;
            startY = e.clientY;
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const newWidth = Math.max(350, Math.min(window.innerWidth - 100, startWidth + (e.clientX - startX)));
            const newHeight = Math.max(400, Math.min(window.innerHeight - 100, startHeight + (e.clientY - startY)));
            widget.style.width = `${newWidth}px`;
            widget.style.height = `${newHeight}px`;
            const messagesDiv = widget.querySelector('.ai-messages');
            if (messagesDiv) messagesDiv.style.height = `${newHeight - 130}px`;
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.userSelect = '';
                localStorage.setItem('aiWidgetWidth', widget.style.width);
                localStorage.setItem('aiWidgetHeight', widget.style.height);
            }
        });
    }

    window.AICore = {
        initButton: function(containerSelector = '.container h1, .subhead, h1') {
            if (document.querySelector('.ai-core-btn')) return;
            const container = document.querySelector(containerSelector);
            if (!container) return;
            
            const btn = document.createElement('button');
            btn.className = 'ai-search-btn ai-core-btn';
            btn.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;"><span style="background: linear-gradient(135deg, #f6b83e, #ff8c00); border-radius: 50%; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; font-size: 26px;">🤖</span><div style="text-align: left;"><div style="font-weight: 700; font-size: 1rem; color: #0a1929;">AI-ассистент КЭАЗ</div><div style="font-size: 0.75rem; color: #475569; white-space: nowrap;">Анализирую JSON и HTML</div></div></div>`;
            btn.style.padding = '10px 20px 10px 16px';
            btn.style.background = 'white';
            btn.style.border = '2px solid #f6b83e';
            btn.style.boxShadow = '0 6px 16px rgba(246,184,62,0.25)';
            btn.onclick = () => AICore.toggleWidget();
            
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.gap = '12px';
            container.appendChild(btn);
            
            createWidget();
            loadProceduresFullData();
        },
        
        toggleWidget: function() {
            let widget = document.getElementById('aiWidget');
            if (!widget) {
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
                console.error('Ошибка при определении стартовой процедуры:', e);
                return null;
            }
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
                // Убеждаемся, что данные загружены
                if (proceduresFullData.length === 0) {
                    await loadProceduresFullData();
                }
                
                // Формируем ПОЛНЫЙ контекст (JSON + HTML-шаги)
                const fullContext = buildFullContext(message);
                
                console.log(`📚 Размер контекста: ${Math.round(fullContext.length / 1024)} KB`);
                
                const systemPrompt = `Ты — AI-ассистент КЭАЗ. Твоя задача — помогать сотрудникам компании.

ТВОИ ЦЕННОСТИ:
1. АНАЛИЗИРУЙ ВСЮ БАЗУ ЗНАНИЙ. У тебя есть JSON и HTML всех процедур.
2. СТРОЙ ЛОГИЧЕСКИЕ ЦЕПОЧКИ. Покажи последовательность действий шаг за шагом.
3. УКАЗЫВАЙ РОЛИ. Кто за что отвечает.
4. В КОНЦЕ ОТВЕТА ДОБАВЛЯЙ [PROC:номера].

ФОРМАТ ОТВЕТА:
- Краткий ответ на вопрос
- Затем пошаговый алгоритм (если нужно)
- В конце — [PROC:номера]

БАЗА ЗНАНИЙ КЭАЗ (JSON + HTML-шаги):
${fullContext.substring(0, 35000)}

ВОПРОС ПОЛЬЗОВАТЕЛЯ: ${message}`;

                const response = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: message }],
                        fullData: proceduresFullData
                    })
                });
                
                AICore._removeTypingIndicator();
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const data = await response.json();
                
                if (data.success) {
                    let cleanContent = data.content;
                    
                    const procMatch = cleanContent.match(/\[PROC:([^\]]+)\]/);
                    let procNumbers = [];
                    if (procMatch && procMatch[1] !== 'none' && procMatch[1] !== '') {
                        procNumbers = procMatch[1].split(',').map(p => p.trim()).filter(p => /^\d+[a-z]*$/.test(p));
                        cleanContent = cleanContent.replace(/\[PROC:[^\]]+\]/, '');
                    }
                    
                    // Превращаем ссылки на процедуры в кликабельные
                    cleanContent = cleanContent.replace(/Процедура\s+(\d+[a-z]*)/gi, (match, num) => {
                        return `<a href="proc${num}.html" class="proc-link" style="color:#f6b83e; font-weight:600; background:#fff3cf; padding:2px 8px; border-radius:16px; text-decoration:none;">${match}</a>`;
                    });
                    
                    cleanContent = cleanContent.replace(/процедуру\s+(\d+[a-z]*)/gi, (match, num) => {
                        return `<a href="proc${num}.html" class="proc-link" style="color:#f6b83e; font-weight:600; background:#fff3cf; padding:2px 8px; border-radius:16px; text-decoration:none;">${match}</a>`;
                    });
                    
                    // Превращаем [PROC:X] в ссылку (если остался)
                    cleanContent = cleanContent.replace(/\[PROC:(\d+(?:,\d+)*)\]/gi, (match, nums) => {
                        const procList = nums.split(',');
                        const links = procList.map(num => 
                            `<a href="proc${num}.html" class="proc-link" style="color:#f6b83e; font-weight:600; background:#fff3cf; padding:2px 8px; border-radius:16px; text-decoration:none;">Процедура ${num}</a>`
                        ).join(', ');
                        return links;
                    });
                    
                    AICore._addMessage(cleanContent, 'bot');
                    
                    if (procNumbers.length > 0 && typeof window.filterByAIProcedures === 'function') {
                        window.filterByAIProcedures(procNumbers);
                        const messagesDiv = document.getElementById('aiMessages');
                        if (messagesDiv) {
                            const filterMsg = document.createElement('div');
                            filterMsg.className = 'ai-message ai-message-bot';
                            filterMsg.style.background = '#fff3cf';
                            filterMsg.style.borderColor = '#f6b83e';
                            filterMsg.style.marginTop = '10px';
                            filterMsg.innerHTML = `🎯 <strong>Карта отфильтрована</strong> — показаны процедуры: ${procNumbers.map(p => `<code style="background:#f6b83e; color:#0a1929; padding:2px 6px; border-radius:12px; margin:0 2px;">${p}</code>`).join(', ')}<br><br>
                            <a href="#" onclick="resetAIFilter(); return false;" style="color: #0a1929; background: #f6b83e; padding: 6px 12px; border-radius: 20px; text-decoration: none; font-weight: 600; display: inline-block;">🔄 Сбросить фильтр AI</a>`;
                            messagesDiv.appendChild(filterMsg);
                            messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }
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
    
    function initAICore() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (window.AICore) window.AICore.initButton('h1');
            });
        } else {
            if (window.AICore) window.AICore.initButton('h1');
        }
    }
    initAICore();
})();
