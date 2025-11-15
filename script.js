// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const youtubePlayer = document.getElementById('youtubePlayer');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

// Audio Context for microphone volume control
let audioContext = null;
let microphone = null;
let gainNode = null;
let isMicrophoneActive = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setupVolumeControl();
    requestMicrophonePermission();
});

// Setup Search Functionality
function setupSearch() {
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
}

// Perform YouTube Search
async function performSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        showNotification('Vui lòng nhập từ khóa tìm kiếm', 'warning');
        return;
    }

    // Kiểm tra xem có phải là URL hoặc Video ID không
    const videoId = parseVideoIdFromUrl(query);
    if (videoId) {
        loadYouTubeVideo(videoId);
        showNotification('Đã load video!', 'success');
        return;
    }

    showNotification('Đang tìm kiếm...', 'info');
    
    try {
        // Mở trang tìm kiếm YouTube trong tab mới
        // User có thể chọn video và copy URL/ID
        const encodedQuery = encodeURIComponent(query);
        const searchUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;
        
        // Mở trong tab mới
        window.open(searchUrl, '_blank');
        
        showNotification('Đã mở trang tìm kiếm. Vui lòng chọn video và dán URL/ID vào đây', 'info');
        
        // Hướng dẫn user
        searchInput.placeholder = 'Dán URL hoặc Video ID từ YouTube...';
        searchInput.value = '';
    } catch (error) {
        console.error('Search error:', error);
        showNotification('Có lỗi xảy ra khi tìm kiếm', 'error');
    }
}

// Parse Video ID from YouTube URL or direct ID
function parseVideoIdFromUrl(input) {
    if (!input) return null;
    
    // Direct video ID (11 characters)
    if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
        return input;
    }
    
    // YouTube URL patterns
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
    ];
    
    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match && match[1] && match[1].length === 11) {
            return match[1];
        }
    }
    
    return null;
}


// Load YouTube Video
function loadYouTubeVideo(videoId) {
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&modestbranding=1`;
    youtubePlayer.src = embedUrl;
}

// Setup Volume Control
function setupVolumeControl() {
    volumeSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        volumeValue.textContent = `${value}%`;
        adjustMicrophoneVolume(value);
    });
}

// Adjust Microphone Volume
function adjustMicrophoneVolume(volumePercent) {
    if (!isMicrophoneActive || !gainNode) {
        return;
    }
    
    // Convert percentage (0-100) to gain value (0-1)
    const gainValue = volumePercent / 100;
    gainNode.gain.value = gainValue;
}

// Request Microphone Permission
async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Initialize Audio Context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        microphone = audioContext.createMediaStreamSource(stream);
        gainNode = audioContext.createGain();
        
        // Connect microphone to gain node
        microphone.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set initial volume
        gainNode.gain.value = 0.5; // 50%
        
        isMicrophoneActive = true;
        showNotification('Microphone đã được kích hoạt', 'success');
    } catch (error) {
        console.error('Microphone permission error:', error);
        showNotification('Không thể truy cập microphone. Vui lòng cấp quyền.', 'warning');
        isMicrophoneActive = false;
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    // Tạo notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Auto-detect video ID when user pastes URL
searchInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        const input = searchInput.value.trim();
        const videoId = parseVideoIdFromUrl(input);
        
        if (videoId) {
            loadYouTubeVideo(videoId);
            showNotification('Đã load video!', 'success');
        }
    }, 100);
});

// Also check on input change
searchInput.addEventListener('input', () => {
    const input = searchInput.value.trim();
    const videoId = parseVideoIdFromUrl(input);
    
    if (videoId && input.length > 10) {
        // Auto-load if it looks like a complete URL or ID
        loadYouTubeVideo(videoId);
    }
});

