// Register Vanilla JS Shortcut Functions (Giữ nguyên)
function DQS(val) {return document.querySelector(val);}
function DQSA(val) {return document.querySelectorAll(val);}
function DID(val) {return document.getElementById(val);}
function DCN(val) {return document.getElementsByClassName(val);}
function DCE(val) {return document.createElement(val);}
function DCTN(val) {return document.createTextNode(val);}
function DPFS(val) {return new DOMParser().parseFromString(val, 'text/html');}

// ====================================
// BIẾN TOÀN CỤC & DỮ LIỆU
// ====================================

var debug_mode = false; // Đã tắt để tối ưu hiệu suất
var moves = [];
var currentPlayerTurn = 'white'; // Khởi tạo lượt chơi
const turnDisplay = DID('current-player-turn'); // DQS cho div hiển thị lượt chơi

// DỮ LIỆU QUÂN CỜ (Giữ nguyên vị trí ban đầu, đã sửa lỗi Vua/Hậu)
const pieces = {
  black: {
    king: { pos: "E8", icon: "chess-king",}, // Vua (E8)
    queen: { pos: "D8", icon: "chess-queen",}, // Hậu (D8)
    bishop_1: { pos: "C8", icon: "chess-bishop",},
    bishop_2: { pos: "F8", icon: "chess-bishop",},
    knight_1: { pos: "B8", icon: "chess-knight",},
    knight_2: { pos: "G8", icon: "chess-knight",},
    rook_1: { pos: "A8", icon: "chess-rook",},
    rook_2: { pos: "H8", icon: "chess-rook",},
    pawn_1: { pos: "A7", icon: "chess-pawn",},
    pawn_2: { pos: "B7", icon: "chess-pawn",},
    pawn_3: { pos: "C7", icon: "chess-pawn",},
    pawn_4: { pos: "D7", icon: "chess-pawn",},
    pawn_5: { pos: "E7", icon: "chess-pawn",},
    pawn_6: { pos: "F7", icon: "chess-pawn",},
    pawn_7: { pos: "G7", icon: "chess-pawn",},
    pawn_8: { pos: "H7", icon: "chess-pawn",},
  },
  white: {
    king: { pos: "E1", icon: "chess-king",}, // Vua (E1)
    queen: { pos: "D1", icon: "chess-queen",}, // Hậu (D1)
    bishop_1: { pos: "C1", icon: "chess-bishop",},
    bishop_2: { pos: "F1", icon: "chess-bishop",},
    knight_1: { pos: "B1", icon: "chess-knight",},
    knight_2: { pos: "G1", icon: "chess-knight",},
    rook_1: { pos: "A1", icon: "chess-rook",},
    rook_2: { pos: "H1", icon: "chess-rook",},
    pawn_1: { pos: "A2", icon: "chess-pawn",},
    pawn_2: { pos: "B2", icon: "chess-pawn",},
    pawn_3: { pos: "C2", icon: "chess-pawn",},
    pawn_4: { pos: "D2", icon: "chess-pawn",},
    pawn_5: { pos: "E2", icon: "chess-pawn",},
    pawn_6: { pos: "F2", icon: "chess-pawn",},
    pawn_7: { pos: "G2", icon: "chess-pawn",},
    pawn_8: { pos: "H2", icon: "chess-pawn",},
  },
};

// Đã đảo ngược để khớp với logic tạo ô cờ (A-H)
const cols = ["A", "B", "C", "D", "E", "F", "G", "H"]; 

// ====================================
// LISTENERS & ACTIONS (LOGIC HÀNH ĐỘNG)
// ====================================

var listeners = {
    selectPieces: function() { 
        document.querySelectorAll('.chess-piece').forEach((piece) => {
            if(!piece.classList.contains('init')) {
                piece.classList.add('init');
                piece.addEventListener('click', actions.selectPiece);
            }
        });
    },
    selectSquares: function() { 
        document.querySelectorAll('.square').forEach((square) => {
            // Gán listener cho ô trống không có quân
            if(!square.querySelector('.chess-piece') && !square.classList.contains('init')) {
                square.classList.add('init');
                square.addEventListener('click', actions.selectSquare);
            }
        });
    },
};

var actions = {
    consoleLog: function(arg1, arg2) { 
        if(debug_mode) {
            console.log(arg1, arg2 || '');
        }
    },
    
    // SỬA LỖI LOGIC TẠO Ô CỜ
    createBoard: function() { 
        let board = DQS('#chess-board');
        for(let i = 0; i < 64; i++) {
            let row = 8 - Math.floor(i / 8); // Tính hàng từ 8 xuống 1
            let colIndex = i % 8;
            let colLetter = cols[colIndex];
            
            // Logic màu ô: (hàng chẵn + cột chẵn) hoặc (hàng lẻ + cột lẻ) là ô đen
            let isBlack = (row % 2 === 0 && colIndex % 2 === 0) || (row % 2 !== 0 && colIndex % 2 !== 0);
            let color = isBlack ? "black" : "white";
            
            board.insertAdjacentHTML('beforeend', templates.square(color, i + 1, row, colLetter));
        }
    },
    
    setPieces: function(pieces) { 
        actions.mapPieces(pieces.black, "black");
        actions.mapPieces(pieces.white, "white");
    },
    
    mapPieces: function(p, color) {
        for(key in p) {
            let pos = p.hasOwnProperty(key) ? p[key].pos : false;
            let square = DQS('.square[data-cell="'+pos+'"]');
            if(square) {
                // pcolor là màu CSS của quân cờ
                let pcolor = color === "black" ? "black" : "white"; 
                square.insertAdjacentHTML('beforeend', templates.piece(key, p[key], color, pcolor));
            }
        }
    },
    
    // Dọn dẹp selectors (Giữ nguyên)
    clearPieceSelectors: function() { DQSA('.square').forEach(p => p.classList.remove('piece-selected')); },
    clearSquareSelectors: function() { DQSA('.square').forEach(x => x.classList.remove('square-selected')); },
    clearCapturedSelectors: function() { DQSA('.square').forEach(x => x.classList.remove('capturable-selected')); },

    // SỬA LỖI LOGIC CHỌN QUÂN & KIỂM TRA LƯỢT CHƠI
    selectPiece: function(e) {
        let piece = e.target.closest('.chess-piece');
        let pieceSquare = piece.parentNode;
        let pieceColor = piece.getAttribute('data-player-color'); // 'white' hoặc 'black'

        // 1. KIỂM TRA LƯỢT CHƠI
        if (pieceColor !== currentPlayerTurn) {
            actions.consoleLog("KHÔNG PHẢI LƯỢT CỦA BẠN", pieceColor);
            // Vẫn cho phép click vào quân đối phương nếu đang có quân mình được chọn (để bắt)
        }

        let originSquare = DQS('.piece-selected');
        
        // 2. Xử lý bắt quân
        if (originSquare) {
            let originPiece = originSquare.querySelector('.chess-piece');
            let originColor = originPiece.getAttribute('data-player-color');
            
            if (pieceColor !== originColor) {
                // TODO: THÊM KIỂM TRA LUẬT CỜ VUA Ở ĐÂY
                
                // Giả định là hợp lệ và thực hiện bắt quân
                actions.movePiece(e, pieceSquare); 
                return;
            }
        }
        
        // 3. Xử lý chọn/bỏ chọn quân
        actions.clearPieceSelectors();
        actions.clearSquareSelectors();
        actions.clearCapturedSelectors();

        if (pieceColor === currentPlayerTurn) {
            // Nếu là quân mình và chưa được chọn, thì chọn
            if (pieceSquare !== originSquare) {
                pieceSquare.classList.add('piece-selected');
                // TODO: TÍNH TOÁN VÀ HIGHLIGHT CÁC Ô ĐÍCH HỢP LỆ (square-selected/capturable-selected) Ở ĐÂY
            }
        }
        
        listeners.selectSquares();
        actions.consoleLog("[ACTION] Select Piece", {piece: piece});
    },
    
    // SỬA LỖI LOGIC CHỌN Ô ĐÍCH
    selectSquare: function(e) {
        let square = e.target.closest('.square');
        let selectedPiece = DQS('.piece-selected');
        
        if (!selectedPiece) { return; } // Không có quân nào được chọn

        // TODO: THÊM KIỂM TRA LUẬT CỜ VUA Ở ĐÂY
        
        // Nếu click lại ô đã chọn (tức là muốn di chuyển đến đó)
        if(square.classList.contains('square-selected')) {
            actions.movePiece(e, square);
        } else {
            // Nếu click ô mới, highlight ô đó
            actions.clearSquareSelectors();
            square.classList.add('square-selected');
        }
    },
    
    // SỬA LỖI LOGIC DI CHUYỂN & CHUYỂN LƯỢT
    movePiece: function(e, newSquareElement) {
        e.preventDefault();
        let newSquare = newSquareElement;
        let oldSquare = DQS('.piece-selected');
        
        if (!oldSquare) return;
        let piece = oldSquare.querySelector('.chess-piece');
        
        // Bắt quân nếu có
        let opponentPiece = newSquare.querySelector('.chess-piece');
        if(opponentPiece) {
            actions.takePiece(opponentPiece);
            newSquare.innerHTML = '';
        }
        
        // Thực hiện di chuyển
        newSquare.appendChild(piece);
        piece.setAttribute('data-position', newSquare.getAttribute('data-cell'));

        actions.recordMove(oldSquare, newSquare, piece);
        
        // CHUYỂN LƯỢT CHƠI
        currentPlayerTurn = currentPlayerTurn === 'white' ? 'black' : 'white';
        turnDisplay.textContent = currentPlayerTurn === 'white' ? 'Trắng' : 'Đen';
        actions.consoleLog("LƯỢT TIẾP THEO:", currentPlayerTurn);

        // Dọn dẹp và gán lại listeners
        actions.clearPieceSelectors();
        actions.clearSquareSelectors();
        actions.clearCapturedSelectors();
        listeners.selectPieces(); 
        listeners.selectSquares();
    },
    
    recordBoard: function() { /* Giữ nguyên */ },
    recordMove: function(oldSquare, newSquare, piece) { /* Giữ nguyên */ },
    resetSelectors: function() { /* Giữ nguyên */ },
    
    // SỬA LỖI LOGIC BẮT QUÂN
    takePiece: function(opponentPiece) {
        let opponentColor = opponentPiece.getAttribute('data-player-color');
        let takerColor = opponentColor === "black" ? "white" : "black"; 
        
        let panelId = takerColor + '-panel';
        let takenContainer = DID(panelId).querySelector('.taken-pieces');
        
        // Đặt quân bị bắt vào bảng điều khiển
        takenContainer.appendChild(opponentPiece);
        
        // Xóa listener để không click được vào quân đã bị bắt
        opponentPiece.removeEventListener('click', actions.selectPiece);
        opponentPiece.style.cursor = 'default';
        opponentPiece.classList.remove('init');
    }
};

// TEMPLATES (Đã sửa lỗi thuộc tính data-color)
var templates = {
    square: function(color, i, row, colLetter) {
        return `<div class="square ${color}" data-nth="${i}" data-row-num="${row}" data-square-color="${color}" data-col-letter="${colLetter}" data-cell="${colLetter}${row}"></div>`;
    },
    // Sửa lỗi mapping màu: color là màu người chơi ('white'/'black'), pcolor là màu CSS của quân
    piece: function(key, piece, playerColor, pieceColor) {
        return `<div class="chess-piece ${key}" data-piece="${key}" data-player-color="${playerColor}" data-color="${pieceColor}" data-piece-start="${piece.pos}" data-position="${piece.pos}"><i class="fa fa-${piece.icon} ${pieceColor}"></i></div>`;
    }
};

// ====================================
// KHỞI TẠO GAME
// ====================================

// Sử dụng window.onload để đảm bảo các phần tử đã được tải
window.onload = function() {
    actions.createBoard();
    actions.setPieces(pieces);
    listeners.selectPieces();
    listeners.selectSquares();
    
    // Cập nhật hiển thị lượt chơi ban đầu
    if (turnDisplay) {
        turnDisplay.textContent = 'Trắng';
    }
}
