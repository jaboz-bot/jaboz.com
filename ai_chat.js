// File: ai_chat.js

// Khai báo các biến và hằng số
const aiChatWindow = document.getElementById('aiChatWindow');
const aiChatOverlay = document.getElementById('aiChatOverlay');
const aiStatus = document.getElementById('aiStatus');
const geminiApiKeyInput = document.getElementById('geminiApiKeyInput');
const apiKeyInputWrapper = document.getElementById('apiKeyInputWrapper');
let geminiApiKey = localStorage.getItem('geminiApiKey') || '';
let isListening = false;


// --- Hàm quản lý cửa sổ Chat AI ---
function openAIChatWindow() {
    aiChatWindow.style.display = 'block';
    aiChatOverlay.style.display = 'block';
    
    // Kiểm tra và hiển thị ô nhập API Key nếu chưa có
    if (!geminiApiKey) {
        apiKeyInputWrapper.style.display = 'block';
        aiStatus.textContent = "Vui lòng nhập API Key để bắt đầu.";
    } else {
        apiKeyInputWrapper.style.display = 'none';
        aiStatus.textContent = "Sẵn sàng nghe lệnh.";
    }
}

function closeAIChatWindow() {
    aiChatWindow.style.display = 'none';
    aiChatOverlay.style.display = 'none';
    
    // Tắt lắng nghe nếu đang hoạt động
    if (window.recognition) {
        window.recognition.stop();
        isListening = false;
        aiStatus.textContent = "Sẵn sàng nghe lệnh.";
    }
}

function saveApiKey() {
    geminiApiKey = geminiApiKeyInput.value.trim();
    if (geminiApiKey) {
        localStorage.setItem('geminiApiKey', geminiApiKey);
        apiKeyInputWrapper.style.display = 'none';
        aiStatus.textContent = "Đã lưu API Key. Bấm Bắt đầu nói.";
        // Tự động đóng cửa sổ sau khi lưu thành công (tùy chọn)
        // setTimeout(closeAIChatWindow, 1500); 
    } else {
        alert("Vui lòng nhập API Key.");
    }
}


// --- Hàm Gọi API và Nhận dạng Giọng nói ---

// Hàm gửi câu hỏi đến Gemini API
async function askGemini(question) {
    if (!geminiApiKey) {
        aiStatus.textContent = "Lỗi: Chưa có Gemini API Key!";
        apiKeyInputWrapper.style.display = 'block';
        return "Xin lỗi, tôi chưa được kết nối với AI. Vui lòng nhập API Key.";
    }

    const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;
    
    // Tạo prompt đơn giản cho chatbot tiếng Việt
    const prompt = `Bạn là một trợ lý giọng nói thân thiện. Hãy trả lời câu hỏi sau bằng Tiếng Việt một cách ngắn gọn, súc tích (dưới 50 từ): "${question}"`;

    const requestBody = {
        contents: [{
            role: "user",
            parts: [{
                text: prompt
            }]
        }]
    };

    try {
        aiStatus.textContent = "Đang suy nghĩ và tạo câu trả lời...";
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0) {
            return data.candidates[0].content.parts[0].text.trim();
        } else if (data.error) {
            console.error("Gemini API Error:", data.error.message);
            aiStatus.textContent = "Lỗi API: Vui lòng kiểm tra lại Key.";
            apiKeyInputWrapper.style.display = 'block';
            return "Đã xảy ra lỗi kết nối với AI. Vui lòng kiểm tra lại API Key.";
        }
        
        return "Xin lỗi, tôi không hiểu rõ câu hỏi của bạn.";

    } catch (error) {
        console.error("Fetch Error:", error);
        aiStatus.textContent = "Lỗi mạng hoặc kết nối!";
        return "Đã xảy ra lỗi mạng.";
    }
}

// Hàm lắng nghe giọng nói và gọi AI
function startListeningAndAsk(event) {
    if (event) event.preventDefault();
    
    if (isListening) {
        // Nếu đang nghe, chạm lần nữa sẽ dừng (optional)
        if (window.recognition) window.recognition.stop();
        return;
    }

    if (!('webkitSpeechRecognition' in window)) {
        aiStatus.textContent = "Trình duyệt không hỗ trợ nhận dạng giọng nói!";
        return;
    }
    
    if (!geminiApiKey) {
        aiStatus.textContent = "Vui lòng nhập API Key trước!";
        apiKeyInputWrapper.style.display = 'block';
        return;
    }

    // Tắt mọi phát âm TTS đang diễn ra (sử dụng hàm từ script chính)
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
    
    isListening = true;
    aiStatus.textContent = "🎤 Đang lắng nghe... Hãy nói!";

    window.recognition = new webkitSpeechRecognition();
    recognition.lang = 'vi-VN'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async function(event) {
        const last = event.results.length - 1;
        const question = event.results[last][0].transcript;
        
        isListening = false;
        aiStatus.textContent = "Bạn nói: " + question;

        // Bước 2: Gửi câu hỏi đến Gemini
        const answer = await askGemini(question);

        // Bước 3: Phát âm câu trả lời (sử dụng hàm từ script chính)
        if (typeof speak === 'function') {
             speak(answer);
        } else {
             aiStatus.textContent = "AI trả lời: " + answer;
        }
        
        // Sau khi hoàn tất, chuyển về trạng thái chờ
        setTimeout(() => { aiStatus.textContent = "Sẵn sàng nghe lệnh."; }, 4000);
    };

    recognition.onerror = function(event) {
        isListening = false;
        aiStatus.textContent = "Lỗi nghe: " + event.error + ". Thử lại.";
        console.error("Speech Recognition Error:", event.error);
    };
    
    recognition.onend = function() {
        // Đảm bảo trạng thái lắng nghe được reset nếu không có kết quả
        if (isListening) {
             isListening = false;
             aiStatus.textContent = "Không nghe được gì. Thử lại.";
             setTimeout(() => { aiStatus.textContent = "Sẵn sàng nghe lệnh."; }, 2000);
        }
    }

    recognition.start();
}
