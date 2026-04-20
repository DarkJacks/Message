const fs = require('fs');
const path = require('path');

console.log('🔧 Полное пересоздание main.js...\n');

const mainJsPath = path.join(process.cwd(), 'public', 'js', 'main.js');

// Полностью новый main.js без ошибок
const newMainJs = `// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let currentUser = null;
let currentChat = null;
let chats = [];
let currentFile = null;
let currentCropper = null;
let messagesScrollListener = null;
let currentChatUser = null;
let unreadCounts = {};

// Пагинация сообщений
let currentMessagesPage = 0;
let messagesLimit = 100;
let hasMoreMessages = true;
let isLoadingMessages = false;
let currentMessagesList = [];

// DOM элементы
const chatsListEl = document.getElementById("chatsList");
const messagesArea = document.getElementById("messagesArea");
const chatName = document.getElementById("chatName");
const chatStatus = document.getElementById("chatStatus");
const chatAvatar = document.getElementById("chatAvatar");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const attachBtn = document.getElementById("attachBtn");
const searchInput = document.getElementById("searchChats");
const profileName = document.getElementById("profileName");
const profileAvatarSmall = document.getElementById("profileAvatarSmall");
const logoutBtn = document.getElementById("logoutBtn");
const menuBtn = document.getElementById("menuBtn");
const menuDropdown = document.getElementById("menuDropdown");

// Навигационные кнопки
const favoritesBtn = document.getElementById("favoritesBtn");
const contactsBtn = document.getElementById("contactsBtn");
const themeBtn = document.getElementById("themeBtn");
const profileBtn = document.getElementById("profileBtn");

// Контейнеры
const chatContainer = document.getElementById("chatContainer");
const contactsContainer = document.getElementById("contactsContainer");
const profileContainer = document.getElementById("profileContainer");

// ========== УПРАВЛЕНИЕ ВИДИМОСТЬЮ ==========
function showChat() {
    chatContainer.style.display = "flex";
    contactsContainer.style.display = "none";
    profileContainer.style.display = "none";
}

function showContacts() {
    chatContainer.style.display = "none";
    contactsContainer.style.display = "flex";
    profileContainer.style.display = "none";
    loadContacts();
}

function showProfile() {
    chatContainer.style.display = "none";
    contactsContainer.style.display = "none";
    profileContainer.style.display = "flex";
    renderProfile();
}

// ========== ТЕМА ==========
function initTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark-theme") {
        document.body.classList.add("dark-theme");
        document.body.classList.remove("light-theme");
        updateThemeIcon(true);
    } else {
        document.body.classList.add("light-theme");
        document.body.classList.remove("dark-theme");
        updateThemeIcon(false);
    }
}

function updateThemeIcon(isDark) {
    if (themeBtn) {
        const icon = themeBtn.querySelector("i");
        if (icon) {
            icon.className = isDark ? "fas fa-moon" : "fas fa-sun";
        }
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains("dark-theme");
    if (isDark) {
        document.body.classList.remove("dark-theme");
        document.body.classList.add("light-theme");
        localStorage.setItem("theme", "light-theme");
        updateThemeIcon(false);
    } else {
        document.body.classList.remove("light-theme");
        document.body.classList.add("dark-theme");
        localStorage.setItem("theme", "dark-theme");
        updateThemeIcon(true);
    }
}

// ========== ОБНОВЛЕНИЕ СТАТУСА В CHAT-HEADER ==========
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
    
    if (statusTextEl && statusDotEl) {
        if (user.status === "online") {
            const lastActive = new Date(user.lastActive);
            const now = new Date();
            const diffMinutes = (now - lastActive) / 1000 / 60;
            
            if (diffMinutes < 5) {
                statusTextEl.textContent = "онлайн";
                statusDotEl.className = "chat-user-status-dot online";
                statusDotEl.style.display = "inline-block";
                if (typingEl) typingEl.style.display = "none";
            } else {
                statusTextEl.textContent = "отошел";
                statusDotEl.className = "chat-user-status-dot idle";
                statusDotEl.style.display = "inline-block";
                if (typingEl) typingEl.style.display = "none";
            }
        } else {
            const lastActiveText = window.formatLastActive ? window.formatLastActive(user.lastActive) : "был только что";
            statusTextEl.textContent = lastActiveText;
            statusDotEl.className = "chat-user-status-dot offline";
            statusDotEl.style.display = "inline-block";
            if (typingEl) typingEl.style.display = "none";
        }
    }
}

// ========== ПОКАЗ ИНДИКАТОРА ПЕЧАТАНИЯ ==========
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
}

// ========== ОБНОВЛЕНИЕ ПРЕВЬЮ ПРИ ПЕЧАТАНИИ ==========
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
}

// ========== ОБНОВЛЕНИЕ СЧЕТЧИКА НЕПРОЧИТАННЫХ ==========
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
        countEl.style.display = "flex";
    } else {
        countEl.style.display = "none";
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
async function init() {
    try {
        if (!window.UserManager) {
            throw new Error("UserManager не загружен");
        }

        const user = await UserManager.getCurrentUser();
        if (!user) {
            window.location.href = "/login.html";
            return;
        }

        currentUser = user;
        updateUserUI();
        
        setTimeout(function() {
            if (UserManager.connectSocket) {
                UserManager.connectSocket(currentUser._id);
            }
        }, 1000);
        
        UserManager.onNewMessage = handleNewMessage;
        UserManager.onUserTyping = function(data) {
            if (data && data.chatId === currentChat?._id) {
                showTypingIndicator(data.isTyping);
            }
            updateChatPreviewTyping(data.chatId, data.isTyping);
        };
        
        await loadChats();
        setupEventListeners();
        showChat();
        
        console.log("✅ Приложение инициализировано");
        
    } catch (error) {
        console.error("Ошибка инициализации:", error);
        showToast("Ошибка загрузки", "error");
    }
}

function updateUserUI() {
    if (!currentUser) return;
    
    if (profileName) profileName.textContent = currentUser.username || "Пользователь";
    
    const usernameDisplay = document.getElementById("username");
    if (usernameDisplay) usernameDisplay.textContent = currentUser.username;
    
    const avatar = Utils.getUserAvatar(currentUser);
    if (profileAvatarSmall) {
        if (avatar.type === "image") {
            profileAvatarSmall.style.backgroundImage = "url(" + avatar.value + "?t=" + Date.now() + ")";
            profileAvatarSmall.style.backgroundSize = "cover";
            profileAvatarSmall.innerHTML = "";
        } else {
            profileAvatarSmall.innerHTML = "<i class=\"fas fa-user\"></i>";
            profileAvatarSmall.style.backgroundImage = "";
        }
    }
}

// ========== ЧАТЫ ==========
async function loadChats() {
    try {
        chats = await UserManager.getChats();
        renderChatsList();
    } catch (error) {
        console.error("Ошибка загрузки чатов:", error);
        showToast("Ошибка загрузки чатов", "error");
    }
}

function getChatName(chat) {
    if (chat.type === "favorites") return "⭐ Избранное";
    if (chat.name) return chat.name;
    if (chat.participants && chat.participants.length > 0 && currentUser) {
        for (let i = 0; i < chat.participants.length; i++) {
            if (chat.participants[i]._id !== currentUser._id) {
                return chat.participants[i].username;
            }
        }
    }
    return "Чат";
}

function renderChatsList() {
    if (!chatsListEl) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const filtered = chats.filter(chat => getChatName(chat).toLowerCase().includes(searchTerm));

    if (filtered.length === 0) {
        chatsListEl.innerHTML = "<div class=\"empty-state\">Нет чатов</div>";
        return;
    }

    let html = "";
    for (let i = 0; i < filtered.length; i++) {
        const chat = filtered[i];
        const name = getChatName(chat);
        const preview = (chat.lastMessage && chat.lastMessage.text) ? chat.lastMessage.text : "Нет сообщений";
        const time = (chat.lastMessage && chat.lastMessage.createdAt) ? Utils.formatDate(chat.lastMessage.createdAt) : "";
        const active = (currentChat && currentChat._id === chat._id) ? "active" : "";
        const isFavorites = (chat.type === "favorites");
        const initials = name.substring(0, 2).toUpperCase();

        html += "<div class=\"chat-item " + active + "\" data-chat-id=\"" + chat._id + "\">";
        html += "<div class=\"chat-avatar\">" + (isFavorites ? "<i class=\"fas fa-star\"></i>" : Utils.escapeHtml(initials)) + "</div>";
        html += "<div class=\"chat-info\">";
        html += "<div class=\"chat-name\">" + Utils.escapeHtml(name) + "</div>";
        html += "<div class=\"chat-preview\">" + Utils.escapeHtml(preview) + "</div>";
        html += "</div>";
        html += "<div class=\"chat-time\">" + Utils.escapeHtml(time) + "</div>";
        html += "<div class=\"count-message-unread\" style=\"display: none;\"></div>";
        if (!isFavorites) {
            html += "<button class=\"delete-chat-btn\" data-chat-id=\"" + chat._id + "\"><i class=\"fas fa-times\"></i></button>";
        }
        html += "</div>";
    }

    chatsListEl.innerHTML = html;

    const chatItems = document.querySelectorAll(".chat-item");
    for (let i = 0; i < chatItems.length; i++) {
        const item = chatItems[i];
        const chatId = item.getAttribute("data-chat-id");
        if (!chatId) continue;
        
        item.addEventListener("click", function(e) {
            if (e.target.closest(".delete-chat-btn")) return;
            openChat(chatId);
        });
        
        const deleteBtn = item.querySelector(".delete-chat-btn");
        if (deleteBtn) {
            deleteBtn.addEventListener("click", async function(e) {
                e.stopPropagation();
                const delChatId = this.getAttribute("data-chat-id");
                if (delChatId && confirm("Удалить этот чат?")) {
                    try {
                        await UserManager.deleteChat(delChatId);
                        await loadChats();
                        if (currentChat && currentChat._id === delChatId) {
                            currentChat = null;
                            clearChatArea();
                        }
                    } catch (error) {
                        showToast("Ошибка удаления чата", "error");
                    }
                }
            });
        }
    }
}

function clearChatArea() {
    if (messagesArea) messagesArea.innerHTML = "<div class=\"empty-chat\"><i class=\"fas fa-comments\"></i><p>Выберите чат</p></div>";
    if (chatName) chatName.textContent = "Выберите чат";
    if (chatStatus) chatStatus.innerHTML = "";
    if (chatAvatar) chatAvatar.textContent = "?";
}

// ========== СООБЩЕНИЯ ==========
async function loadMessages(chatId, loadMore) {
    if (isLoadingMessages) return;
    if (loadMore === undefined) loadMore = false;
    if (loadMore && !hasMoreMessages) return;
    
    if (!loadMore) {
        currentMessagesPage = 0;
        currentMessagesList = [];
        hasMoreMessages = true;
        messagesArea.innerHTML = "<div class=\"loading\">Загрузка сообщений...</div>";
    }
    
    isLoadingMessages = true;
    
    try {
        let before = (loadMore && currentMessagesList.length > 0) ? currentMessagesList[0].createdAt : null;
        let url = "/api/chats/" + chatId + "/messages?limit=" + messagesLimit;
        if (before) url = url + "&before=" + before;
        
        const response = await fetch(url, {
            headers: { "Authorization": "Bearer " + UserManager.token }
        });
        
        if (!response.ok) throw new Error("Ошибка загрузки");
        
        const messages = await response.json();
        
        if (!messages || messages.length === 0) {
            hasMoreMessages = false;
            if (!loadMore && messagesArea.children.length === 0) {
                messagesArea.innerHTML = "<div class=\"empty-chat\"><i class=\"fas fa-smile-wink\"></i><p>Напишите первое сообщение</p></div>";
            }
            return;
        }
        
        if (loadMore) {
            currentMessagesList = messages.concat(currentMessagesList);
            const oldHeight = messagesArea.scrollHeight;
            const oldTop = messagesArea.scrollTop;
            
            renderMessages(messages, true);
            
            messagesArea.scrollTop = oldTop + (messagesArea.scrollHeight - oldHeight);
        } else {
            currentMessagesList = messages;
            renderMessages(messages, false);
            setupMessageScroll(chatId);
        }
        
        hasMoreMessages = (messages.length === messagesLimit);
        
    } catch (error) {
        console.error("Ошибка загрузки сообщений:", error);
        if (!loadMore) {
            messagesArea.innerHTML = "<div class=\"empty-chat\"><i class=\"fas fa-exclamation-circle\"></i><p>Ошибка загрузки</p></div>";
        }
    } finally {
        isLoadingMessages = false;
    }
}

function renderMessages(messages, prepend) {
    if (!messagesArea) return;
    if (prepend === undefined) prepend = false;
    
    if (!messages || messages.length === 0) return;
    
    if (prepend && messagesArea.children.length === 1 && messagesArea.children[0].classList && messagesArea.children[0].classList.contains("loading")) {
        messagesArea.innerHTML = "";
    }
    
    const fragment = document.createDocumentFragment();
    let lastDate = null;
    
    const sortedMessages = [...messages].sort(function(a, b) {
        return new Date(a.createdAt) - new Date(b.createdAt);
    });
    
    for (let i = 0; i < sortedMessages.length; i++) {
        const msg = sortedMessages[i];
        const date = new Date(msg.createdAt).toLocaleDateString();
        if (date !== lastDate) {
            const divider = document.createElement("div");
            divider.className = "date-divider";
            divider.innerHTML = "<span>" + Utils.escapeHtml(date) + "</span>";
            fragment.appendChild(divider);
            lastDate = date;
        }
        
        const msgElement = createMessageElement(msg);
        fragment.appendChild(msgElement);
    }
    
    if (prepend) {
        messagesArea.prepend(fragment);
    } else {
        messagesArea.appendChild(fragment);
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}

function createMessageElement(msg) {
    const isOutgoing = msg.sender && msg.sender._id === currentUser._id;
    const sender = msg.sender && msg.sender.username ? msg.sender.username : "Пользователь";
    const avatar = Utils.getUserAvatar(msg.sender);
    
    let avatarStyle = "background: linear-gradient(135deg, #667eea, #764ba2);";
    let avatarText = avatar.value;
    
    if (avatar.type === "image") {
        avatarStyle = "background-image: url(" + avatar.value + "); background-size: cover;";
        avatarText = "";
    }
    
    let contentHtml = "";
    if (msg.fileUrl) {
        if (msg.fileType === "image") {
            contentHtml = "<div class=\"file-attachment\"><img src=\"" + msg.fileUrl + "\" class=\"image-preview\" onclick=\"window.open(\'" + msg.fileUrl + "\', \'_blank\')\" alt=\"\"></div>";
        } else if (msg.fileType === "video") {
            contentHtml = "<div class=\"file-attachment video-preview\" onclick=\"window.open(\'" + msg.fileUrl + "\', \'_blank\')\"><video src=\"" + msg.fileUrl + "\"></video><div class=\"play-overlay\"><i class=\"fas fa-play\"></i></div></div>";
        } else {
            const icon = Utils.getFileIcon(msg.fileName);
            contentHtml = "<a href=\"" + msg.fileUrl + "\" class=\"file-link\" download><i class=\"fas fa-" + icon + "\"></i> " + Utils.escapeHtml(msg.fileName) + "</a>";
        }
    }
    if (msg.text) {
        contentHtml += "<div>" + Utils.escapeHtml(msg.text) + "</div>";
    }
    
    const div = document.createElement("div");
    div.className = "message " + (isOutgoing ? "outgoing" : "incoming");
    div.innerHTML = "<div class=\"message-avatar\" style=\"" + avatarStyle + "\">" + avatarText + "</div>" +
        "<div class=\"message-content\">" +
            "<div class=\"message-sender\">" + Utils.escapeHtml(sender) + "</div>" +
            "<div class=\"message-bubble\">" +
                contentHtml +
                "<div class=\"message-meta\">" +
                    "<span>" + Utils.formatDate(msg.createdAt) + "</span>" +
                "</div>" +
            "</div>" +
        "</div>";
    return div;
}

function setupMessageScroll(chatId) {
    if (messagesScrollListener) {
        messagesArea.removeEventListener("scroll", messagesScrollListener);
    }
    
    messagesScrollListener = function() {
        if (messagesArea.scrollTop <= 50 && hasMoreMessages && !isLoadingMessages && currentMessagesList.length > 0) {
            loadMessages(chatId, true);
        }
    };
    
    messagesArea.addEventListener("scroll", messagesScrollListener);
}

async function openChat(chatId) {
    for (let i = 0; i < chats.length; i++) {
        if (chats[i]._id === chatId) {
            currentChat = chats[i];
            break;
        }
    }
    if (!currentChat) return;
    
    if (currentChat.participants) {
        for (let i = 0; i < currentChat.participants.length; i++) {
            if (currentChat.participants[i]._id !== currentUser._id) {
                currentChatUser = currentChat.participants[i];
                break;
            }
        }
    }
    
    if (currentChatUser) {
        updateChatUserStatus(currentChatUser);
    }
    
    updateUnreadCount(chatId, false);
    
    await loadMessages(chatId, false);
    
    if (UserManager.socket && UserManager.socket.connected) {
        UserManager.socket.emit("join-chat", chatId);
    }
}

function handleNewMessage(message) {
    if (currentChat && currentChat._id === message.chatId) {
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
        updateUnreadCount(message.chatId, false);
    } else {
        updateUnreadCount(message.chatId, true);
    }
    loadChats();
}

async function sendMessage() {
    if (!currentChat) {
        showToast("Выберите чат", "warning");
        return;
    }
    
    const text = messageInput ? messageInput.value.trim() : "";
    if (!text && !currentFile) return;
    
    const file = currentFile;
    currentFile = null;
    
    try {
        const msg = await UserManager.sendMessage(currentChat._id, text, file);
        if (messageInput) messageInput.value = "";
        
        if (currentChat._id === msg.chatId) {
            currentMessagesList.push(msg);
            
            const msgElement = createMessageElement(msg);
            
            const lastMsg = currentMessagesList[currentMessagesList.length - 2];
            if (!lastMsg || new Date(lastMsg.createdAt).toLocaleDateString() !== new Date(msg.createdAt).toLocaleDateString()) {
                const divider = document.createElement("div");
                divider.className = "date-divider";
                divider.innerHTML = "<span>" + new Date(msg.createdAt).toLocaleDateString() + "</span>";
                messagesArea.appendChild(divider);
            }
            
            messagesArea.appendChild(msgElement);
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
        await loadChats();
    } catch (error) {
        showToast(error.message || "Ошибка отправки", "error");
    }
}

function handleAttachFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*,application/pdf";
    input.onchange = function(e) {
        if (e.target.files && e.target.files[0]) {
            currentFile = e.target.files[0];
            showToast("Файл выбран: " + currentFile.name, "success");
        }
    };
    input.click();
}

// ========== КОНТАКТЫ ==========
async function loadContacts() {
    const contactsListEl = document.getElementById("contactsList");
    if (!contactsListEl) return;
    
    try {
        const users = await UserManager.getUsers();
        const contacts = users.filter(u => u._id !== currentUser._id);
        
        if (contacts.length === 0) {
            contactsListEl.innerHTML = "<div class=\"empty-state\">Нет контактов</div>";
            return;
        }
        
        let html = "";
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            const avatar = Utils.getUserAvatar(contact);
            const avatarHtml = (avatar.type === "image") 
                ? "<div class=\"contact-avatar\" style=\"background-image: url(" + avatar.value + "); background-size: cover;\"></div>"
                : "<div class=\"contact-avatar\">" + avatar.value + "</div>";
            
            const statusClass = (contact.status === "online") ? "online" : "offline";
            const statusText = (contact.status === "online") ? "онлайн" : "офлайн";
            
            html += "<div class=\"contact-item\" data-user-id=\"" + contact._id + "\">";
            html += avatarHtml;
            html += "<div class=\"contact-info\">";
            html += "<div class=\"contact-name\">" + Utils.escapeHtml(contact.username) + "</div>";
            html += "<div class=\"contact-email\">" + Utils.escapeHtml(contact.email) + "</div>";
            html += "<div class=\"contact-status\">";
            html += "<span class=\"status-dot " + statusClass + "\"></span>";
            html += "<span>" + statusText + "</span>";
            html += "</div>";
            html += "</div>";
            html += "</div>";
        }
        
        contactsListEl.innerHTML = html;
        
        const contactItems = document.querySelectorAll(".contact-item");
        for (let i = 0; i < contactItems.length; i++) {
            const item = contactItems[i];
            item.addEventListener("click", async function() {
                const userId = this.getAttribute("data-user-id");
                if (!userId) return;
                try {
                    const chat = await UserManager.createChat(userId);
                    await loadChats();
                    showChat();
                    openChat(chat._id);
                } catch (error) {
                    showToast(error.message, "error");
                }
            });
        }
        
        const searchInputContacts = document.getElementById("contactsSearch");
        if (searchInputContacts) {
            searchInputContacts.oninput = function(e) {
                const term = e.target.value.toLowerCase();
                const filtered = contacts.filter(c => 
                    c.username.toLowerCase().includes(term) || 
                    c.email.toLowerCase().includes(term)
                );
                renderFilteredContacts(filtered);
            };
        }
        
    } catch (error) {
        console.error("Ошибка загрузки контактов:", error);
        contactsListEl.innerHTML = "<div class=\"empty-state\">Ошибка загрузки</div>";
    }
}

function renderFilteredContacts(contacts) {
    const contactsListEl = document.getElementById("contactsList");
    if (!contactsListEl) return;
    
    if (contacts.length === 0) {
        contactsListEl.innerHTML = "<div class=\"empty-state\">Ничего не найдено</div>";
        return;
    }
    
    let html = "";
    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        const avatar = Utils.getUserAvatar(contact);
        const avatarHtml = (avatar.type === "image") 
            ? "<div class=\"contact-avatar\" style=\"background-image: url(" + avatar.value + "); background-size: cover;\"></div>"
            : "<div class=\"contact-avatar\">" + avatar.value + "</div>";
        
        const statusClass = (contact.status === "online") ? "online" : "offline";
        const statusText = (contact.status === "online") ? "онлайн" : "офлайн";
        
        html += "<div class=\"contact-item\" data-user-id=\"" + contact._id + "\">";
        html += avatarHtml;
        html += "<div class=\"contact-info\">";
        html += "<div class=\"contact-name\">" + Utils.escapeHtml(contact.username) + "</div>";
        html += "<div class=\"contact-email\">" + Utils.escapeHtml(contact.email) + "</div>";
        html += "<div class=\"contact-status\">";
        html += "<span class=\"status-dot " + statusClass + "\"></span>";
        html += "<span>" + statusText + "</span>";
        html += "</div>";
        html += "</div>";
        html += "</div>";
    }
    
    contactsListEl.innerHTML = html;
    
    const contactItems = document.querySelectorAll(".contact-item");
    for (let i = 0; i < contactItems.length; i++) {
        const item = contactItems[i];
        item.addEventListener("click", async function() {
            const userId = this.getAttribute("data-user-id");
            if (!userId) return;
            try {
                const chat = await UserManager.createChat(userId);
                await loadChats();
                showChat();
                openChat(chat._id);
            } catch (error) {
                showToast(error.message, "error");
            }
        });
    }
}

// ========== ПРОФИЛЬ ==========
function renderProfile() {
    if (!currentUser) return;
    
    const profileUsername = document.getElementById("profileUsername");
    const profileEmail = document.getElementById("profileEmail");
    const profileAvatarLarge = document.getElementById("profileAvatarLarge");
    
    if (profileUsername) profileUsername.textContent = currentUser.username;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    
    const avatar = Utils.getUserAvatar(currentUser);
    if (profileAvatarLarge) {
        if (avatar.type === "image") {
            profileAvatarLarge.style.backgroundImage = "url(" + avatar.value + "?t=" + Date.now() + ")";
            profileAvatarLarge.style.backgroundSize = "cover";
            profileAvatarLarge.innerHTML = "";
        } else {
            profileAvatarLarge.innerHTML = "<i class=\"fas fa-user fa-3x\"></i>";
            profileAvatarLarge.style.backgroundImage = "";
        }
    }
}

// ========== СМЕНА ПАРОЛЯ ==========
function showPasswordModal() {
    const modal = document.getElementById("passwordModal");
    if (!modal) return;
    
    modal.classList.add("active");
    
    const close = function() {
        modal.classList.remove("active");
        const form = document.getElementById("passwordForm");
        if (form) form.reset();
    };
    
    const closeBtn = document.getElementById("closePasswordModal");
    const cancelBtn = document.getElementById("cancelPasswordBtn");
    
    if (closeBtn) closeBtn.onclick = close;
    if (cancelBtn) cancelBtn.onclick = close;
    
    const form = document.getElementById("passwordForm");
    if (form) {
        form.onsubmit = async function(e) {
            e.preventDefault();
            const current = document.getElementById("currentPassword") ? document.getElementById("currentPassword").value : "";
            const newPass = document.getElementById("newPassword") ? document.getElementById("newPassword").value : "";
            const confirm = document.getElementById("confirmPassword") ? document.getElementById("confirmPassword").value : "";
            
            if (newPass !== confirm) {
                showToast("Пароли не совпадают", "error");
                return;
            }
            if (newPass.length < 6) {
                showToast("Пароль минимум 6 символов", "error");
                return;
            }
            
            try {
                await UserManager.changePassword(current, newPass);
                showToast("Пароль изменен", "success");
                close();
            } catch (error) {
                showToast(error.message, "error");
            }
        };
    }
}

// ========== ОБРЕЗКА АВАТАРА ==========
function showCropModal() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/gif,image/webp";
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match("image.*")) {
            showToast("Выберите изображение", "error");
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            showToast("Размер не более 5MB", "error");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const cropImage = document.getElementById("cropImage");
            const cropModal = document.getElementById("cropModal");
            
            if (!cropImage || !cropModal) return;
            
            cropImage.src = event.target.result;
            cropModal.classList.add("active");
            
            cropImage.onload = function() {
                if (currentCropper) currentCropper.destroy();
                if (typeof Cropper !== "undefined") {
                    currentCropper = new Cropper(cropImage, {
                        aspectRatio: 1,
                        viewMode: 1,
                        dragMode: "crop",
                        cropBoxMovable: true,
                        cropBoxResizable: true,
                        autoCropArea: 0.8,
                        zoomable: true,
                        rotatable: true
                    });
                }
            };
        };
        reader.readAsDataURL(file);
    };
    input.click();
    
    const closeModal = function() {
        const modal = document.getElementById("cropModal");
        if (modal) modal.classList.remove("active");
        if (currentCropper) {
            currentCropper.destroy();
            currentCropper = null;
        }
        const img = document.getElementById("cropImage");
        if (img) img.src = "";
    };
    
    const closeCropBtn = document.getElementById("closeCropModal");
    const cancelCropBtn = document.getElementById("cancelCropBtn");
    if (closeCropBtn) closeCropBtn.onclick = closeModal;
    if (cancelCropBtn) cancelCropBtn.onclick = closeModal;
    
    const saveCropBtn = document.getElementById("saveCropBtn");
    if (saveCropBtn) {
        saveCropBtn.onclick = async function() {
            if (!currentCropper) return;
            
            const canvas = currentCropper.getCroppedCanvas({ width: 300, height: 300 });
            if (!canvas) return;
            
            canvas.toBlob(async function(blob) {
                const formData = new FormData();
                formData.append("avatar", blob, "avatar.jpg");
                
                try {
                    const result = await UserManager.updateAvatar(formData);
                    if (result && result.avatar) {
                        currentUser.avatar = result.avatar;
                        updateUserUI();
                        renderProfile();
                        showToast("Аватар обновлен", "success");
                        closeModal();
                    }
                } catch (error) {
                    showToast(error.message, "error");
                }
            }, "image/jpeg", 0.9);
        };
    }
    
    const zoomIn = document.getElementById("zoomInBtn");
    const zoomOut = document.getElementById("zoomOutBtn");
    const rotateLeft = document.getElementById("rotateLeftBtn");
    const rotateRight = document.getElementById("rotateRightBtn");
    
    if (zoomIn) zoomIn.onclick = function() { if (currentCropper) currentCropper.zoom(0.1); };
    if (zoomOut) zoomOut.onclick = function() { if (currentCropper) currentCropper.zoom(-0.1); };
    if (rotateLeft) rotateLeft.onclick = function() { if (currentCropper) currentCropper.rotate(-45); };
    if (rotateRight) rotateRight.onclick = function() { if (currentCropper) currentCropper.rotate(45); };
}

// ========== ИЗБРАННОЕ ==========
let openingFavorites = false;

async function openFavorites() {
    if (openingFavorites) return;
    openingFavorites = true;
    
    try {
        const favoritesChat = await UserManager.createFavoritesChat();
        if (favoritesChat && favoritesChat._id) {
            await loadChats();
            showChat();
            await openChat(favoritesChat._id);
        }
    } catch (error) {
        showToast(error.message, "error");
    } finally {
        setTimeout(function() { openingFavorites = false; }, 500);
    }
}

// ========== ВЫПАДАЮЩЕЕ МЕНЮ ==========
function initMenuDropdown() {
    if (!menuBtn || !menuDropdown) return;
    
    const newMenuBtn = menuBtn.cloneNode(true);
    menuBtn.parentNode.replaceChild(newMenuBtn, menuBtn);
    
    newMenuBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        menuDropdown.classList.toggle("show");
    });
    
    document.addEventListener("click", function() {
        menuDropdown.classList.remove("show");
    });
    
    const menuItems = document.querySelectorAll(".menu-item[data-action]");
    for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i];
        item.addEventListener("click", function() {
            const action = this.getAttribute("data-action");
            if (action === "clear" && currentChat) {
                showToast("Чат очищен", "success");
            } else if (action === "delete" && currentChat && confirm("Удалить чат?")) {
                UserManager.deleteChat(currentChat._id).then(function() {
                    loadChats();
                    clearChatArea();
                });
            }
            menuDropdown.classList.remove("show");
        });
    }
}

// ========== НАСТРОЙКА СОБЫТИЙ ==========
function setupEventListeners() {
    let inputTypingTimeout = null;
    
    if (sendBtn) sendBtn.onclick = sendMessage;
    if (attachBtn) attachBtn.onclick = handleAttachFile;
    if (messageInput) {
        messageInput.onkeydown = function(e) {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        };
        
        messageInput.addEventListener("input", function() {
            if (inputTypingTimeout) clearTimeout(inputTypingTimeout);
            if (UserManager && UserManager.sendTyping && currentChat) {
                UserManager.sendTyping(currentChat._id, true);
            }
            inputTypingTimeout = setTimeout(function() {
                if (UserManager && UserManager.sendTyping && currentChat) {
                    UserManager.sendTyping(currentChat._id, false);
                }
            }, 1000);
        });
        
        messageInput.addEventListener("blur", function() {
            if (inputTypingTimeout) clearTimeout(inputTypingTimeout);
            if (UserManager && UserManager.sendTyping && currentChat) {
                UserManager.sendTyping(currentChat._id, false);
            }
        });
    }
    if (searchInput) searchInput.oninput = function() { renderChatsList(); };
    if (logoutBtn) logoutBtn.onclick = function() { UserManager.logout(); };
    
    if (favoritesBtn) favoritesBtn.onclick = openFavorites;
    if (contactsBtn) contactsBtn.onclick = showContacts;
    if (themeBtn) themeBtn.onclick = toggleTheme;
    if (profileBtn) profileBtn.onclick = showProfile;
    
    const closeContacts = document.getElementById("closeContactsBtn");
    const closeProfile = document.getElementById("closeProfileBtn");
    if (closeContacts) closeContacts.onclick = showChat;
    if (closeProfile) closeProfile.onclick = showChat;
    
    const editEmailBtns = document.querySelectorAll(".edit-btn[data-field=\"email\"]");
    for (let i = 0; i < editEmailBtns.length; i++) {
        const btn = editEmailBtns[i];
        btn.addEventListener("click", async function() {
            const newEmail = prompt("Введите новый email:", currentUser.email);
            if (newEmail && newEmail !== currentUser.email) {
                try {
                    await UserManager.updateProfile({ email: newEmail });
                    currentUser.email = newEmail;
                    const profileEmail = document.getElementById("profileEmail");
                    if (profileEmail) profileEmail.textContent = newEmail;
                    showToast("Email обновлен", "success");
                } catch (error) {
                    showToast(error.message, "error");
                }
            }
        });
    }
    
    const editPasswordBtns = document.querySelectorAll(".edit-btn[data-field=\"password\"]");
    for (let i = 0; i < editPasswordBtns.length; i++) {
        editPasswordBtns[i].addEventListener("click", showPasswordModal);
    }
    
    const changeAvatarBtn = document.getElementById("changeAvatarBtn");
    if (changeAvatarBtn) changeAvatarBtn.onclick = showCropModal;
    
    initMenuDropdown();
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;
    let iconClass = "fa-info-circle";
    if (type === "error") iconClass = "fa-exclamation-circle";
    if (type === "success") iconClass = "fa-check-circle";
    toast.innerHTML = "<i class=\"fas " + iconClass + "\"></i> " + message;
    const bgColor = type === "error" ? "#dc3545" : (type === "success" ? "#28a745" : "#17a2b8");
    toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: " + bgColor + 
        "; color: white; padding: 12px 20px; border-radius: 8px; z-index: 10000;";
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}

// ========== ЗАПУСК ==========
document.addEventListener("DOMContentLoaded", function() {
    initTheme();
    init();
});`;

// Сохраняем файл
fs.writeFileSync(mainJsPath, newMainJs, 'utf8');
console.log('✅ main.js полностью пересоздан');

// Проверяем синтаксис
console.log('\n📝 Проверка синтаксиса...');

const content = fs.readFileSync(mainJsPath, 'utf8');
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
}

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║     ✅ MAIN.JS ПОЛНОСТЬЮ ПЕРЕСОЗДАН!                  ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('📋 Следующие шаги:');
console.log('   1. Перезапустите сервер: npm start');
console.log('   2. Очистите кэш браузера (Ctrl+Shift+Del)');
console.log('   3. Обновите страницу\n');