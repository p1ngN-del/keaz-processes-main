// outputs.js - ссылки на выходы (супер-простая версия)
console.log('🚀 Скрипт выходов запущен');

if (window.location.pathname.includes('index')) {
    console.log('⏭️ index.html - выходим');
} else {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    const procId = filename.replace('proc', '').replace('.html', '');
    
    console.log('📌 Процедура:', procId);
    
    const outputsMap = {
        '4': ['11', '13', '15'],
        '5': ['6'],
        '11': ['14']
    };
    
    const outputs = outputsMap[procId] || [];
    console.log('🔢 Выходы:', outputs);
    
    if (outputs.length > 0) {
        const skipSteps = { '4': ['5'], '4a': ['22'] };
        const skipList = skipSteps[procId] || [];
        
        const wait = setInterval(() => {
            if (typeof window.showDetail === 'function') {
                clearInterval(wait);
                console.log('✅ showDetail найдена');
                
                const original = window.showDetail;
                window.showDetail = function(stepId) {
                    original(stepId);
                    setTimeout(() => {
                        console.log('🖱️ Шаг:', stepId);
                        
                        // Пропускаем только явные отказы
                        if (skipList.includes(stepId)) {
                            console.log('⏭️ Шаг в списке отказов, пропускаем');
                            return;
                        }
                        
                        const detailText = document.getElementById('detailText');
                        if (!detailText) return;
                        
                        // Проверяем, нет ли уже ссылок
                        if (detailText.innerHTML.includes('Процедура 11') || 
                            detailText.innerHTML.includes('Связанные процедуры')) {
                            console.log('⏭️ Ссылки уже есть');
                            return;
                        }
                        
                        // Создаём ссылки
                        const links = outputs.map(num => 
                            `<a href="proc${num}.html" style="color: #1e6df2; background: #e6f0ff; padding: 2px 8px; border-radius: 20px; text-decoration: none; font-weight: 600; margin: 0 4px;">Процедура ${num}</a>`
                        ).join(', ');
                        
                        // Добавляем блок со ссылками в конец
                        const linksBlock = document.createElement('div');
                        linksBlock.style.marginTop = '15px';
                        linksBlock.style.padding = '12px';
                        linksBlock.style.background = '#f0f7ff';
                        linksBlock.style.borderRadius = '10px';
                        linksBlock.style.border = '1px solid #1e6df2';
                        linksBlock.innerHTML = `<strong>🔗 Выходы в процедуры:</strong> ${links}`;
                        
                        detailText.appendChild(linksBlock);
                        console.log('✅ Ссылки добавлены');
                        
                    }, 150);
                };
            }
        }, 200);
    }
}
