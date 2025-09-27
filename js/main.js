// 1. Lấy ra các phần tử bằng ID MỚI
const cartButton = document.getElementById('cart-button');
const cartDropdown = document.getElementById('cart-dropdown');

// 2. Thêm trình lắng nghe sự kiện click
if (cartButton && cartDropdown) {
    cartButton.addEventListener('click', function(e) {
        // Ngăn chặn hành vi mặc định của thẻ <a> (ngăn nó chuyển trang)
        e.preventDefault(); 
        
        // Chuyển đổi trạng thái hiển thị/ẩn của dropdown
        cartDropdown.classList.toggle('show');
    });

    // Tùy chọn: Đóng dropdown khi click ra ngoài
    document.addEventListener('click', function(e) {
        if (!cartButton.contains(e.target) && !cartDropdown.contains(e.target)) {
            cartDropdown.classList.remove('show');
        }
    });
}
