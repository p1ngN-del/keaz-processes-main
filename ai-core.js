// ai-core.js - ФИНАЛ С ИСТОРИЕЙ ДИАЛОГА
(function() {
    if (window.AICore) return;
    
    console.log("🤖 AI Core загружается...");
    
    const PROXY_URL = 'https://keaz-processes-main-production.up.railway.app/api/chat';
    let proceduresFullData = [];
    let conversationHistory = [];

    async function loadProceduresFullData() {
        if (proceduresFullData.length > 0) return proceduresFullData;
        try {
            const response = await fetch('procedures_data.json?v=' + Date.now());
            const data = await response.json();
            if (data.procedures) {
                proceduresFullData = data.procedures;
                console.log(`✅ Загружено ${proceduresFullData.length} процедур`);
            }
            return proceduresFullData;
        } catch (error) {
            console.error('❌ Ошибка:', error);
            return [];
        }
    }

    function buildFullContext() {
        let context = '';
        let totalLength = 0;
        const MAX_LENGTH = 70000;
        const priorityProcs = ['4', '4a', '4n', '17', '18', '19', '20', '23', '24', '25', '26', '27', '28', '30', '31'];
        
        for (const num of priorityProcs) {
            const proc = proceduresFullData.find(p => p.num === num);
            if (!proc) continue;
            const procText = `=== ПРОЦЕДУРА ${proc.num} ===\nНазвание: ${proc.name}\n${(proc.content || '').substring(0, 2000)}\n---\n\n`;
            if (totalLength + procText.length > MAX_LENGTH) break;
            context += procText;
            totalLength += procText.length;
        }
        
        if (totalLength < MAX_LENGTH) {
            for (const proc of proceduresFullData) {
                if (priorityProcs.includes(proc.num)) continue;
                const procText = `=== ПРОЦЕДУРА ${proc.num} ===\nНазвание: ${proc.name}\n${(proc.content || '').substring(0, 1500)}\n---\n\n`;
                if (totalLength + procText.length > MAX_LENGTH) break;
                context += procText;
                totalLength += procText.length;
            }
        }
        
        console.log(`📚 Контекст: ${Math.round(totalLength / 1024)} KB`);
        return context;
    }

    function formatMessage(text) {
        let cleanText = text;
        
        cleanText = cleanText.replace(/^### (.+)$/gm, '<strong style="font-size:1.1rem; display:block; margin:16px 0 8px 0;">$1</strong>');
        cleanText = cleanText.replace(/^## (.+)$/gm, '<strong style="font-size:1rem; display:block; margin:12px 0 6px 0;">$1</strong>');
        cleanText = cleanText.replace(/^# (.+)$/gm, '<strong style="font-size:0.95rem; display:block; margin:10px 0 4px 0;">$1</strong>');
        cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Ловит "в процедуре 28", "процедуре 28", "согласно 30" и т.д.
        cleanText = cleanText.replace(/(?:в\s+|согласно\s+)?(процедуре|процедура|стандарте|стандарт|инструкции|инструкция|методике|методика)\s+(\d+[a-z]*)/gi, (match, word, num) => {
            let type = 'Процедура';
            if (word.toLowerCase().startsWith('стандарт')) type = 'Стандарт';
            if (word.toLowerCase().startsWith('инструкц')) type = 'Инструкция';
            if (word.toLowerCase().startsWith('методик')) type = 'Методика';
            return `<a href="proc${num}.html" class="proc-link" style="color:#f6b83e; font-weight:600; background:#fff3cf; padding:2px 8px; border-radius:16px; text-decoration:none;">${type} ${num}</a>`;
        });
        
        cleanText = cleanText.replace(/(Процедура|Стандарт|Инструкция|Методика)\s+(\d+[a-z]*)/gi, (match, type, num) => {
            return `<a href="proc${num}.html" class="proc-link" style="color:#f6b83e; font-weight:600; background:#fff3cf; padding:2px 8px; border-radius:16px; text-decoration:none;">${match}</a>`;
        });
        
        cleanText = cleanText.replace(/\[PROC:(\d+(?:,\d+)*)\]/gi, (match, nums) => {
            const procList = nums.split(',');
            const links = procList.map(num => 
                `<a href="proc${num}.html" class="proc-link" style="color:#f6b83e; font-weight:600; background:#fff3cf; padding:2px 8px; border-radius:16px; text-decoration:none;">Процедура ${num}</a>`
            ).join(', ');
            return links;
        });
        
        cleanText = cleanText.replace(/^[-*]\s+(.+)$/gm, '<span style="display:block; margin-left:16px; margin-bottom:4px;">• $1</span>');
        cleanText = cleanText.replace(/^\d+\.\s+(.+)$/gm, '<span style="display:block; margin-left:8px; margin-bottom:4px;"><strong>$&</strong></span>');
        cleanText = cleanText.replace(/\n/g, '<br>');
        return cleanText;
    }

    function injectStyles() {
        if (document.getElementById('ai-core-styles')) return;
        const style = document.createElement('style');
        style.id = 'ai-core-styles';
        style.textContent = `
            #aiFloatingButton {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                padding: 14px 28px;
                border-radius: 60px;
                background: linear-gradient(135deg, #f6b83e, #ff8c00);
                color: #0a1929;
                border: none;
                cursor: pointer;
                font-size: 1.1rem;
                font-weight: 700;
                box-shadow: 0 4px 15px rgba(246, 184, 62, 0.35);
                transition: all 0.3s ease;
                animation: softPulse 2.5s infinite;
                border: 2px solid rgba(255, 255, 255, 0.3);
                margin: 0 auto;
            }
            #aiFloatingButton:hover {
                transform: scale(1.05);
                animation: none;
                box-shadow: 0 6px 25px rgba(246, 184, 62, 0.5);
            }
            #aiFloatingButton .ai-btn-icon { font-size: 26px; }
            #aiFloatingButton .ai-btn-text { font-size: 1rem; font-weight: 700; }

            .ai-widget {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 500px;
                max-width: calc(100vw - 40px);
                background: white;
                border-radius: 28px;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
                z-index: 10001;
                overflow: hidden;
                border: 1px solid #e2e8f0;
                display: none;
            }
            .ai-widget.open { display: block; animation: fadeInScale 0.25s ease; }
            @keyframes fadeInScale {
                from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }

            .ai-header {
                background: linear-gradient(135deg, #0a1929, #1a2642);
                color: white;
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: move;
            }
            .ai-icon { font-size: 28px; }
            .ai-title { flex: 1; font-weight: 700; font-size: 1.05rem; background: linear-gradient(90deg, #fff, #f6b83e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
            .ai-close { background: none; border: none; color: white; font-size: 22px; cursor: pointer; padding: 0 6px; }
            .ai-close:hover { opacity: 0.7; }

            .ai-messages {
                height: 440px;
                max-height: 65vh;
                overflow-y: auto;
                padding: 18px;
                background: #f8fafc;
                display: flex;
                flex-direction: column;
                gap: 14px;
                font-size: 0.9rem;
            }
            .ai-message {
                padding: 12px 16px;
                border-radius: 18px;
                max-width: 85%;
                word-wrap: break-word;
                line-height: 1.5;
            }
            .ai-message-user {
                background: linear-gradient(135deg, #f6b83e, #ff8c00);
                color: #0a1929;
                align-self: flex-end;
                border-bottom-right-radius: 4px;
            }
            .ai-message-bot {
                background: white;
                color: #1e293b;
                align-self: flex-start;
                border-bottom-left-radius: 4px;
                border: 1px solid #e2e8f0;
            }
            .ai-message-bot .proc-link {
                color: #f6b83e;
                font-weight: 600;
                background: #fff3cf;
                padding: 2px 8px;
                border-radius: 16px;
                display: inline-block;
                text-decoration: none;
            }

            .typing-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 12px 16px;
                background: white;
                border-radius: 18px;
                border-bottom-left-radius: 4px;
                align-self: flex-start;
                border: 1px solid #e2e8f0;
                max-width: 200px;
            }
            .typing-icon {
                font-size: 1.1rem;
                animation: typingWave 1s infinite;
                display: inline-block;
            }
            @keyframes typingWave {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-4px); }
            }
            .typing-dots {
                display: flex;
                gap: 5px;
                align-items: center;
            }
            .typing-dots span {
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #f6b83e;
                border-radius: 50%;
                animation: ballBounce 0.8s infinite ease-in-out;
            }
            .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
            .typing-dots span:nth-child(3) { animation-delay: 0.3s; }
            @keyframes ballBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
            }
            .typing-text {
                color: #64748b;
                font-size: 0.85rem;
                font-weight: 500;
                margin-left: 4px;
            }

            .ai-input-row {
                display: flex;
                padding: 14px 18px;
                background: white;
                border-top: 1px solid #e2e8f0;
                gap: 10px;
            }
            .ai-input {
                flex: 1;
                padding: 10px 16px;
                border: 2px solid #e2e8f0;
                border-radius: 30px;
                font-size: 0.9rem;
                outline: none;
            }
            .ai-input:focus { border-color: #f6b83e; }
            .ai-send {
                background: linear-gradient(135deg, #f6b83e, #ff8c00);
                border: none;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 20px;
                color: #0a1929;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
            .ai-send:hover { transform: scale(1.06) rotate(3deg); }
            .ai-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

            .ai-clear-history {
                background: none;
                border: none;
                color: white;
                font-size: 17px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 6px;
                transition: 0.2s;
            }
            .ai-clear-history:hover { background: rgba(255,255,255,0.15); }

            @keyframes softPulse {
                0% { box-shadow: 0 4px 15px rgba(246, 184, 62, 0.3); }
                50% { box-shadow: 0 6px 25px rgba(246, 184, 62, 0.6), 0 0 0 3px rgba(246, 184, 62, 0.15); }
                100% { box-shadow: 0 4px 15px rgba(246, 184, 62, 0.3); }
            }

            @media (max-width: 600px) {
                .ai-widget {
                    width: calc(100vw - 20px);
                    max-width: none;
                    top: 10px;
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                    transform: none;
                    border-radius: 20px;
                }
                .ai-widget.open {
                    position: fixed;
                    top: 10px;
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                    width: auto;
                }
                .ai-messages {
                    height: calc(100vh - 140px);
                    max-height: none;
                }
                #aiFloatingButton {
                    padding: 10px 18px;
                    font-size: 0.9rem;
                }
                #aiFloatingButton .ai-btn-icon { font-size: 20px; }
                #aiFloatingButton .ai-btn-text { font-size: 0.8rem; }
            }
        `;
        document.head.appendChild(style);
    }

    function createWidget() {
        const oldWidget = document.getElementById('aiWidget');
        if (oldWidget) oldWidget.remove();
        injectStyles();
        
        const welcomeMessage = "🤖 <strong>Привет! Я AI-ассистент КЭАЗ.</strong><br><br>Я анализирую все бизнес-процессы, процедуры, инструкции, стандарты и методики компании. Могу подсказать, где посмотреть детали, какие шаги выполнить и кто ответственный.<br><br>📌 <strong>Примеры запросов:</strong><br>• «Как получить ТН ВЭД?»<br>• «Кто утверждает цены на новую продукцию?»<br>• «Покажи все шаги процедуры 4»<br>• «Какие роли участвуют в согласовании договора?»<br><br>Чем могу помочь?";
        
        const widgetHTML = `
            <div class="ai-widget" id="aiWidget">
                <div class="ai-header">
                    <span class="ai-icon">🤖</span>
                    <span class="ai-title">AI · Ассистент КЭАЗ</span>
                    <button class="ai-clear-history" onclick="AICore.clearHistory()" title="Очистить историю диалога">🗑️</button>
                    <button class="ai-close" onclick="AICore.toggleWidget()">✕</button>
                </div>
                <div class="ai-messages" id="aiMessages"><div class="ai-message ai-message-bot">${welcomeMessage}</div></div>
                <div class="ai-input-row"><input type="text" id="aiInput" class="ai-input" placeholder="Напишите ваш вопрос..." onkeypress="AICore.handleKeyPress(event)"><button class="ai-send" id="aiSendBtn" onclick="AICore.sendMessage()">➤</button></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        if (!document.getElementById('aiFloatingButton')) {
            const floatBtn = document.createElement('button');
            floatBtn.id = 'aiFloatingButton';
            floatBtn.innerHTML = '<span class="ai-btn-icon">🤖</span><span class="ai-btn-text">AI Ассистент</span>';
            floatBtn.onclick = () => window.AICore?.toggleWidget();
            
            const subhead = document.querySelector('.subhead');
            if (subhead && subhead.parentNode) {
                const wrapper = document.createElement('div');
                wrapper.style.display = 'flex';
                wrapper.style.justifyContent = 'center';
                wrapper.style.margin = '16px 0 12px 0';
                wrapper.appendChild(floatBtn);
                subhead.insertAdjacentElement('afterend', wrapper);
            } else {
                document.body.appendChild(floatBtn);
            }
        }
        
        const widget = document.getElementById('aiWidget');
        const header = widget.querySelector('.ai-header');
        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.ai-close') || e.target.closest('.ai-clear-history')) return;
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
        document.addEventListener('mouseup', () => { isDragging = false; });
    }

    window.AICore = {
        initButton: function() {
            createWidget();
            loadProceduresFullData();
        },
        toggleWidget: function() {
            const widget = document.getElementById('aiWidget');
            if (!widget) { createWidget(); return; }
            widget.classList.toggle('open');
        },
        handleKeyPress: function(event) {
            if (event.key === 'Enter') AICore.sendMessage();
        },
        clearHistory: function() {
            conversationHistory = [];
            const messagesDiv = document.getElementById('aiMessages');
            if (messagesDiv) {
                messagesDiv.innerHTML = '<div class="ai-message ai-message-bot">🤖 <strong>Привет! Я AI-ассистент КЭАЗ.</strong><br><br>История диалога очищена. Чем могу помочь?</div>';
            }
        },
        _showTypingIndicator: function() {
            const messagesDiv = document.getElementById('aiMessages');
            if (!messagesDiv) return;
            
            const oldIndicator = document.getElementById('typingIndicator');
            if (oldIndicator) oldIndicator.remove();
            
            const div = document.createElement('div');
            div.className = 'typing-indicator';
            div.id = 'typingIndicator';
            div.innerHTML = '<span class="typing-icon">🤖</span><div class="typing-dots"><span></span><span></span><span></span></div><span class="typing-text">печатает</span>';
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        },
        _removeTypingIndicator: function() {
            const indicator = document.getElementById('typingIndicator');
            if (indicator && indicator._dotInterval) clearInterval(indicator._dotInterval);
            indicator?.remove();
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
                if (proceduresFullData.length === 0) await loadProceduresFullData();
                const fullContext = buildFullContext();
                
                conversationHistory.push({ role: 'user', content: message });
                if (conversationHistory.length > 10) {
                    conversationHistory = conversationHistory.slice(-10);
                }
                
                const response = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        messages: [{ role: 'user', content: message }],
                        fullData: proceduresFullData,
                        htmlContext: fullContext,
                        conversationHistory: conversationHistory
                    })
                });
                
                AICore._removeTypingIndicator();
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                
                if (data.success) {
                    conversationHistory.push({ role: 'assistant', content: data.content });
                    
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
                AICore._addMessage('⚠️ Ошибка подключения к серверу.', 'bot');
                console.error(e);
            }
            btn.disabled = false;
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.AICore.initButton());
    } else {
        window.AICore.initButton();
    }
})();
