// AI Assistant for KEEAZ Procedures
(function() {
    // Стили
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

    // HTML виджета
    const widget = document.createElement('div');
    widget.className = 'ai-widget';
    widget.id = 'aiWidget';
    widget.innerHTML = `
        <div class="ai-header">
            <span class="ai-icon">🤖</span>
            <span class="ai-title">AI · Ассистент КЭАЗ</span>
            <button class="ai-close" onclick="window.toggleAIWidget()">✕</button>
        </div>
        <div class="ai-messages" id="aiMessages">
            <div class="ai-message ai-message-bot">
                👋 <strong>Здравствуйте!</strong><br><br>
                Я AI-ассистент КЭАЗ. Задайте вопрос по этой процедуре.
            </div>
        </div>
        <div class="ai-input-row">
            <input type="text" id="aiInput" class="ai-input" placeholder="Напишите ваш вопрос..." onkeypress="window.handleAIKeyPress(event)">
            <button class="ai-send" id="aiSendBtn" onclick="window.sendAIMessage()">➤</button>
        </div>
    `;
    document.body.appendChild(widget);

    // Кнопка открытия
    const btn = document.createElement('button');
    btn.className = 'ai-search-btn';
    btn.innerHTML = '<span>🤖</span><span>AI</span>';
    btn.title = 'Спросить AI-ассистента';
    btn.onclick = () => window.toggleAIWidget();
    
    // Вставляем кнопку рядом с заголовком h1
    const h1 = document.querySelector('h1');
    if (h1) {
        h1.style.display = 'flex';
        h1.style.alignItems = 'center';
        h1.style.justifyContent = 'center';
        h1.style.gap = '12px';
        h1.appendChild(btn);
    }

    // Логика
    const PROXY_URL = 'https://keeaz-ai-server-production.up.railway.app/api/chat';

    window.toggleAIWidget = function() {
        const w = document.getElementById('aiWidget');
        w.classList.toggle('open');
        if (w.classList.contains('open')) {
            setTimeout(() => document.getElementById('aiInput').focus(), 100);
        }
    };

    window.handleAIKeyPress = function(event) {
        if (event.key === 'Enter') window.sendAIMessage();
    };

    window.showTypingIndicator = function() {
        const div = document.createElement('div');
        div.className = 'typing-indicator';
        div.id = 'typingIndicator';
        div.innerHTML = '<span></span><span></span><span></span>';
        document.getElementById('aiMessages').appendChild(div);
    };

    window.removeTypingIndicator = function() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    };

    window.addMessage = function(text, sender) {
        const div = document.createElement('div');
        div.className = `ai-message ai-message-${sender}`;
        div.innerHTML = text.replace(/\n/g, '<br>');
        document.getElementById('aiMessages').appendChild(div);
        div.scrollIntoView({ behavior: 'smooth' });
    };

    window.sendAIMessage = async function() {
        const input = document.getElementById('aiInput');
        const msg = input.value.trim();
        if (!msg) return;
        
        input.value = '';
        window.addMessage(msg, 'user');
        window.showTypingIndicator();
        
        const btn = document.getElementById('aiSendBtn');
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
            
            window.removeTypingIndicator();
            const data = await response.json();
            
            if (data.success) {
                window.addMessage(data.content, 'bot');
            } else {
                window.addMessage('❌ Ошибка. Попробуйте позже.', 'bot');
            }
        } catch (e) {
            window.removeTypingIndicator();
            window.addMessage('❌ Не удалось подключиться к серверу.', 'bot');
        }
        
        btn.disabled = false;
    };
})();
