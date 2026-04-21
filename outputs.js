// outputs.js - ссылки на выходы
console.log('🚀 Скрипт выходов запущен');

if (window.location.pathname.includes('index')) {
    console.log('⏭️ index.html - выходим');
} else {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    const procId = filename.replace('proc', '').replace('.html', '');
    
    console.log('📌 Процедура:', procId);
    
    const outputsMap = {
        '4': ['11', '13', '15']
    };
    
    const outputs = outputsMap[procId] || [];
    console.log('🔢 Выходы:', outputs);
    
    if (outputs.length > 0) {
        const skipSteps = { '4': ['5'] };
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
                        if (skipList.includes(stepId)) {
                            console.log('⏭️ Отказ, пропускаем');
                            return;
                        }
                        const detailText = document.getElementById('detailText');
                        if (!detailText) return;
                        if (!detailText.innerHTML.includes('📤 ВЫХОД')) return;
                        
                        const links = outputs.map(num => 
                            `<a href="proc${num}.html" style="color: #1e6df2; background: #e6f0ff; padding: 2px 8px; border-radius: 20px; text-decoration: none; font-weight: 600; margin: 0 4px;">Процедура ${num}</a>`
                        ).join(', ');
                        
                        let html = detailText.innerHTML;
                        html = html.replace(/(📤 ВЫХОД:[^<]*)/, `$1 ${links}`);
                        detailText.innerHTML = html;
                        console.log('✅ Ссылки добавлены');
                    }, 150);
                };
            }
        }, 200);
    }
}
