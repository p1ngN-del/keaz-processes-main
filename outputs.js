// outputs.js - ссылки на выходы (с полной отладкой)
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
        console.log('⏭️ Список отказов:', skipList);
        
        const wait = setInterval(() => {
            if (typeof window.showDetail === 'function') {
                clearInterval(wait);
                console.log('✅ showDetail найдена');
                
                const original = window.showDetail;
                window.showDetail = function(stepId) {
                    try {
    original(stepId);
} catch(e) {
    console.log('⚠️ Ошибка в original, но продолжаем');
}
                    setTimeout(() => {
                        console.log('🖱️ Шаг:', stepId);
                        
                        // Проверка 1: отказ?
                        if (skipList.includes(stepId)) {
                            console.log('❌ Шаг в списке отказов');
                            return;
                        }
                        console.log('✅ Не отказ');
                        
                        // Проверка 2: detailText?
                        const detailText = document.getElementById('detailText');
                        if (!detailText) {
                            console.log('❌ detailText не найден');
                            return;
                        }
                        console.log('✅ detailText найден');
                        
                        // Проверка 3: уже есть ссылки?
                        if (detailText.innerHTML.includes('Процедура 11')) {
                            console.log('❌ Ссылки уже есть');
                            return;
                        }
                        console.log('✅ Ссылок ещё нет');
                        
                        // Создаём ссылки
                        const links = outputs.map(num => 
                            `<a href="proc${num}.html" style="color: #1e6df2; background: #e6f0ff; padding: 2px 8px; border-radius: 20px; text-decoration: none; font-weight: 600; margin: 0 4px;">Процедура ${num}</a>`
                        ).join(', ');
                        
                        const linksBlock = document.createElement('div');
                        linksBlock.style.marginTop = '15px';
                        linksBlock.style.padding = '12px';
                        linksBlock.style.background = '#f0f7ff';
                        linksBlock.style.borderRadius = '10px';
                        linksBlock.style.border = '1px solid #1e6df2';
                        linksBlock.innerHTML = `<strong>🔗 Выходы в процедуры:</strong> ${links}`;
                        
                        detailText.appendChild(linksBlock);
                        console.log('✅✅✅ ССЫЛКИ ДОБАВЛЕНЫ! ✅✅✅');
                        
                    }, 150);
                };
            }
        }, 200);
    }
}
