const socket = io();

let currentRoom = null;
let currentUsername = null;

// DOM Elements
const loginSection = document.getElementById('login-section');
const chatSection = document.getElementById('chat-section');
const joinForm = document.getElementById('join-form');
const messageForm = document.getElementById('message-form');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const roomNameSpan = document.getElementById('room-name');
const userCountSpan = document.getElementById('user-count');
const leaveRoomBtn = document.getElementById('leave-room');
const statusDiv = document.getElementById('status');

// Join room
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const roomId = document.getElementById('room-id').value.trim().toLowerCase();

    if (!username || !roomId) {
        showStatus('Vui lòng nhập đầy đủ thông tin!', 'error');
        return;
    }

    currentUsername = username;
    currentRoom = roomId;

    socket.emit('join-room', { roomId, username });
    showStatus('Đang kết nối...', 'info');
});

// Send message
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();

    if (!message) return;

    socket.emit('send-message', { message });
    messageInput.value = '';
    messageInput.focus();
});

// Leave room
leaveRoomBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn rời phòng?')) {
        socket.disconnect();
        socket.connect();
        showChatSection(false);
        currentRoom = null;
        currentUsername = null;
        messagesDiv.innerHTML = '';
        showStatus('Đã rời phòng', 'info');
    }
});

// Socket events
socket.on('connect', () => {
    console.log('Connected to server');
    if (currentRoom && currentUsername) {
        socket.emit('join-room', { roomId: currentRoom, username: currentUsername });
    }
});

socket.on('disconnect', () => {
    showStatus('Mất kết nối. Đang thử kết nối lại...', 'error');
});

socket.on('room-joined', (data) => {
    showChatSection(true);
    roomNameSpan.textContent = `Phòng: ${data.roomId}`;
    userCountSpan.textContent = `${data.userCount} người`;
    
    // Load previous messages
    messagesDiv.innerHTML = '';
    data.messages.forEach(msg => {
        addMessage(msg);
    });

    showStatus(`Đã tham gia phòng ${data.roomId}!`, 'success');
    messageInput.focus();
});

socket.on('new-message', (message) => {
    addMessage(message);
    // Auto scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

socket.on('user-joined', (data) => {
    addSystemMessage(`${data.username} đã tham gia phòng (${data.userCount} người)`);
    userCountSpan.textContent = `${data.userCount} người`;
});

socket.on('user-left', (data) => {
    addSystemMessage(`${data.username} đã rời phòng (${data.userCount} người)`);
    userCountSpan.textContent = `${data.userCount} người`;
});

// Helper functions
function showChatSection(show) {
    if (show) {
        loginSection.classList.add('hidden');
        chatSection.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
        chatSection.classList.add('hidden');
    }
}

function addMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const isOwn = message.username === currentUsername;
    if (isOwn) {
        messageDiv.classList.add('message-own');
    }

    const time = new Date(message.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-username">${escapeHtml(message.username)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(message.message)}</div>
    `;

    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <div class="message-content" style="background: #fff3cd; color: #856404; text-align: center; font-style: italic;">
            ${escapeHtml(text)}
        </div>
    `;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';

    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Enter key to send (Shift+Enter for new line)
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
});

