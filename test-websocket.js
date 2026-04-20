// test-websocket.js
console.log('🔍 Проверка WebSocket...\n');

// Проверяем в консоли браузера
if (typeof WebSocket !== 'undefined') {
    console.log('✅ WebSocket поддерживается');
    
    // Проверяем подключение к серверу
    const ws = new WebSocket('ws://localhost:3000/ws');
    
    ws.onopen = function() {
        console.log('✅ WebSocket подключен к серверу');
        ws.send(JSON.stringify({ type: 'ping' }));
    };
    
    ws.onmessage = function(event) {
        console.log('📨 Получено:', event.data);
    };
    
    ws.onerror = function(error) {
        console.error('❌ WebSocket ошибка:', error);
    };
    
    setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
            console.log('✅ WebSocket работает корректно');
        } else {
            console.log('❌ WebSocket не подключен, состояние:', ws.readyState);
        }
        ws.close();
    }, 2000);
} else {
    console.log('❌ WebSocket не поддерживается');
}

console.log('\n💡 Для проверки входа:');
console.log('   admin@messenger.com / admin123');
console.log('   test@test.com / test123\n');