// Hàm tìm kiếm trên YouTube (không dùng API - web scraping)
async function searchYouTube(query) {
    if (!query || query.length < 2) {
        return [];
    }
    
    const searchQuery = encodeURIComponent(query);
    
    // Tạo AbortController với timeout (dài hơn cho mobile)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const timeout = isMobile ? 8000 : 5000;
    
    const createFetchWithTimeout = (url, timeoutMs = timeout) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        return fetch(url, { signal: controller.signal })
            .then(response => {
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error('Network response was not ok');
                return response;
            })
            .catch(err => {
                clearTimeout(timeoutId);
                throw err;
            });
    };
    
    // Thử nhiều proxy cùng lúc
    const proxyPromises = [
        createFetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/results?search_query=${searchQuery}`)}`)
            .then(r => r.json())
            .then(d => d.contents || '')
            .catch(() => ''),
        createFetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/results?search_query=${searchQuery}`)}`)
            .then(r => r.text())
            .catch(() => ''),
        createFetchWithTimeout(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.youtube.com/results?search_query=${searchQuery}`)}`)
            .then(r => r.text())
            .catch(() => '')
    ];
    
    try {
        let html = '';
        try {
            html = await Promise.race(proxyPromises);
        } catch (raceError) {
            const settled = await Promise.allSettled(proxyPromises);
            for (const result of settled) {
                if (result.status === 'fulfilled' && result.value) {
                    html = result.value;
                    break;
                }
            }
        }
        
        if (!html || html.trim() === '') {
            return [];
        }
        
        const results = [];
        const seenIds = new Set();
        
        // Parse với regex - tìm pattern videoRenderer
        const videoPattern = /"videoRenderer":\{[^}]*"videoId":"([^"]{11})"[^}]*"title":\{"runs":\[\{"text":"([^"]+)"\}[^}]*"ownerText":\{"runs":\[\{"text":"([^"]+)"\}/g;
        
        let match;
        let count = 0;
        while ((match = videoPattern.exec(html)) !== null && count < 10) {
            const videoId = match[1];
            if (!seenIds.has(videoId)) {
                seenIds.add(videoId);
                const title = match[2].replace(/\\u([0-9a-fA-F]{4})/g, (m, code) => String.fromCharCode(parseInt(code, 16)));
                const artist = match[3] ? match[3].replace(/\\u([0-9a-fA-F]{4})/g, (m, code) => String.fromCharCode(parseInt(code, 16))) : "YouTube";
                results.push({ title, artist, videoId });
                count++;
            }
        }
        
        // Fallback: pattern đơn giản hơn
        if (results.length === 0) {
            const videoIdRegex = /"videoId":"([^"]{11})"/g;
            const titleRegex = /"title":\{"runs":\[\{"text":"([^"]+)"\}/g;
            const ownerRegex = /"ownerText":\{"runs":\[\{"text":"([^"]+)"\}/g;
            
            const videoIds = [];
            const titles = [];
            const owners = [];
            
            let vidMatch;
            while ((vidMatch = videoIdRegex.exec(html)) !== null && videoIds.length < 15) {
                if (!seenIds.has(vidMatch[1])) {
                    seenIds.add(vidMatch[1]);
                    videoIds.push(vidMatch[1]);
                }
            }
            
            let titleMatch;
            while ((titleMatch = titleRegex.exec(html)) !== null && titles.length < videoIds.length) {
                titles.push(titleMatch[1].replace(/\\u([0-9a-fA-F]{4})/g, (m, code) => String.fromCharCode(parseInt(code, 16))));
            }
            
            let ownerMatch;
            while ((ownerMatch = ownerRegex.exec(html)) !== null && owners.length < videoIds.length) {
                owners.push(ownerMatch[1].replace(/\\u([0-9a-fA-F]{4})/g, (m, code) => String.fromCharCode(parseInt(code, 16))));
            }
            
            for (let i = 0; i < videoIds.length && i < 10; i++) {
                results.push({
                    title: titles[i] || `Bài hát ${i + 1}`,
                    artist: owners[i] || "YouTube",
                    videoId: videoIds[i]
                });
            }
        }
        
        console.log('YouTube search completed. Found', results.length, 'results');
        if (results.length > 0) {
            console.log('First result:', results[0]);
        }
        
        return results;
    } catch (error) {
        console.error('Lỗi tìm kiếm YouTube:', error);
        return [];
    }
}

// Debounce timer cho tìm kiếm tự động
let searchTimeout = null;
let lastSearchQuery = '';
let searchCache = {};

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        searchSong();
    }
}

function handleSearchInput(event) {
    const query = event.target.value.trim();
    const searchResults = document.getElementById('searchResults');
    
    // Xóa timeout trước đó
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    // Nếu ô input trống, ẩn kết quả
    if (query === '') {
        searchResults.classList.remove('active');
        lastSearchQuery = '';
        return;
    }
    
    // Kiểm tra cache trước
    const cacheKey = query.toLowerCase();
    if (searchCache[cacheKey]) {
        displayResults(searchCache[cacheKey]);
        return;
    }
    
    // Hiển thị loading
    searchResults.innerHTML = '<div class="no-results"><span class="loading-spinner"></span>Đang tìm kiếm...</div>';
    searchResults.classList.add('active');
    
    // Tìm kiếm với debounce
    searchTimeout = setTimeout(() => {
        if (query !== lastSearchQuery && query.length >= 2) {
            lastSearchQuery = query;
            searchSong();
        }
    }, 500);
}

function displayResults(results) {
    const searchResults = document.getElementById('searchResults');
    
    console.log('Display results:', results.length, 'items');
    
    if (results.length > 0) {
        searchResults.innerHTML = results.map(song => {
            const thumbnailUrl = `https://img.youtube.com/vi/${song.videoId}/maxresdefault.jpg`;
            const safeTitle = song.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeArtist = song.artist.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            return `
                <div class="song-item" onclick="playVideo('${song.videoId}', '${safeTitle}', '${safeArtist}')">
                    <img src="${thumbnailUrl}" alt="${song.title}" class="song-thumbnail" loading="lazy" onerror="this.style.display='none'">
                    <div class="song-info">
                        <div class="song-title">${song.title}</div>
                        <div class="song-artist">${song.artist}</div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        const query = document.getElementById('searchInput').value.trim();
        searchResults.innerHTML = `
            <div class="no-results">
                Không tìm thấy kết quả cho "${query}".
            </div>
        `;
    }
    
    // Đảm bảo hiển thị trên mobile
    searchResults.style.display = 'block';
    searchResults.classList.add('active');
    
    // Force reflow để đảm bảo hiển thị
    searchResults.offsetHeight;
    
    console.log('Search results displayed, active class:', searchResults.classList.contains('active'));
}

async function searchSong() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const query = searchInput.value.trim();
    console.log('Search song called with query:', query);
    if (query === '' || query.length < 2) {
        searchResults.classList.remove('active');
        return;
    }
    // Kiểm tra cache
    const cacheKey = query.toLowerCase();
    if (searchCache[cacheKey]) {
        console.log('Using cached results');
        displayResults(searchCache[cacheKey]);
        return;
    }
    try {
        console.log('Searching YouTube for:', query);
        const results = await searchYouTube(query);
        console.log('Search completed, found:', results.length, 'results');
        
        // Lưu vào cache
        if (results.length > 0) {
            searchCache[cacheKey] = results;
            // Giới hạn cache tối đa 50 items
            const cacheKeys = Object.keys(searchCache);
            if (cacheKeys.length > 50) {
                delete searchCache[cacheKeys[0]];
            }
        }
        displayResults(results);
    } catch (error) {
        console.error('Lỗi trong searchSong:', error);
        searchResults.innerHTML = `
            <div class="no-results">
                Lỗi kết nối. Vui lòng kiểm tra kết nối mạng và thử lại.
            </div>
        `;
        searchResults.style.display = 'block';
        searchResults.classList.add('active');
    }
}

function playVideo(videoId, title, artist) {
    const videoPlayerContainer = document.getElementById('videoPlayerContainer');
    const youtubePlayer = document.getElementById('youtubePlayer');
    const tvContent = document.getElementById('tvContent');
    // Ẩn nội dung chính
    tvContent.style.display = 'none';
    
    // Hiển thị video player với enablejsapi để điều khiển volume
    youtubePlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`;
    videoPlayerContainer.classList.add('active');
}

function closeVideo() {
    const videoPlayerContainer = document.getElementById('videoPlayerContainer');
    const youtubePlayer = document.getElementById('youtubePlayer');
    const tvContent = document.getElementById('tvContent');
    // Dừng video
    youtubePlayer.src = '';
    
    // Ẩn video player
    videoPlayerContainer.classList.remove('active');
    
    // Hiển thị lại nội dung chính
    tvContent.style.display = 'block';
}

// Audio Control Functions
let audioContext = null;
let micStream = null;
let micGainNode = null;
let echoGainNode = null;
let ambientGainNode = null;
let micDestination = null;
let bassFilter = null;
let midFilter = null;
let trebleFilter = null;
let micSource = null;

function toggleAudioControl() {
    const popup = document.getElementById('audioControlPopup');
    popup.classList.toggle('active');
    
    if (popup.classList.contains('active')) {
        checkAudioDevices();
    }
    // Không dừng mic khi đóng popup - giữ kết nối
}

async function updateVolume(type, value) {
    const valueElement = document.getElementById(type + 'Value');
    if (valueElement) {
        valueElement.textContent = value + '%';
    }
    
    if (type === 'music') {
        // Điều chỉnh volume của YouTube video
        const youtubePlayer = document.getElementById('youtubePlayer');
        if (youtubePlayer && youtubePlayer.contentWindow) {
            try {
                // Gửi lệnh điều chỉnh volume qua postMessage
                youtubePlayer.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'setVolume',
                    args: [Math.round(value)]
                }), '*');
            } catch (e) {
                console.error('Lỗi điều chỉnh volume YouTube:', e);
            }
        }
    } else if (type === 'mic') {
        // Điều chỉnh volume của mic (setValueAtTime để giảm latency)
        if (micGainNode && audioContext) {
            micGainNode.gain.setValueAtTime(value / 100, audioContext.currentTime);
        } else {
            // Khởi tạo mic nếu chưa có
            initMic();
        }
    } else if (type === 'echo') {
        // Điều chỉnh echo effect
        if (echoGainNode && audioContext) {
            echoGainNode.gain.setValueAtTime(value / 100, audioContext.currentTime);
        } else {
            // Khởi tạo mic trước nếu chưa có
            if (!micStream) {
                await initMic();
            }
            // Khởi tạo echo nếu mic đã chạy
            if (micStream) {
                initEcho();
                if (echoGainNode && audioContext) {
                    echoGainNode.gain.setValueAtTime(value / 100, audioContext.currentTime);
                }
            }
        }
    } else if (type === 'ambient') {
        // Điều chỉnh ambient sound
        if (ambientGainNode && audioContext) {
            ambientGainNode.gain.setValueAtTime(value / 100, audioContext.currentTime);
        } else {
            // Khởi tạo mic trước nếu chưa có
            if (!micStream) {
                await initMic();
            }
            // Có thể thêm logic cho ambient sound ở đây
        }
    }
}

// Điều chỉnh EQ với slider duy nhất (Treble - Mid - Bass)
function updateEQSlider(value) {
    const sliderValue = parseFloat(value);
    let trebleValue, midValue, bassValue;
    
    if (sliderValue === 0) {
        // Ở giữa (Mid): tất cả bằng nhau = 0
        trebleValue = 0;
        midValue = 0;
        bassValue = 0;
    } else if (sliderValue < 0) {
        // Kéo về Bass (bên phải): tăng bass, giảm treble và mid
        bassValue = -sliderValue; // Tăng bass
        trebleValue = sliderValue; // Giảm treble
        midValue = sliderValue; // Giảm mid
    } else {
        // Kéo về Treble (bên trái): tăng treble, giảm bass và mid
        trebleValue = sliderValue; // Tăng treble
        bassValue = -sliderValue; // Giảm bass
        midValue = -sliderValue; // Giảm mid
    }
    
    // Cập nhật hiển thị
    const trebleValueElement = document.getElementById('micTrebleValue');
    const midValueElement = document.getElementById('micMidValue');
    const bassValueElement = document.getElementById('micBassValue');
    
    if (trebleValueElement) trebleValueElement.textContent = trebleValue.toFixed(1) + 'dB';
    if (midValueElement) midValueElement.textContent = midValue.toFixed(1) + 'dB';
    if (bassValueElement) bassValueElement.textContent = bassValue.toFixed(1) + 'dB';
    
    // Cập nhật audio filters
    if (!audioContext) {
        // Nếu chưa có audio context, khởi tạo mic
        if (micStream) {
            initMic();
            setTimeout(() => {
                updateEQSlider(value);
            }, 100);
        }
        return;
    }
    
    // Cập nhật filters
    if (trebleFilter) {
        trebleFilter.gain.setValueAtTime(trebleValue, audioContext.currentTime);
    }
    if (midFilter) {
        midFilter.gain.setValueAtTime(midValue, audioContext.currentTime);
    }
    if (bassFilter) {
        bassFilter.gain.setValueAtTime(bassValue, audioContext.currentTime);
    }
    
    // Nếu filters chưa có nhưng mic đã chạy, khởi tạo lại
    if (micStream && (!trebleFilter || !midFilter || !bassFilter)) {
        initMic();
        setTimeout(() => {
            updateEQSlider(value);
        }, 100);
    }
}

// Khởi tạo Audio Context với latency thấp
async function initAudioContext() {
    if (!audioContext) {
        // Tạo AudioContext với latency thấp nhất có thể
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        
        // Thử tạo với latency thấp
        try {
            audioContext = new AudioContextClass({
                latencyHint: 'interactive', // Latency thấp nhất
                sampleRate: 48000 // Sample rate cao hơn để giảm latency
            });
        } catch (e) {
            // Fallback nếu không hỗ trợ options
            audioContext = new AudioContextClass();
        }
        
        // Đặt buffer size nhỏ nhất có thể để giảm latency
        if (audioContext.createScriptProcessor) {
            // Sử dụng buffer size nhỏ (256 samples thay vì mặc định 4096)
            try {
                const testNode = audioContext.createScriptProcessor(256, 1, 1);
                testNode.disconnect();
            } catch (e) {
                console.log('Không thể đặt buffer size nhỏ');
            }
        }
    }
    // Resume context nếu bị suspended (do browser policy)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }
    return audioContext;
}

// Khởi tạo và bắt đầu mic
async function initMic() {
    try {
        // Dừng mic cũ nếu có
        if (micStream) {
            stopMic();
        }
        
        // Yêu cầu quyền truy cập microphone với latency thấp
        micStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: false, // Tắt echo cancellation để nghe được mic và giảm latency
                noiseSuppression: false, // Tắt để giảm latency
                autoGainControl: false, // Tắt để giảm latency
                latency: 0, // Yêu cầu latency thấp nhất
                sampleRate: 48000, // Sample rate cao để giảm latency
                channelCount: 1 // Mono để giảm xử lý
            } 
        });
        
        // Khởi tạo audio context
        const context = await initAudioContext();
        
        // Đảm bảo context đang chạy
        if (context.state !== 'running') {
            await context.resume();
        }
        
        // Tạo source từ mic stream
        micSource = context.createMediaStreamSource(micStream);
        
        // Tạo EQ filters: Bass, Mid, Treble
        // Bass filter (low shelf, 80Hz)
        bassFilter = context.createBiquadFilter();
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.setValueAtTime(80, context.currentTime);
        bassFilter.gain.setValueAtTime(0, context.currentTime);
        
        // Mid filter (peaking, 1000Hz)
        midFilter = context.createBiquadFilter();
        midFilter.type = 'peaking';
        midFilter.frequency.setValueAtTime(1000, context.currentTime);
        midFilter.Q.setValueAtTime(1, context.currentTime);
        midFilter.gain.setValueAtTime(0, context.currentTime);
        
        // Treble filter (high shelf, 5000Hz)
        trebleFilter = context.createBiquadFilter();
        trebleFilter.type = 'highshelf';
        trebleFilter.frequency.setValueAtTime(5000, context.currentTime);
        trebleFilter.gain.setValueAtTime(0, context.currentTime);
        
        // Tạo gain node cho mic volume với smoothing = 0 để giảm latency
        micGainNode = context.createGain();
        micGainNode.gain.setValueAtTime(0, context.currentTime); // Set ngay lập tức
        
        const micVolume = document.getElementById('micVolume');
        if (micVolume) {
            const volume = parseInt(micVolume.value) / 100;
            micGainNode.gain.setValueAtTime(volume, context.currentTime); // Set ngay, không smooth
        } else {
            micGainNode.gain.setValueAtTime(0.7, context.currentTime); // Mặc định 70%
        }
        
        // Kết nối: micSource -> bass -> mid -> treble -> gain -> destination
        micSource.connect(bassFilter);
        bassFilter.connect(midFilter);
        midFilter.connect(trebleFilter);
        trebleFilter.connect(micGainNode);
        micGainNode.connect(context.destination);
        
        micDestination = context.destination;
        
        // Tối ưu: Đảm bảo không có delay không cần thiết
        console.log('Audio context latency:', context.baseLatency, 's');
        console.log('Audio context output latency:', context.outputLatency, 's');
        console.log('Sample rate:', context.sampleRate, 'Hz');
        
        // Hiển thị thông tin latency
        const totalLatency = (context.baseLatency || 0) + (context.outputLatency || 0);
        console.log('Tổng latency ước tính:', (totalLatency * 1000).toFixed(2), 'ms');
        
        console.log('Mic đã được kích hoạt với latency thấp nhất có thể');
    } catch (error) {
        console.error('Lỗi khởi tạo mic:', error);
        const errorMsg = error.name === 'NotAllowedError' 
            ? 'Vui lòng cho phép truy cập microphone để sử dụng tính năng này.'
            : 'Không thể truy cập microphone. Vui lòng kiểm tra thiết bị và quyền truy cập.';
        alert(errorMsg);
    }
}

// Khởi tạo echo effect với delay tối thiểu
function initEcho() {
    if (!audioContext || !micStream || echoGainNode) return;
    
    try {
        const micSource = audioContext.createMediaStreamSource(micStream);
        
        // Tạo delay node cho echo với delay time ngắn hơn để giảm latency
        const delayNode = audioContext.createDelay(0.5); // Giảm max delay
        delayNode.delayTime.setValueAtTime(0.15, audioContext.currentTime); // 150ms delay thay vì 300ms
        
        // Tạo gain node cho echo
        echoGainNode = audioContext.createGain();
        const echoVolume = document.getElementById('echoVolume');
        if (echoVolume) {
            echoGainNode.gain.setValueAtTime(parseInt(echoVolume.value) / 100, audioContext.currentTime);
        } else {
            echoGainNode.gain.setValueAtTime(0.5, audioContext.currentTime); // Mặc định 50%
        }
        
        // Kết nối: mic -> delay -> echo gain -> destination
        micSource.connect(delayNode);
        delayNode.connect(echoGainNode);
        echoGainNode.connect(audioContext.destination);
        
        console.log('Echo effect đã được kích hoạt với delay 150ms');
    } catch (error) {
        console.error('Lỗi khởi tạo echo:', error);
    }
}

// Dừng mic
function stopMic() {
    if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
        micStream = null;
    }
    if (micSource) {
        micSource.disconnect();
        micSource = null;
    }
    if (bassFilter) {
        bassFilter.disconnect();
        bassFilter = null;
    }
    if (midFilter) {
        midFilter.disconnect();
        midFilter = null;
    }
    if (trebleFilter) {
        trebleFilter.disconnect();
        trebleFilter = null;
    }
    if (micGainNode) {
        micGainNode.disconnect();
        micGainNode = null;
    }
    if (echoGainNode) {
        echoGainNode.disconnect();
        echoGainNode = null;
    }
    if (ambientGainNode) {
        ambientGainNode.disconnect();
        ambientGainNode = null;
    }
    micDestination = null;
}

// Kiểm tra thiết bị audio input
async function checkAudioDevices() {
    try {
        let hasPermission = false;
        // Yêu cầu quyền truy cập microphone để có thể liệt kê thiết bị
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            hasPermission = true;
            // Dừng stream tạm thời, sẽ được khởi tạo lại trong initMic
            stream.getTracks().forEach(track => track.stop());
        } catch (e) {
            // Người dùng từ chối quyền hoặc không có thiết bị
            console.log('Không có quyền truy cập microphone hoặc không có thiết bị');
        }
        
        if (!hasPermission) {
            // Nếu không có quyền, disable tất cả
            const micSlider = document.getElementById('micVolume');
            const echoSlider = document.getElementById('echoVolume');
            const ambientSlider = document.getElementById('ambientVolume');
            const eqSlider = document.getElementById('micEQSlider');
            const micItem = document.getElementById('micControlItem');
            const echoItem = document.getElementById('echoControlItem');
            const ambientItem = document.getElementById('ambientControlItem');
            const eqItem = document.getElementById('micEQControlItem');
            
            if (micSlider) micSlider.disabled = true;
            if (echoSlider) echoSlider.disabled = true;
            if (ambientSlider) ambientSlider.disabled = true;
            if (eqSlider) eqSlider.disabled = true;
            if (micItem) micItem.classList.add('disabled');
            if (echoItem) echoItem.classList.add('disabled');
            if (ambientItem) ambientItem.classList.add('disabled');
            if (eqItem) eqItem.classList.add('disabled');
            return;
        }
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(device => device.kind === 'audioinput' && device.deviceId !== 'default');
        
        // Kiểm tra xem có thiết bị audio input không (mic, bluetooth, headphone)
        const hasAudioInput = audioInputDevices.length > 0;
        
        // Enable/disable các slider dựa trên thiết bị
        const micSlider = document.getElementById('micVolume');
        const echoSlider = document.getElementById('echoVolume');
        const ambientSlider = document.getElementById('ambientVolume');
        const eqSlider = document.getElementById('micEQSlider');
        const micItem = document.getElementById('micControlItem');
        const echoItem = document.getElementById('echoControlItem');
        const ambientItem = document.getElementById('ambientControlItem');
        const eqItem = document.getElementById('micEQControlItem');
        
        if (hasAudioInput) {
            // Enable các slider
            if (micSlider) micSlider.disabled = false;
            if (echoSlider) echoSlider.disabled = false;
            if (ambientSlider) ambientSlider.disabled = false;
            if (eqSlider) eqSlider.disabled = false;
            if (micItem) micItem.classList.remove('disabled');
            if (echoItem) echoItem.classList.remove('disabled');
            if (ambientItem) ambientItem.classList.remove('disabled');
            if (eqItem) eqItem.classList.remove('disabled');
            
            // Cập nhật label
            const labels = document.querySelectorAll('#micControlItem label, #echoControlItem label, #ambientControlItem label');
            labels.forEach(label => {
                label.innerHTML = label.innerHTML.replace(/<span.*?<\/span>/, '<span style="font-size: 12px; opacity: 0.7;">(Đã kết nối)</span>');
            });
            
            // Tự động khởi tạo mic nếu chưa có (giữ kết nối)
            if (!micStream && !micGainNode) {
                await initMic();
            }
        } else {
            // Disable các slider
            if (micSlider) micSlider.disabled = true;
            if (echoSlider) echoSlider.disabled = true;
            if (ambientSlider) ambientSlider.disabled = true;
            if (eqSlider) eqSlider.disabled = true;
            if (micItem) micItem.classList.add('disabled');
            if (echoItem) echoItem.classList.add('disabled');
            if (ambientItem) ambientItem.classList.add('disabled');
            if (eqItem) eqItem.classList.add('disabled');
        }
    } catch (error) {
        console.error('Lỗi kiểm tra thiết bị audio:', error);
        // Nếu không thể kiểm tra, giữ nguyên trạng thái disabled
    }
}

// Đóng popup khi click ra ngoài
document.addEventListener('click', function(event) {
    const popup = document.getElementById('audioControlPopup');
    const button = document.querySelector('.audio-control-button');
    const content = document.querySelector('.audio-control-content');
    
    if (popup.classList.contains('active')) {
        if (!content.contains(event.target) && event.target !== button) {
            popup.classList.remove('active');
        }
    }
});
