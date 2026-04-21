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
            return proceduresFullData; // Данные уже загружены
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

    // Поиск релевантных процедур
    function findRelevantProcedures(question, maxResults = 5) {
        if (!proceduresFullData || proceduresFullData.length === 0) {
            console.warn('⚠️ [AI Core] Данные процедур ещё не загружены');
            return [];
        }
        
        const questionLower = question.toLowerCase();
        const words = questionLower.split(/\s+/);
        
        console.log('🔎 [AI Core] Ищем по словам:', words);
        
        const scored = proceduresFullData.map(proc => {
            const fullText = (proc.num + ' ' + proc.name + ' ' + proc.content).toLowerCase();
            let score = 0;
            
            words.forEach(word => {
                if (word.length < 2) return;
                
                const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                const matches = fullText.match(regex);
                if (matches) score += matches.length * 15;
                
                if (proc.num.toLowerCase() === word) score += 100;
                if (proc.name.toLowerCase().includes(word)) score += 30;
            });
            
            // Специальные правила
            if (questionLower.includes('тнвэд') || questionLower.includes('тн вэд')) {
                if (fullText.includes('тнвэд') || fullText.includes('тн вэд')) score += 100;
            }
            if (questionLower.includes('сертификат') && fullText.includes('сертификат')) score += 80;
            if (questionLower.includes('поставщик') && (fullText.includes('поставщик') || fullText.includes('oem'))) score += 80;
            
            return { proc, score };
        });
        
        const relevant = scored
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(item => item.proc);
        
        console.log(`🔍 [AI Core] Найдено ${relevant.length} релевантных процедур`);
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

    // --- Основные функции виджета ---

    // Создание HTML-виджета
    function createWidget() {
        if (document.getElementById('aiWidget')) return;

        const widgetHTML = `
            <div class="ai-widget" id="aiWidget">
                <div class="ai-header">
                    <span class="ai-icon">🤖</span>
                    <span class="ai-title">AI · Ассистент КЭАЗ</span>
                    <button class="ai-close" onclick="AICore.toggleWidget()">✕</button>
                </div>
                <div class="ai-messages" id="aiMessages">
                    <div class="ai-message ai-message-bot">
                        👋 <strong>Здравствуйте!</strong><br><br>
                        Я AI-ассистент КЭАЗ. Задайте вопрос по этой процедуре.
                    </div>
                </div>
                <div class="ai-input-row">
                    <input type="text" id="aiInput" class="ai-input" placeholder="Напишите ваш вопрос..." onkeypress="AICore.handleKeyPress(event)">
                    <button class="ai-send" id="aiSendBtn" onclick="AICore.sendMessage()">➤</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
    }

    // --- Экспортируемый объект API ---
    window.AICore = {
        // Инициализация: добавление кнопки и виджета на страницу
        initButton: function(containerSelector = 'h1') {
            if (document.querySelector('.ai-core-btn')) return;
            
            const container = document.querySelector(containerSelector);
            if (!container) {
                console.warn(`[AI Core] Контейнер "${containerSelector}" не найден.`);
                return;
            }
            
            const btn = document.createElement('button');
            btn.className = 'ai-search-btn ai-core-btn';
            btn.innerHTML = '<span>🤖</span><span>AI</span>';
            btn.title = 'Спросить AI-ассистента';
            btn.onclick = () => AICore.toggleWidget();
            
            container.style.display = 'flex';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.gap = '12px';
            container.appendChild(btn);
            
            createWidget();
            loadProceduresFullData(); // Загружаем данные сразу при инициализации
        },

        // Управление виджетом
        toggleWidget: function() {
            let widget = document.getElementById('aiWidget');
            if (!widget) {
                createWidget();
                widget = document.getElementById('aiWidget');
            }
            widget.classList.toggle('open');
            if (widget.classList.contains('open')) {
                setTimeout(() => document.getElementById('aiInput').focus(), 100);
            }
        },

        // Обработчик нажатия Enter
        handleKeyPress: function(event) {
            if (event.key === 'Enter') AICore.sendMessage();
        },

        // Вспомогательные функции для чата
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

        // Основная функция отправки сообщения
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
                // Загружаем данные, если они еще не загружены
                const allProcedures = await loadProceduresFullData();
                
                // Ищем релевантные процедуры
                const relevantProcs = findRelevantProcedures(message, 5);
                
                // Формируем контекст
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
                
                // Получаем название текущей процедуры для контекста (если есть)
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
                    
                    // Если на главной странице есть функция фильтрации, вызываем её
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

})();
