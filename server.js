const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// РАЗДАЧА СТАТИКИ (ВСЁ В КОРНЕ)
app.use(express.static(__dirname));
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Основной эндпоинт AI
app.post('/api/chat', async (req, res) => {
    console.log('📨 Получен запрос');
    
    try {
        const { messages, fullData } = req.body;
        
        if (!DEEPSEEK_API_KEY) {
            console.error('❌ DEEPSEEK_API_KEY не задан');
            return res.status(500).json({ success: false, error: 'API key missing' });
        }
        
        const userMessage = messages[messages.length - 1]?.content || '';
        
        let contextText = '';
        if (fullData && fullData.length > 0) {
            contextText = fullData.slice(0, 15).map(proc => 
                `[${proc.num}] ${proc.name}: ${(proc.content || '').substring(0, 800)}`
            ).join('\n\n');
        }
        
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { 
                        role: 'system', 
                        content: `Ты — AI-ассистент КЭАЗ. Отвечай на русском, по делу.

Если вопрос НЕ ЯСЕН или НЕ ХВАТАЕТ ДАННЫХ — задай 1-2 уточняющих вопроса.
Если вопрос понятен — давай чёткий ответ, используй заголовки и списки.
Если вопрос про процедуры и ты можешь определить их номера — в конце добавь [PROC:номера].
Если вопрос НЕ про процедуры — НЕ добавляй [PROC:...].

База знаний:
${contextText.substring(0, 6000)}`
                    },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        const answer = response.data.choices[0].message.content;
        console.log('✅ Ответ получен, длина:', answer.length);
        
        res.json({ success: true, content: answer });
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        res.status(500).json({ success: false, error: error.message });
    }
});

// Эндпоинт для определения стартовой процедуры по роли
app.post('/api/get-start-proc', async (req, res) => {
    try {
        const { role, procedures } = req.body;
        
        if (!role || !procedures) {
            return res.status(400).json({ success: false, error: 'role and procedures required' });
        }
        
        const roleProcedures = procedures.filter(proc => {
            return proc.roles && proc.roles.includes(role);
        });
        
        if (roleProcedures.length === 0) {
            return res.json({ success: true, procId: null });
        }
        
        const sorted = [...roleProcedures].sort((a, b) => parseInt(a.num) - parseInt(b.num));
        const recommendedProc = sorted[0];
        
        console.log(`🎯 Для роли ${role} рекомендована процедура ${recommendedProc.num}`);
        
        res.json({ success: true, procId: recommendedProc.num });
        
    } catch (error) {
        console.error('Ошибка в /api/get-start-proc:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Для всех остальных маршрутов — отдаём index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📁 Статика из корня: ${__dirname}`);
    console.log(`🔑 API key ${DEEPSEEK_API_KEY ? '✅ задан' : '❌ НЕ ЗАДАН!'}`);
});
