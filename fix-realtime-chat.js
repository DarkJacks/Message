const fs = require('fs');
const path = require('path');

console.log('🔧 Добавление реального времени в чат...\n');

const mainJsPath = path.join(process.cwd(), 'public', 'js', 'main.js');
const userJsPath = path.join(process.cwd(), 'public', 'js', 'user.js');
const indexPath = path.join(process.cwd(), 'public', 'index.html');
const stylePath = path.join(process.cwd(), 'public', 'css', 'style.css');

// ========== 1. ОБНОВЛЕНИЕ INDEX.HTML ==========
console.log('📝 Обновление index.html...');

if (fs.existsSync(indexPath)) {
    let htmlContent = fs.readFileSync(indexPath, 'utf8');

    // Заменяем chat-header на новую структуру
    const newChatHeader = `
                <div class="chat-header" id="chatHeader">
                    <div class="chat-user-info" id="chatUserInfo">
                        <div class="chat-user-avatar" id="chatUserAvatar">?</div>
                        <div class="chat-user-details">
                            <span class="chat-user-name" id="chatUserName">Выберите чат</span>
                            <div class="chat-user-status-container" id="chatUserStatusContainer">
                                <span class="chat-user-status-text" id="chatUserStatusText"></span>
                                <span class="chat-user-status-dot" id="chatUserStatusDot"></span>
                                <span class="chat-user-typing" id="chatUserTyping" style="display: none;">
                                    <span>печатает</span>
                                    <span class="typing-dots">...</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <button class="menu-btn" id="menuBtn">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="menu-dropdown" id="menuDropdown">
                        <div class="menu-item" data-action="clear">Очистить чат</div>
                        <div class="divider"></div>
                        <div class="menu-item" data-action="delete">Удалить чат</div>
                    </div>
                </div>`;

    // Заменяем старый chat-header
    const oldChatHeaderRegex = /<div class="chat-header" id="chatHeader">[\s\S]*?<\/div>\s*<div class="menu-dropdown/;
    if (oldChatHeaderRegex.test(htmlContent)) {
        htmlContent = htmlContent.replace(oldChatHeaderRegex, newChatHeader + '<div class="menu-dropdown');
    }

    // Добавляем элемент для счетчика непрочитанных в chat-item если его нет
    if (!htmlContent.includes('count-message-unread')) {
        htmlContent = htmlContent.replace(
            '<div class="chat-time"></div>',
            '<div class="chat-time"></div>\n                        <div class="count-message-unread" style="display: none;">0</div>'
        );
    }

    fs.writeFileSync(indexPath, htmlContent, 'utf8');
    console.log('✅ index.html обновлен');
}

// ========== 2. ОБНОВЛЕНИЕ STYLE.CSS ==========
console.log('\n📝 Добавление стилей...');

if (fs.existsSync(stylePath)) {
    let cssContent = fs.readFileSync(stylePath, 'utf8');

    const newStyles = `
/* ========== НОВЫЕ СТИЛИ ДЛЯ CHAT-HEADER ========== */
.chat-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.chat-user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 18px;
    color: white;
}

.chat-user-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.chat-user-name {
    font-weight: 600;
    font-size: 18px;
}

.chat-user-status-container {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
}

.chat-user-status-text {
    opacity: 0.8;
}

.chat-user-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
}

.chat-user-status-dot.online {
    background: #4caf50;
    box-shadow: 0 0 4px #4caf50;
    animation: pulse-online 1.5s infinite;
}

.chat-user-status-dot.offline {
    background: #9e9e9e;
}

.chat-user-typing {
    display: flex;
    align-items: center;
    gap: 2px;
    color: #4caf50;
    font-size: 12px;
    font-style: italic;
}

.typing-dots {
    display: inline-flex;
    gap: 2px;
}

.typing-dots::after {
    content: '...';
    animation: typing-dots 1.4s infinite;
}

@keyframes typing-dots {
    0%, 20% { content: '.'; }
    40% { content: '..'; }
    60%, 100% { content: '...'; }
}

@keyframes pulse-online {
    0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
    70% { box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
    100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

/* ========== СЧЕТЧИК НЕПРОЧИТАННЫХ ========== */
.count-message-unread {
    position: absolute;
    right: 40px;
    top: 50%;
    transform: translateY(-50%);
    background: #dc3545;
    color: white;
    font-size: 10px;
    font-weight: 600;
    min-width: 18px;
    height: 18px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.chat-item {
    position: relative;
}

/* ========== АНИМАЦИЯ ПЕЧАТАНИЯ В ПРЕВЬЮ ========== */
.chat-preview-typing {
    color: #4caf50;
    font-style: italic;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}`;

    if (!cssContent.includes('chat-user-info')) {
        cssContent += newStyles;
        fs.writeFileSync(stylePath, cssContent, 'utf8');
        console.log('✅ Добавлены новые стили');
    }
}

// ========== 3. ОБНОВЛЕНИЕ USER.JS ==========
console.log('\n📝 Обновление user.js...');

if (fs.existsSync(userJsPath)) {
    let userContent = fs.readFileSync(userJsPath, 'utf8');

    // Добавляем обработчики для статуса печатания
    const typingHandlers = `
    onUserTyping: null,
    
    sendTyping: function(chatId, isTyping) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('user-typing', { chatId: chatId, isTyping: isTyping });
        }
    },`;

    // Добавляем в connectSocket обработчики
    const socketTypingHandler = `
        this.socket.on('user-typing', function(data) {
            if (self.onUserTyping) {
                self.onUserTyping(data);
            }
        });`;

    if (!userContent.includes('sendTyping')) {
        userContent = userContent.replace(
            'onNewMessage: null,',
            'onNewMessage: null,\n    onUserTyping: null,'
        );
        userContent = userContent.replace(
            'this.socket.on("new-message", function(msg) {',
            socketTypingHandler + '\n        \n        this.socket.on("new-message", function(msg) {'
        );
        userContent = userContent.replace(
            'return this.socket;',
            typingHandlers + '\n        return this.socket;'
        );
        fs.writeFileSync(userJsPath, userContent, 'utf8');
        console.log('✅ user.js обновлен');
    }
}

// ========== 4. ОБНОВЛЕНИЕ MAIN.JS ==========
console.log('\n📝 Обновление main.js...');

if (fs.existsSync(mainJsPath)) {
    let mainContent = fs.readFileSync(mainJsPath, 'utf8');

    // Добавляем переменные для отслеживания
    const newVariables = `
let currentChatUser = null;
let typingTimeout = null;
let unreadCounts = {};`;

    // Добавляем функцию обновления статуса в новый блок
    const updateChatUserStatus = `
function updateChatUserStatus(user) {
    if (!user) return;
    
    const statusTextEl = document.getElementById("chatUserStatusText");
    const statusDotEl = document.getElementById("chatUserStatusDot");
    const userNameEl = document.getElementById("chatUserName");
    const userAvatarEl = document.getElementById("chatUserAvatar");
    const typingEl = document.getElementById("chatUserTyping");
    
    if (userNameEl) userNameEl.textContent = user.username || "Пользователь";
    
    const avatar = Utils.getUserAvatar(user);
    if (userAvatarEl) {
        if (avatar.type === "image") {
            userAvatarEl.style.backgroundImage = "url(" + avatar.value + "?t=" + Date.now() + ")";
            userAvatarEl.style.backgroundSize = "cover";
            userAvatarEl.innerHTML = "";
        } else {
            userAvatarEl.innerHTML = avatar.value;
            userAvatarEl.style.backgroundImage = "";
        }
    }
    
    if (user.status === "online") {
        const lastActive = new Date(user.lastActive);
        const now = new Date();
        const diffMinutes = (now - lastActive) / 1000 / 60;
        
        if (diffMinutes < 5) {
            if (statusTextEl) statusTextEl.textContent = "онлайн";
            if (statusDotEl) {
                statusDotEl.className = "chat-user-status-dot online";
                statusDotEl.style.display = "inline-block";
            }
        } else {
            if (statusTextEl) statusTextEl.textContent = "отошел";
            if (statusDotEl) {
                statusDotEl.className = "chat-user-status-dot idle";
                statusDotEl.style.display = "inline-block";
            }
        }
    } else {
        const lastActiveText = window.formatLastActive ? window.formatLastActive(user.lastActive) : "был только что";
        if (statusTextEl) statusTextEl.textContent = lastActiveText;
        if (statusDotEl) {
            statusDotEl.className = "chat-user-status-dot offline";
            statusDotEl.style.display = "inline-block";
        }
    }
}`;

    // Добавляем функцию отображения печатания
    const showTypingIndicator = `
function showTypingIndicator(show) {
    const typingEl = document.getElementById("chatUserTyping");
    const statusTextEl = document.getElementById("chatUserStatusText");
    const statusDotEl = document.getElementById("chatUserStatusDot");
    
    if (show) {
        if (typingEl) typingEl.style.display = "flex";
        if (statusTextEl) statusTextEl.style.display = "none";
        if (statusDotEl) statusDotEl.style.display = "none";
    } else {
        if (typingEl) typingEl.style.display = "none";
        if (statusTextEl) statusTextEl.style.display = "inline";
        if (statusDotEl) statusDotEl.style.display = "inline-block";
        if (currentChatUser) {
            updateChatUserStatus(currentChatUser);
        }
    }
}`;

    // Добавляем функцию обновления превью чата при печатании
    const updateChatPreviewTyping = `
function updateChatPreviewTyping(chatId, isTyping) {
    const chatItem = document.querySelector('.chat-item[data-chat-id="' + chatId + '"]');
    if (!chatItem) return;
    
    const previewEl = chatItem.querySelector('.chat-preview');
    if (!previewEl) return;
    
    if (isTyping) {
        previewEl.dataset.originalText = previewEl.textContent;
        previewEl.innerHTML = '<span class="chat-preview-typing">печатает...</span>';
    } else {
        if (previewEl.dataset.originalText) {
            previewEl.textContent = previewEl.dataset.originalText;
            delete previewEl.dataset.originalText;
        }
    }
}`;

    // Добавляем функцию обновления счетчика непрочитанных
    const updateUnreadCount = `
function updateUnreadCount(chatId, increment) {
    const chatItem = document.querySelector('.chat-item[data-chat-id="' + chatId + '"]');
    if (!chatItem) return;
    
    let countEl = chatItem.querySelector('.count-message-unread');
    if (!countEl) {
        countEl = document.createElement('div');
        countEl.className = 'count-message-unread';
        chatItem.appendChild(countEl);
    }
    
    let currentCount = unreadCounts[chatId] || 0;
    if (increment) {
        currentCount++;
    } else {
        currentCount = 0;
    }
    unreadCounts[chatId] = currentCount;
    
    if (currentCount > 0) {
        countEl.textContent = currentCount;
        countEl.style.display = 'flex';
    } else {
        countEl.style.display = 'none';
    }
}`;

    // Добавляем обработчик печатания в messageInput
    const typingHandlerInInput = `
    // Отслеживание печатания
    if (messageInput && currentChat) {
        let typingTimeout = null;
        const sendTypingStatus = function(isTyping) {
            if (UserManager && UserManager.sendTyping) {
                UserManager.sendTyping(currentChat._id, isTyping);
            }
        };
        
        messageInput.addEventListener('input', function() {
            if (typingTimeout) clearTimeout(typingTimeout);
            sendTypingStatus(true);
            typingTimeout = setTimeout(function() {
                sendTypingStatus(false);
            }, 1000);
        });
        
        messageInput.addEventListener('blur', function() {
            if (typingTimeout) clearTimeout(typingTimeout);
            sendTypingStatus(false);
        });
    }`;

    // Добавляем обработчик новых сообщений
    const newMessageHandler = `
function handleNewMessage(message) {
    console.log('Новое сообщение:', message);
    
    const isCurrentChatOpen = currentChat && currentChat._id === message.chatId;
    
    if (isCurrentChatOpen) {
        currentMessagesList.push(message);
        
        const msgElement = createMessageElement(message);
        
        const lastMsg = currentMessagesList[currentMessagesList.length - 2];
        if (!lastMsg || new Date(lastMsg.createdAt).toLocaleDateString() !== new Date(message.createdAt).toLocaleDateString()) {
            const divider = document.createElement("div");
            divider.className = "date-divider";
            divider.innerHTML = "<span>" + new Date(message.createdAt).toLocaleDateString() + "</span>";
            messagesArea.appendChild(divider);
        }
        
        messagesArea.appendChild(msgElement);
        messagesArea.scrollTop = messagesArea.scrollHeight;
        
        // Сбрасываем счетчик непрочитанных для этого чата
        updateUnreadCount(message.chatId, false);
    } else {
        // Увеличиваем счетчик непрочитанных
        updateUnreadCount(message.chatId, true);
    }
    
    loadChats();
}`;

    // Обновляем openChat для сброса счетчика
    const openChatWithReset = `
async function openChat(chatId) {
    for (let i = 0; i < chats.length; i++) {
        if (chats[i]._id === chatId) {
            currentChat = chats[i];
            break;
        }
    }
    if (!currentChat) return;
    
    // Получаем информацию о собеседнике
    if (currentChat.participants) {
        for (let i = 0; i < currentChat.participants.length; i++) {
            if (currentChat.participants[i]._id !== currentUser._id) {
                currentChatUser = currentChat.participants[i];
                break;
            }
        }
    }
    
    const name = getChatName(currentChat);
    if (chatName) chatName.textContent = name;
    if (chatAvatar) chatAvatar.textContent = name.substring(0, 2).toUpperCase();
    
    // Обновляем новый блок с информацией о пользователе
    if (currentChatUser) {
        updateChatUserStatus(currentChatUser);
    }
    
    // Сбрасываем счетчик непрочитанных
    updateUnreadCount(chatId, false);
    
    await loadMessages(chatId, false);
    
    if (UserManager.socket && UserManager.socket.connected) {
        UserManager.socket.emit("join-chat", chatId);
    }
}`;

    // Добавляем обработчик статуса печатания от собеседника
    const typingStatusHandler = `
    UserManager.onUserTyping = function(data) {
        if (data.chatId === currentChat?._id) {
            showTypingIndicator(data.isTyping);
        }
        if (!data.isTyping) {
            updateChatPreviewTyping(data.chatId, false);
        } else {
            updateChatPreviewTyping(data.chatId, true);
        }
    };`;

    // Добавляем все новые функции в main.js
    if (!mainContent.includes('updateChatUserStatus')) {
        // Добавляем переменные
        mainContent = mainContent.replace(
            'let currentMessagesList = [];',
            'let currentMessagesList = [];\n' + newVariables
        );

        // Добавляем функции
        mainContent = mainContent.replace(
            'function updateChatInfoStatus(user) {',
            updateChatUserStatus + '\n\n' + showTypingIndicator + '\n\n' + updateChatPreviewTyping + '\n\n' + updateUnreadCount + '\n\nfunction updateChatInfoStatus(user) {'
        );

        // Заменяем handleNewMessage
        const handleNewMessageRegex = /function handleNewMessage\(message\) \{[\s\S]*?\n\}/;
        if (handleNewMessageRegex.test(mainContent)) {
            mainContent = mainContent.replace(handleNewMessageRegex, newMessageHandler);
        }

        // Заменяем openChat
        const openChatRegex = /async function openChat\(chatId\) \{[\s\S]*?\n\}/;
        if (openChatRegex.test(mainContent)) {
            mainContent = mainContent.replace(openChatRegex, openChatWithReset);
        }

        // Добавляем обработчик статуса печатания в init
        const initTypingHandler = mainContent.replace(
            'UserManager.onNewMessage = handleNewMessage;',
            'UserManager.onNewMessage = handleNewMessage;\n    ' + typingStatusHandler
        );
        mainContent = initTypingHandler;

        // Добавляем обработчик печатания в setupEventListeners
        const setupEventListenersRegex = /function setupEventListeners\(\) \{[\s\S]*?\n\}/;
        if (setupEventListenersRegex.test(mainContent)) {
            mainContent = mainContent.replace(setupEventListenersRegex,
                'function setupEventListeners() {\n' +
                '    if (sendBtn) sendBtn.onclick = sendMessage;\n' +
                '    if (attachBtn) attachBtn.onclick = handleAttachFile;\n' +
                '    if (messageInput) {\n' +
                '        messageInput.onkeydown = function(e) {\n' +
                '            if (e.key === "Enter" && !e.shiftKey) {\n' +
                '                e.preventDefault();\n' +
                '                sendMessage();\n' +
                '            }\n' +
                '        };\n' +
                '        \n' +
                '        let inputTypingTimeout = null;\n' +
                '        messageInput.addEventListener("input", function() {\n' +
                '            if (inputTypingTimeout) clearTimeout(inputTypingTimeout);\n' +
                '            if (UserManager && UserManager.sendTyping && currentChat) {\n' +
                '                UserManager.sendTyping(currentChat._id, true);\n' +
                '            }\n' +
                '            inputTypingTimeout = setTimeout(function() {\n' +
                '                if (UserManager && UserManager.sendTyping && currentChat) {\n' +
                '                    UserManager.sendTyping(currentChat._id, false);\n' +
                '                }\n' +
                '            }, 1000);\n' +
                '        });\n' +
                '        \n' +
                '        messageInput.addEventListener("blur", function() {\n' +
                '            if (inputTypingTimeout) clearTimeout(inputTypingTimeout);\n' +
                '            if (UserManager && UserManager.sendTyping && currentChat) {\n' +
                '                UserManager.sendTyping(currentChat._id, false);\n' +
                '            }\n' +
                '        });\n' +
                '    }\n' +
                '    if (searchInput) searchInput.oninput = function() { renderChatsList(); };\n' +
                '    if (logoutBtn) logoutBtn.onclick = function() { UserManager.logout(); };\n' +
                '    \n' +
                '    if (favoritesBtn) favoritesBtn.onclick = openFavorites;\n' +
                '    if (contactsBtn) contactsBtn.onclick = showContacts;\n' +
                '    if (themeBtn) themeBtn.onclick = toggleTheme;\n' +
                '    if (profileBtn) profileBtn.onclick = showProfile;\n' +
                '    \n' +
                '    const closeContacts = document.getElementById("closeContactsBtn");\n' +
                '    const closeProfile = document.getElementById("closeProfileBtn");\n' +
                '    if (closeContacts) closeContacts.onclick = showChat;\n' +
                '    if (closeProfile) closeProfile.onclick = showChat;\n' +
                '    \n' +
                '    const editEmailBtns = document.querySelectorAll(".edit-btn[data-field=\\"email\\"]");\n' +
                '    for (let i = 0; i < editEmailBtns.length; i++) {\n' +
                '        const btn = editEmailBtns[i];\n' +
                '        btn.addEventListener("click", async function() {\n' +
                '            const newEmail = prompt("Введите новый email:", currentUser.email);\n' +
                '            if (newEmail && newEmail !== currentUser.email) {\n' +
                '                try {\n' +
                '                    await UserManager.updateProfile({ email: newEmail });\n' +
                '                    currentUser.email = newEmail;\n' +
                '                    const profileEmail = document.getElementById("profileEmail");\n' +
                '                    if (profileEmail) profileEmail.textContent = newEmail;\n' +
                '                    showToast("Email обновлен", "success");\n' +
                '                } catch (error) {\n' +
                '                    showToast(error.message, "error");\n' +
                '                }\n' +
                '            }\n' +
                '        });\n' +
                '    }\n' +
                '    \n' +
                '    const editPasswordBtns = document.querySelectorAll(".edit-btn[data-field=\\"password\\"]");\n' +
                '    for (let i = 0; i < editPasswordBtns.length; i++) {\n' +
                '        editPasswordBtns[i].addEventListener("click", showPasswordModal);\n' +
                '    }\n' +
                '    \n' +
                '    const changeAvatarBtn = document.getElementById("changeAvatarBtn");\n' +
                '    if (changeAvatarBtn) changeAvatarBtn.onclick = showCropModal;\n' +
                '    \n' +
                '    initMenuDropdown();\n' +
                '}'
            );
        }

        fs.writeFileSync(mainJsPath, mainContent, 'utf8');
        console.log('✅ main.js обновлен');
    }
}

// ========== 5. ОБНОВЛЕНИЕ SERVER.JS ==========
console.log('\n📝 Обновление server.js для обработки печатания...');

const serverJsPath = path.join(process.cwd(), 'server', 'server.js');
if (fs.existsSync(serverJsPath)) {
    let serverContent = fs.readFileSync(serverJsPath, 'utf8');

    // Добавляем обработчик user-typing
    const typingSocketHandler = `
    socket.on('user-typing', (data) => {
        if (data && data.chatId) {
            socket.to(data.chatId).emit('user-typing', {
                chatId: data.chatId,
                isTyping: data.isTyping,
                userId: socket.userId
            });
        }
    });`;

    if (!serverContent.includes('user-typing')) {
        serverContent = serverContent.replace(
            'socket.on("join-chat", (chatId) => {',
            typingSocketHandler + '\n    \n    socket.on("join-chat", (chatId) => {'
        );
        fs.writeFileSync(serverJsPath, serverContent, 'utf8');
        console.log('✅ server.js обновлен');
    }
}

// ========== 6. ЗАВЕРШЕНИЕ ==========
console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║     ✅ ФУНКЦИОНАЛ РЕАЛЬНОГО ВРЕМЕНИ ДОБАВЛЕН!        ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📋 Что было добавлено:');
console.log('   ✅ Новый блок chat-header с информацией о пользователе');
console.log('   ✅ Отображение статуса "онлайн/отошел/был только что"');
console.log('   ✅ Анимированная надпись "печатает..."');
console.log('   ✅ Сообщения появляются в реальном времени без обновления');
console.log('   ✅ Счетчик непрочитанных сообщений');
console.log('   ✅ Индикатор печатания в превью чата\n');

console.log('📋 Следующие шаги:');
console.log('   1. Перезапустите сервер: npm start');
console.log('   2. Очистите кэш браузера (Ctrl+Shift+Del)');
console.log('   3. Обновите страницу\n');

console.log('🔧 Проверка работы:');
console.log('   • Откройте чат с другим пользователем');
console.log('   • Попросите его написать сообщение - оно появится сразу');
console.log('   • Попросите его начать печатать - увидите надпись "печатает..."');
console.log('   • Закройте чат - увидите счетчик непрочитанных\n');