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
        const { messages, fullData, htmlContext } = req.body;
        
        if (!DEEPSEEK_API_KEY) {
            console.error('❌ DEEPSEEK_API_KEY не задан');
            return res.status(500).json({ success: false, error: 'API key missing' });
        }
        
        let contextForAI = '';
        if (htmlContext && htmlContext.length > 0) {
            contextForAI = htmlContext;
            console.log(`📚 Использую полный контекст: ${Math.round(contextForAI.length / 1024)} KB`);
        } else if (fullData && fullData.length > 0) {
            contextForAI = fullData.map(proc => {
                return `=== ПРОЦЕДУРА ${proc.num} ===\nНазвание: ${proc.name}\n${proc.content || ''}\n${proc.roles ? `Роли: ${proc.roles.join(', ')}` : ''}\n---`;
            }).join('\n\n');
            console.log(`📚 Контекст из JSON: ${Math.round(contextForAI.length / 1024)} KB`);
        }
        
        const userMessage = messages[messages.length - 1]?.content || '';
        
        // ЕДИНЫЙ ПРАВИЛЬНЫЙ ПРОМПТ (без дублирования)
        const systemPrompt = `Ты — AI-ассистент КЭАЗ. Твоя задача — помогать сотрудникам компании разбираться в бизнес-процессах.

**КРИТИЧЕСКИ ВАЖНОЕ ПРАВИЛО (НЕ НАРУШАТЬ):**

Каждый раз, когда ты пишешь название процедуры, стандарта, инструкции или методики — ты ОБЯЗАН написать её в формате "Процедура X", "Стандарт X", "Инструкция X", "Методика X". 

НЕПРАВИЛЬНО: "в процедуре 28", "описано в 4", "согласно 30".
ПРАВИЛЬНО: "в Процедура 28", "описано в Процедура 4", "согласно Процедура 30".

Ты должен проверить свой ответ перед отправкой и убедиться, что каждое числовое упоминание процедуры сопровождается словом "Процедура" перед ним.

**ТВОИ ЦЕННОСТИ:**
1. НЕ СПЕШИ. Внимательно прочитай вопрос. Если он нечёткий или не хватает данных — задай 1-2 уточняющих вопроса.
2. ДАВАЙ МАКСИМАЛЬНО ПОДРОБНЫЕ ОТВЕТЫ. Не обрезай важную информацию.
3. В конце ответа всегда добавляй [PROC:номера] — например, [PROC:4] или [PROC:4,37].

**ФОРМАТ ОТВЕТА:**
- Используй заголовки для разделов
- Используй маркированные списки для шагов
- Не используй Markdown-символы (###, ##, #, **, *)

БАЗА ЗНАНИЙ КЭАЗ:
${contextForAI.substring(0, 150000)}

ОТВЕТЬ НА ВОПРОС ПОЛЬЗОВАТЕЛЯ: ${userMessage}`;

        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
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
        console.log(`✅ Ответ получен, длина: ${answer.length}`);
        res.json({ success: true, content: answer });
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        if (error.response) {
            console.error('Ответ сервера:', error.response.data);
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
        console.log(`🎯 Для роли ${role} процедура ${sorted[0].num}`);
        res.json({ success: true, procId: sorted[0].num });
    } catch (error) {
        console.error('Ошибка:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Сервер на порту ${PORT}`);
    console.log(`🔑 API key ${DEEPSEEK_API_KEY ? '✅ задан' : '❌ НЕ ЗАДАН!'}`);
});
