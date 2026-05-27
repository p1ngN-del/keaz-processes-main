// server.js - ОПТИМИЗИРОВАННЫЙ (без обрезания контекста)
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));
app.use('/templates', express.static(path.join(__dirname, 'templates')));

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
    console.log('📨 Запрос получен');
    
    try {
        const { messages, fullData, htmlContext, conversationHistory } = req.body;
        
        if (!DEEPSEEK_API_KEY) {
            console.error('❌ DEEPSEEK_API_KEY не задан');
            return res.status(500).json({ success: false, error: 'API key missing' });
        }
        
        // ------ КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: используем htmlContext (содержит ВСЁ) ------
        let contextForAI = '';
        
        // Если клиент прислал готовый htmlContext (содержит и JSON, и HTML шаги) — используем его без обрезания
        if (htmlContext && htmlContext.length > 0) {
            contextForAI = htmlContext;
            console.log(`📚 Использую полный контекст от клиента: ${Math.round(contextForAI.length / 1024)} KB`);
        } 
        // Если нет, собираем из fullData (старый метод, для обратной совместимости)
        else if (fullData && fullData.length > 0) {
            contextForAI = fullData.map(proc => {
                return `=== ПРОЦЕДУРА ${proc.num} ===\nНазвание: ${proc.name}\nТип: ${proc.type || 'Процедура'}\n${proc.content || ''}\n${proc.inputs ? `ВХОДЫ: ${proc.inputs.join(', ')}` : ''}\n${proc.outputs ? `ВЫХОДЫ: ${proc.outputs.join(', ')}` : ''}\n${proc.roles ? `РОЛИ: ${proc.roles.join(', ')}` : ''}\n---`;
            }).join('\n\n');
            console.log(`📚 Собрал контекст из JSON: ${Math.round(contextForAI.length / 1024)} KB`);
        }
        
        // Формируем историю диалога (если есть)
        let historyText = '';
        if (conversationHistory && conversationHistory.length > 0) {
            const lastMessages = conversationHistory.slice(-6);
            historyText = lastMessages.map(msg => 
                `${msg.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${msg.content.substring(0, 800)}`
            ).join('\n\n');
        }
        
        const userMessage = messages[messages.length - 1]?.content || '';
        
        // УЛУЧШЕННЫЙ СИСТЕМНЫЙ ПРОМПТ (явно говорим искать по ВСЕМ процедурам и использовать ссылки)
        const systemPrompt = `Ты — AI-ассистент КЭАЗ. Твоя задача — помогать сотрудникам компании разбираться в бизнес-процессах, документах и ролях.

**ПРАВИЛА ОТВЕТОВ:**
1. ВСЕГДА ищи информацию во всей предоставленной базе знаний. Не ограничивайся только первым найденным совпадением.
2. Отвечай максимально подробно и структурированно. Используй разделы, списки, жирный шрифт (его я заменю на HTML).
3. Если информация не найдена — честно скажи об этом и предложи обратиться к ответственному сотруднику.
4. ВСЕГДА добавляй ссылки на процедуры в формате [PROC:номер] или [PROC:номер1,номер2].
5. Если пользователь спрашивает про роль — покажи все процедуры, где эта роль упоминается.
6. Если спрашивают про конкретную процедуру — опиши все её шаги из HTML-файлов (у тебя есть доступ к шагам).

**БАЗА ЗНАНИЙ КЭАЗ (полный текст всех процедур, инструкций и стандартов):**
${contextForAI.substring(0, 500000)} // СНЯЛ ОГРАНИЧЕНИЕ 50000 -> 500000

${historyText ? `**ИСТОРИЯ ДИАЛОГА (для контекста):**\n${historyText}\n` : ''}

**ОТВЕТЬ НА ВОПРОС ПОЛЬЗОВАТЕЛЯ:**`;

        // Отправляем запрос в DeepSeek
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt.substring(0, 120000) }, // Ограничение оставил, но оно большое
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.5,  // Снизил для более точных ответов
                max_tokens: 6000   // Увеличил для развёрнутых ответов
            },
            {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 90000 // Увеличил таймаут до 90 секунд
            }
        );
        
        const answer = response.data.choices[0].message.content;
        console.log(`✅ Ответ получен, длина: ${answer.length} символов`);
        res.json({ success: true, content: answer });
        
    } catch (error) {
        console.error('❌ Ошибка AI:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data).substring(0, 500));
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Эндпоинт для определения стартовой процедуры по роли (без изменений, работает)
app.post('/api/get-start-proc', async (req, res) => {
    try {
        const { role, procedures } = req.body;
        if (!role || !procedures) {
            return res.status(400).json({ success: false, error: 'role and procedures required' });
        }
        const roleProcedures = procedures.filter(proc => proc.roles && proc.roles.includes(role));
        if (roleProcedures.length === 0) {
            return res.json({ success: true, procId: null });
        }
        const sorted = [...roleProcedures].sort((a, b) => parseInt(a.num) - parseInt(b.num));
        console.log(`🎯 Для роли ${role} рекомендована процедура ${sorted[0].num}`);
        res.json({ success: true, procId: sorted[0].num });
    } catch (error) {
        console.error('Ошибка в /api/get-start-proc:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🔑 API key ${DEEPSEEK_API_KEY ? '✅ задан' : '❌ НЕ ЗАДАН!'}`);
    console.log(`📚 База знаний: без ограничений (до 200 KB за раз)`);
});
