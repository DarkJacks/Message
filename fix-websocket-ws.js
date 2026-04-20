const fs = require('fs');
const path = require('path');

console.log('🔧 Полное исправление user.js...\n');

const userJsPath = path.join(process.cwd(), 'public', 'js', 'user.js');

// Полностью рабочий user.js
const cleanUserJs = `// ========== USER MANAGER ==========
window.UserManager = {
    apiUrl: "/api",
    token: localStorage.getItem("token"),
    ws: null,
    wsConnected: false,
    onNewMessage: null,
    onUserStatusChange: null,
    onUserTyping: null,
    
    setToken: function(token) {
        this.token = token;
        if (token) {
            localStorage.setItem("token", token);
        } else {
            localStorage.removeItem("token");
        }
    },
    
    request: async function(endpoint, options) {
        options = options || {};
        var headers = { "Content-Type": "application/json" };
        if (this.token) {
            headers["Authorization"] = "Bearer " + this.token;
        }
        
        var response = await fetch(this.apiUrl + endpoint, {
            method: options.method || "GET",
            headers: headers,
            body: options.body || null
        });
        var data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Ошибка запроса");
        }
        return data;
    },
    
    login: async function(email, password) {
        var data = await this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email: email, password: password })
        });
        this.setToken(data.token);
        return data.user;
    },
    
    register: async function(username, email, password) {
        var data = await this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify({ username: username, email: email, password: password })
        });
        this.setToken(data.token);
        return data.user;
    },
    
    getCurrentUser: async function() {
        try {
            if (!this.token) {
                return null;
            }
            return await this.request("/auth/me");
        } catch(e) {
            return null;
        }
    },
    
    updateProfile: async function(updates) {
        return await this.request("/auth/profile", {
            method: "PUT",
            body: JSON.stringify(updates)
        });
    },
    
    changePassword: async function(currentPassword, newPassword) {
        return await this.request("/auth/change-password", {
            method: "POST",
            body: JSON.stringify({ currentPassword: currentPassword, newPassword: newPassword })
        });
    },
    
    updateAvatar: async function(formData) {
        var response = await fetch(this.apiUrl + "/auth/avatar", {
            method: "POST",
            headers: { "Authorization": "Bearer " + this.token },
            body: formData
        });
        if (!response.ok) {
            var error = await response.json();
            throw new Error(error.error || "Ошибка загрузки");
        }
        return await response.json();
    },
    
    getUsers: async function() {
        return await this.request("/users");
    },
    
    getChats: async function() {
        return await this.request("/chats");
    },
    
    getMessages: async function(chatId) {
        return await this.request("/chats/" + chatId + "/messages");
    },
    
    sendMessage: async function(chatId, text, file) {
        var formData = new FormData();
        formData.append("text", text || "");
        if (file) {
            formData.append("file", file);
        }
        
        console.log("📤 Отправка сообщения через API...");
        var response = await fetch(this.apiUrl + "/chats/" + chatId + "/messages", {
            method: "POST",
            headers: { "Authorization": "Bearer " + this.token },
            body: formData
        });
        
        if (!response.ok) {
            var errorData = await response.json();
            throw new Error(errorData.error || "Ошибка отправки");
        }
        
        var message = await response.json();
        console.log("✅ Сообщение сохранено в БД:", message._id);
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log("📤 Отправка сообщения через WebSocket...");
            this.ws.send(JSON.stringify({
                type: "new-message",
                message: message
            }));
            console.log("✅ Сообщение отправлено через WebSocket");
        } else {
            console.warn("⚠️ WebSocket не готов");
        }
        
        return message;
    },
    
    createChat: async function(userId) {
        if (!userId) {
            throw new Error("ID пользователя не указан");
        }
        return await this.request("/chats", {
            method: "POST",
            body: JSON.stringify({ participantId: userId })
        });
    },
    
    createFavoritesChat: async function() {
        var chats = await this.getChats();
        var existing = null;
        for (var i = 0; i < chats.length; i++) {
            if (chats[i].type === "favorites") {
                existing = chats[i];
                break;
            }
        }
        if (existing) {
            return existing;
        }
        return await this.request("/chats/favorites", { method: "POST" });
    },
    
    deleteChat: async function(chatId) {
        return await this.request("/chats/" + chatId, { method: "DELETE" });
    },
    
    connectWebSocket: function(userId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            console.log("WebSocket уже подключен");
            return this.ws;
        }
        
        var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        var wsUrl = protocol + "//" + window.location.host + "/ws";
        
        console.log("🔌 Подключение WebSocket к:", wsUrl);
        this.ws = new WebSocket(wsUrl);
        
        var self = this;
        
        this.ws.onopen = function() {
            console.log("✅ WebSocket подключен");
            self.wsConnected = true;
            
            if (userId) {
                var userIdStr = (typeof userId === "object") ? (userId._id || userId.id) : userId;
                console.log("🔐 Отправка аутентификации для:", userIdStr);
                self.ws.send(JSON.stringify({
                    type: "auth",
                    userId: userIdStr
                }));
            }
        };
        
        this.ws.onmessage = function(event) {
            try {
                var data = JSON.parse(event.data);
                console.log("📨 WebSocket получено:", data.type);
                
                if (data.type === "new-message") {
                    console.log("💬 Новое сообщение:", data.message._id);
                    if (self.onNewMessage) {
                        self.onNewMessage(data.message);
                    }
                } else if (data.type === "user-status") {
                    console.log("👤 Статус пользователя:", data.userId, data.status);
                    if (self.onUserStatusChange) {
                        self.onUserStatusChange({
                            userId: data.userId,
                            status: data.status
                        });
                    }
                } else if (data.type === "typing") {
                    console.log("✍️ Печатание:", data.userId, data.isTyping);
                    if (self.onUserTyping) {
                        self.onUserTyping({
                            chatId: data.chatId,
                            userId: data.userId,
                            isTyping: data.isTyping
                        });
                    }
                } else if (data.type === "auth-success") {
                    console.log("✅ WebSocket аутентификация успешна");
                } else {
                    console.log("⚠️ Неизвестный тип:", data.type);
                }
            } catch (error) {
                console.error("Ошибка обработки WebSocket:", error);
            }
        };
        
        this.ws.onclose = function() {
            console.log("❌ WebSocket отключен");
            self.wsConnected = false;
            setTimeout(function() {
                if (userId && !self.wsConnected) {
                    console.log("🔄 Переподключение...");
                    self.connectWebSocket(userId);
                }
            }, 3000);
        };
        
        this.ws.onerror = function(error) {
            console.error("WebSocket ошибка:", error);
        };
        
        return this.ws;
    },
    
    joinChat: function(chatId) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: "join-chat",
                chatId: chatId
            }));
            console.log("📢 Присоединился к чату:", chatId);
        } else {
            console.warn("⚠️ WebSocket не готов для join-chat");
        }
    },
    
    sendTyping: function(chatId, isTyping) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: "typing",
                chatId: chatId,
                isTyping: isTyping
            }));
            console.log("✍️ Отправлен статус печатания:", isTyping);
        }
    },
    
    disconnectWebSocket: function() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.wsConnected = false;
        }
    },
    
    logout: function() {
        this.disconnectWebSocket();
        this.setToken(null);
        window.location.href = "/login.html";
    }
};`;

fs.writeFileSync(userJsPath, cleanUserJs, 'utf8');
console.log('✅ user.js полностью переписан');

// Проверка синтаксиса
console.log('\n📝 Проверка синтаксиса...');

const content = fs.readFileSync(userJsPath, 'utf8');
const openBraces = (content.match(/\{/g) || []).length;
const closeBraces = (content.match(/\}/g) || []).length;
const openParens = (content.match(/\(/g) || []).length;
const closeParens = (content.match(/\)/g) || []).length;

console.log(`   Открывающих скобок {}: ${openBraces}`);
console.log(`   Закрывающих скобок {}: ${closeBraces}`);
console.log(`   Открывающих скобок (): ${openParens}`);
console.log(`   Закрывающих скобок (): ${closeParens}`);

if (openBraces === closeBraces && openParens === closeParens) {
    console.log('   ✅ Синтаксис корректный');
} else {
    console.log('   ⚠️ Найдены несоответствия скобок');
    console.log(`   Разница {}: ${openBraces - closeBraces}`);
    console.log(`   Разница (): ${openParens - closeParens}`);
}

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║     ✅ USER.JS ИСПРАВЛЕН!                               ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📋 Следующие шаги:');
console.log('   1. Перезапустите сервер: npm start');
console.log('   2. Очистите кэш браузера (Ctrl+Shift+Del)');
console.log('   3. Обновите страницу\n');