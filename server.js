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
    console.log('📨 Получен запрос:', req.body.messages?.[req.body.messages.length - 1]?.content?.substring(0, 100));
    
    try {
        const { messages, fullData, conversationHistory } = req.body;
        
        if (!DEEPSEEK_API_KEY) {
            console.error('❌ DEEPSEEK_API_KEY не задан');
            return res.status(500).json({ success: false, error: 'API key missing' });
        }
        
        const userMessage = messages[messages.length - 1]?.content || '';
        
        // Формируем ПОЛНЫЙ контекст из ВСЕХ процедур (без обрезания)
        let fullContext = '';
        if (fullData && fullData.length > 0) {
            fullContext = fullData.map(proc => {
                return `=== ПРОЦЕДУРА ${proc.num} ===
Название: ${proc.name}
Тип: ${proc.type || 'Процедура'}
${proc.content || ''}
${proc.inputs ? `ВХОДЫ: ${proc.inputs.join(', ')}` : ''}
${proc.outputs ? `ВЫХОДЫ: ${proc.outputs.join(', ')}` : ''}
${proc.roles ? `РОЛИ: ${proc.roles.join(', ')}` : ''}
---`;
            }).join('\n\n');
        }
        
        console.log(`📚 Размер базы знаний: ${Math.round(fullContext.length / 1024)} KB`);
        
        // История диалога для контекста (последние 5 сообщений)
        let historyText = '';
        if (conversationHistory && conversationHistory.length > 0) {
            const lastMessages = conversationHistory.slice(-6);
            historyText = lastMessages.map(msg => 
                `${msg.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${msg.content.substring(0, 500)}`
            ).join('\n\n');
        }
        
        const systemPrompt = `Ты — AI-ассистент КЭАЗ. Твоя задача — помогать сотрудникам компании разбираться в бизнес-процессах.

ТВОИ ЦЕННОСТИ:
1. НЕ СПЕШИ. Внимательно прочитай вопрос. Если он нечёткий или не хватает данных — задай 1-2 уточняющих вопроса. Лучше уточнить, чем дать неполный ответ.
2. ДАВАЙ МАКСИМАЛЬНО ПОДРОБНЫЕ ОТВЕТЫ. Не обрезай важную информацию. Если в процедуре 20 шагов — опиши их все.
3. ВСЕГДА ДОБАВЛЯЙ ССЫЛКИ НА ПРОЦЕДУРЫ. Если ты ссылаешься на процедуру 4 — напиши [PROC:4]. Если на несколько — [PROC:4,28,30].
4. ЧИТАЙ ВСЮ БАЗУ ЗНАНИЙ. У тебя есть полный текст всех процедур, инструкций и стандартов КЭАЗ. Используй их.

ФОРМАТ ОТВЕТА:
- Используй заголовки (жирным) для разделов
- Используй маркированные списки для шагов
- Не используй Markdown-символы (###, ##, #, **, *) — они заменятся автоматически
- В конце ответа всегда добавляй [PROC:номера] с номерами процедур, которые ты использовал

БАЗА ЗНАНИЙ КЭАЗ (ПОЛНЫЙ ТЕКСТ ВСЕХ ПРОЦЕДУР):
${fullContext.substring(0, 50000)}

${historyText ? `ИСТОРИЯ ДИАЛОГА (для контекста):\n${historyText}\n` : ''}

ОТВЕТЬ НА ВОПРОС ПОЛЬЗОВАТЕЛЯ:`;

        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt.substring(0, 60000) },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 4000
            },
            {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );
        
        const answer = response.data.choices[0].message.content;
        console.log(`✅ Ответ получен, длина: ${answer.length} символов`);
        
        res.json({ success: true, content: answer });
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data).substring(0, 500));
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

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
    console.log(`📁 Статика из корня: ${__dirname}`);
    console.log(`🔑 API key ${DEEPSEEK_API_KEY ? '✅ задан' : '❌ НЕ ЗАДАН!'}`);
    console.log(`📚 База знаний: без ограничений (полный текст всех процедур)`);
});
