const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
    console.log('📨 Получен запрос');
    try {
        const { messages, fullData } = req.body;
        
        if (!DEEPSEEK_API_KEY) {
            return res.status(500).json({ success: false, error: 'API key missing' });
        }
        
        const userMessage = messages[messages.length - 1]?.content || '';
        
        let contextText = '';
        if (fullData && fullData.length > 0) {
            for (const proc of fullData) {
                contextText += `\n--- [${proc.num}] ${proc.name} ---\n${(proc.content || '').substring(0, 3000)}\n`;
            }
        }
        
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'Ты AI-ассистент КЭАЗ. Отвечай на русском, подробно. В конце добавляй [PROC:номера].' },
                    { role: 'user', content: contextText ? `База знаний КЭАЗ:\n${contextText}\n\nВопрос: ${userMessage}` : userMessage }
                ],
                temperature: 0.7,
                max_tokens: 4000
            },
            {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json({ success: true, content: response.data.choices[0].message.content });
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});
// Новый эндпоинт: определяет стартовую процедуру для роли
app.post('/api/get-start-proc', async (req, res) => {
    try {
        const { role, procedures } = req.body;
        
        if (!role || !procedures) {
            return res.status(400).json({ success: false, error: 'role and procedures required' });
        }
        
        // Фильтруем процедуры, где участвует эта роль
        const roleProcedures = procedures.filter(proc => {
            return proc.roles && proc.roles.includes(role);
        });
        
        if (roleProcedures.length === 0) {
            return res.json({ success: true, procId: null });
        }
        
        // Формируем промпт для AI
        const procList = roleProcedures.map(p => {
            return `ID: ${p.num}\nНазвание: ${p.name}\nФаза: ${p.phase || '?'}\nОписание: ${p.content.substring(0, 300)}...\n---`;
        }).join('\n');
        
        const prompt = `Ты — AI-ассистент КЭАЗ. Определи, с какой процедуры должен начать работу сотрудник с ролью "${role}".

Правила выбора:
1. Выбирай процедуру с самой ранней фазой (1 < 2 < 3...).
2. Если несколько процедур в одной фазе — выбирай ту, у которой меньше зависимостей от других процедур.
3. Если всё равнозначно — выбирай процедуру, которая чаще является "входом" для других.
4. Верни ТОЛЬКО номер процедуры (число) без лишнего текста.

Список процедур для роли "${role}":
${procList}

Твой ответ (только число):`;

        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'Ты — AI-ассистент КЭАЗ. Отвечай только числом — номером процедуры.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 20
            },
            {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        let procId = response.data.choices[0].message.content.trim();
        // Извлекаем число из ответа
        const match = procId.match(/\d+/);
        procId = match ? match[0] : null;
        
        res.json({ success: true, procId: procId });
        
    } catch (error) {
        console.error('Ошибка в /api/get-start-proc:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
