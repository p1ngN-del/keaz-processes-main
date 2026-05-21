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

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});
