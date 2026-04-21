// ai-assistant.js
// Вспомогательный скрипт для страниц, где AI Core не может найти контейнер автоматически
// В большинстве случаев он не нужен, если используется ai-core.js
(function() {
    if (window.location.pathname.includes('index')) return;
    
    function waitForAICore() {
        if (window.AICore) {
            // Если на странице есть H1, кнопка добавится. Если нет - не страшно.
            window.AICore.initButton('h1');
        } else {
            setTimeout(waitForAICore, 100);
        }
    }
    waitForAICore();
})();
