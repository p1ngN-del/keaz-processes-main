// ai-core.js - ФИНАЛ
(function() {
    if (window.AICore) return;
    
    console.log("🤖 AI Core загружается...");
    
    const PROXY_URL = 'https://keaz-processes-main-production.up.railway.app/api/chat';
    let proceduresFullData = [];

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
        for (const proc of proceduresFullData) {
            context += `=== ПРОЦЕДУРА ${proc.num} ===\n`;
            context += `Название: ${proc.name}\n`;
            if (proc.content) context += `${proc.content}\n`;
            if (proc.roles) context += `Роли: ${proc.roles.join(', ')}\n`;
            context += `---\n\n`;
        }
        return context;
    }

    function formatMessage(text) {
        let cleanText = text;
        
        cleanText = cleanText.replace(/^### (.+)$/gm, '<strong style="font-size:1.1rem; display:block; margin:16px 0 8px 0;">$1</strong>');
        cleanText = cleanText.replace(/^## (.+)$/gm, '<strong style="font-size:1rem; display:block; margin:12px 0 6px 0;">$1</strong>');
        cleanText = cleanText.replace(/^# (.+)$/gm, '<strong style="font-size:0.95rem; display:block; margin:10px 0 4px 0;">$1</strong>');
        cleanText = cleanText.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Ссылки на всё
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
            .ai-floating-button {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                width: auto;
                min-width: 240px;
                padding: 16px 32px;
                border-radius: 60px;
                background: linear-gradient(135deg, #f6b83e, #ff8c00);
                color: #0a1929;
                border: none;
                cursor: pointer;
                font-size: 1.3rem;
                font-weight: 800;
                box-shadow: 0 6px 20px rgba(246, 184, 62, 0.4);
                transition: all 0.3s ease;
                animation: softPulse 2.5s infinite;
                border: 2px solid rgba(255, 255, 255, 0.4);
                margin: 20px auto;
            }
            @keyframes softPulse {
                0% { box-shadow: 0 4px 12px rgba(246, 184, 62, 0.3); }
                50% { box-shadow: 0 6px 18px rgba(246, 184, 62, 0.6), 0 0 0 3px rgba(246, 184, 62, 0.2); }
                100% { box-shadow: 0 4px 12px rgba(246, 184, 62, 0.3); }
            }
            .ai-floating-button:hover {
                transform: scale(1.05);
                animation: none;
            }
            .ai-floating-button .ai-btn-icon { font-size: 32px; }
            .ai-floating-button .ai-btn-text { font-size: 1.2rem; }
            .ai-widget {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 500px;
                max-width: calc(100vw - 40px);
                background: white;
                border-radius: 28px;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                z-index: 10001;
                overflow: hidden;
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
            .ai-icon { font-size: 32px; }
            .ai-title { flex: 1; font-weight: 700; font-size: 1.1rem; background: linear-gradient(90deg, #fff, #f6b83e); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .ai-close { background: none; border: none; color: white; font-size: 24px; cursor: pointer; }
            .ai-messages { height: 480px; max-height: 65vh; overflow-y: auto; padding: 20px; background: #f8fafc; display: flex; flex-direction: column; gap: 16px; }
            .ai-message { padding: 14px 18px; border-radius: 20px; max-width: 85%; word-wrap: break-word; }
            .ai-message-user { background: linear-gradient(135deg, #f6b83e, #ff8c00); color: #0a1929; align-self: flex-end; border-bottom-right-radius: 4px; }
            .ai-message-bot { background: white; color: #1e293b; align-self: flex-start; border-bottom-left-radius: 4px; border: 1px solid #e2e8f0; }
            .ai-input-row { display: flex; padding: 16px 20px; background: white; border-top: 1px solid #e2e8f0; gap: 12px; }
            .ai-input { flex: 1; padding: 12px 18px; border: 2px solid #e2e8f0; border-radius: 30px; outline: none; }
            .ai-input:focus { border-color: #f6b83e; }
            .ai-send { background: linear-gradient(135deg, #f6b83e, #ff8c00); border: none; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; font-size: 22px; color: #0a1929; }
            .typing-indicator { display: flex; gap: 6px; padding: 14px 18px; background: white; border-radius: 18px; align-self: flex-start; }
            .typing-indicator span { width: 10px; height: 10px; background: #f6b83e; border-radius: 50%; animation: typing 1.4s infinite; }
            @keyframes typing { 0%,60%,100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-10px); opacity: 1; } }
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
                <div class="ai-header"><span class="ai-icon">🤖</span><span class="ai-title">AI · Ассистент КЭАЗ</span><button class="ai-close" onclick="AICore.toggleWidget()">✕</button></div>
                <div class="ai-messages" id="aiMessages"><div class="ai-message ai-message-bot">${welcomeMessage}</div></div>
                <div class="ai-input-row"><input type="text" id="aiInput" class="ai-input" placeholder="Напишите ваш вопрос..." onkeypress="AICore.handleKeyPress(event)"><button class="ai-send" id="aiSendBtn" onclick="AICore.sendMessage()">➤</button></div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        if (!document.getElementById('aiFloatingButton')) {
            const floatBtn = document.createElement('button');
            floatBtn.id = 'aiFloatingButton';
            floatBtn.className = 'ai-floating-button';
            floatBtn.innerHTML = '<span class="ai-btn-icon">🤖</span><span class="ai-btn-text">AI Ассистент</span>';
            floatBtn.onclick = () => window.AICore?.toggleWidget();
            
            const subhead = document.querySelector('.subhead');
            if (subhead && subhead.parentNode) {
                const btnContainer = document.createElement('div');
                btnContainer.style.display = 'flex';
                btnContainer.style.justifyContent = 'center';
                btnContainer.style.margin = '10px 0';
                btnContainer.appendChild(floatBtn);
                subhead.insertAdjacentElement('afterend', btnContainer);
            } else {
                document.body.appendChild(floatBtn);
            }
        }
        
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
                const response = await fetch(PROXY_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        messages: [{ role: 'user', content: message }],
                        fullData: proceduresFullData,
                        htmlContext: fullContext
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
                AICore._addMessage('⚠️ Ошибка подключения к серверу.', 'bot');
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
