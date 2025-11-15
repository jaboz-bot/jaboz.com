// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const youtubePlayer = document.getElementById('youtubePlayer');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const searchPopup = document.getElementById('searchPopup');
const searchResults = document.getElementById('searchResults');
const closePopup = document.getElementById('closePopup');

// Audio Context for microphone volume control
let audioContext = null;
let microphone = null;
let gainNode = null;
let isMicrophoneActive = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupSearch();
    setupVolumeControl();
    setupPopup();
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

// Setup Popup
function setupPopup() {
    closePopup.addEventListener('click', () => {
        closeSearchPopup();
    });
    
    // Close popup when clicking outside
    searchPopup.addEventListener('click', (e) => {
        if (e.target === searchPopup) {
            closeSearchPopup();
        }
    });
    
    // Close popup with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchPopup.classList.contains('active')) {
            closeSearchPopup();
        }
    });
}

// Open Search Popup
function openSearchPopup() {
    searchPopup.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close Search Popup
function closeSearchPopup() {
    searchPopup.classList.remove('active');
    document.body.style.overflow = '';
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

    // Mở popup và tìm kiếm
    openSearchPopup();
    searchResults.innerHTML = '<div class="loading-spinner">Đang tìm kiếm...</div>';
    
    try {
        const videos = await searchYouTubeVideos(query);
        displaySearchResults(videos);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<div class="loading-spinner" style="color: #f44336;">Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.</div>';
    }
}

// Search YouTube Videos (không cần API)
async function searchYouTubeVideos(query) {
    const encodedQuery = encodeURIComponent(query);
    
    // Sử dụng CORS proxy hoặc service công khai để lấy kết quả
    // Có thể sử dụng các service như:
    // - allorigins.win
    // - corsproxy.io
    // - hoặc parse từ YouTube search page
    
    try {
        // Cách 1: Sử dụng CORS proxy để fetch YouTube search page
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/results?search_query=${encodedQuery}`)}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        const html = data.contents;
        
        // Parse HTML để lấy thông tin video
        return parseYouTubeSearchResults(html);
    } catch (error) {
        console.error('Search error:', error);
        // Fallback: Sử dụng cách khác hoặc trả về empty array
        return [];
    }
}

// Parse YouTube Search Results from HTML
function parseYouTubeSearchResults(html) {
    const videos = [];
    
    try {
        // Tạo DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Tìm tất cả các video item trong kết quả tìm kiếm
        // YouTube sử dụng các class/id đặc biệt, cần parse từ ytInitialData
        const scripts = doc.querySelectorAll('script');
        let ytInitialData = null;
        
        for (const script of scripts) {
            const text = script.textContent;
            if (text.includes('var ytInitialData')) {
                // Extract ytInitialData - cải thiện regex để parse tốt hơn
                const match = text.match(/var ytInitialData = ({.+?});/s);
                if (match) {
                    try {
                        ytInitialData = JSON.parse(match[1]);
                        break;
                    } catch (e) {
                        // Try alternative: tìm từ window.ytInitialData
                        const altMatch = text.match(/window\["ytInitialData"\] = ({.+?});/s);
                        if (altMatch) {
                            try {
                                ytInitialData = JSON.parse(altMatch[1]);
                                break;
                            } catch (e2) {
                                // Continue to next script
                            }
                        }
                    }
                }
            }
        }
        
        if (ytInitialData) {
            // Parse từ ytInitialData structure
            const contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents;
            
            if (contents) {
                for (const item of contents) {
                    if (item.videoRenderer) {
                        const video = item.videoRenderer;
                        const videoId = video.videoId;
                        const title = video.title?.runs?.[0]?.text || video.title?.simpleText || 'Không có tiêu đề';
                        const channel = video.ownerText?.runs?.[0]?.text || video.channelName?.simpleText || 'Unknown';
                        // Lấy thumbnail tốt nhất (thường là thumbnail cuối cùng có chất lượng cao nhất)
                        let thumbnail = '';
                        if (video.thumbnail?.thumbnails && video.thumbnail.thumbnails.length > 0) {
                            thumbnail = video.thumbnail.thumbnails[video.thumbnail.thumbnails.length - 1]?.url || 
                                       video.thumbnail.thumbnails[0]?.url || '';
                        }
                        // Fallback: sử dụng YouTube thumbnail API
                        if (!thumbnail && videoId) {
                            thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                        }
                        const duration = video.lengthText?.simpleText || video.lengthText?.runs?.[0]?.text || '';
                        
                        if (videoId) {
                            videos.push({
                                id: videoId,
                                title: title,
                                channel: channel,
                                thumbnail: thumbnail,
                                duration: duration
                            });
                        }
                    }
                }
            }
        }
        
        // Fallback: Parse từ HTML links nếu không có ytInitialData
        if (videos.length === 0) {
            const links = doc.querySelectorAll('a[href*="/watch?v="]');
            const seenIds = new Set();
            
            for (const link of links) {
                const href = link.getAttribute('href');
                const match = href.match(/[?&]v=([^&]+)/);
                if (match && match[1] && !seenIds.has(match[1])) {
                    seenIds.add(match[1]);
                    const title = link.textContent.trim() || 'Không có tiêu đề';
                    const thumbnail = `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`;
                    
                    videos.push({
                        id: match[1],
                        title: title,
                        channel: 'Unknown',
                        thumbnail: thumbnail,
                        duration: ''
                    });
                    
                    if (videos.length >= 20) break; // Giới hạn 20 kết quả
                }
            }
        }
    } catch (error) {
        console.error('Parse error:', error);
    }
    
    return videos.slice(0, 20); // Trả về tối đa 20 video
}

// Display Search Results
function displaySearchResults(videos) {
    if (videos.length === 0) {
        searchResults.innerHTML = '<div class="loading-spinner">Không tìm thấy kết quả nào.</div>';
        return;
    }
    
    searchResults.innerHTML = videos.map(video => `
        <div class="video-item" data-video-id="${video.id}">
            <img src="${video.thumbnail}" alt="${video.title}" class="video-thumbnail" onerror="this.src='https://via.placeholder.com/160x90?text=No+Image'">
            <div class="video-info">
                <div class="video-title">${video.title}</div>
                <div class="video-channel">${video.channel}</div>
                ${video.duration ? `<div class="video-duration">${video.duration}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    // Add click event listeners
    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', () => {
            const videoId = item.getAttribute('data-video-id');
            loadYouTubeVideo(videoId);
            closeSearchPopup();
            showNotification('Đã load video!', 'success');
        });
    });
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

