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
    res.json({ status: 'ok' });
});

app.post('/api/chat', async (req, res) => {
    // ДИАГНОСТИКА — ЭТИ СТРОЧКИ ДОЛЖНЫ БЫТЬ В НАЧАЛЕ
    console.log('========================================');
    console.log('📨 ПОЛУЧЕН ЗАПРОС НА /api/chat');
    console.log('========================================');
    
    try {
        console.log('1️⃣ Проверяем тело запроса...');
        console.log('2️⃣ fullData существует?', req.body.fullData ? 'ДА' : 'НЕТ');
        console.log('3️⃣ Тип fullData:', typeof req.body.fullData);
        
        if (req.body.fullData) {
            console.log('4️⃣ fullData.length:', req.body.fullData.length);
            console.log('5️⃣ Первая процедура:', req.body.fullData[0]?.num, req.body.fullData[0]?.name);
        } else {
            console.log('4️⃣ fullData ОТСУТСТВУЕТ в запросе!');
            console.log('5️⃣ Ключи в req.body:', Object.keys(req.body));
        }
        
        const { messages, fullData } = req.body;
        
        if (!DEEPSEEK_API_KEY) {
            console.error('❌ API ключ отсутствует');
            return res.status(500).json({ success: false, error: 'API key missing' });
        }
        
        const userMessage = messages[messages.length - 1]?.content || '';
        console.log(`6️⃣ Вопрос пользователя: ${userMessage.substring(0, 100)}...`);
        
        let contextText = '';
        if (fullData && Array.isArray(fullData) && fullData.length > 0) {
            console.log(`✅ fullData получен! ${fullData.length} процедур`);
            for (const proc of fullData) {
                contextText += `\n--- [${proc.num}] ${proc.name} ---\n${(proc.content || '').substring(0, 2000)}\n`;
            }
            console.log(`📦 Размер контекста: ${contextText.length} символов`);
        } else {
            console.warn('⚠️ fullData пуст или не массив!');
        }
        
        console.log('7️⃣ Отправляем запрос в DeepSeek...');
        
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
        
        console.log('8️⃣ ✅ Ответ от DeepSeek получен');
        res.json({ success: true, content: response.data.choices[0].message.content });
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
    console.log(`🤖 Chat: http://localhost:${PORT}/api/chat`);
});
