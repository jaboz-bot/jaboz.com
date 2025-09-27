// Lấy các phần tử
const hamburger = document.getElementById('hamburger-menu');
const mainNav = document.getElementById('main-nav');
const cartButton = document.getElementById('cart-button');
const cartDropdown = document.getElementById('cart-dropdown');

// Chức năng bật/tắt Menu Hamburger
if (hamburger && mainNav) {
    hamburger.addEventListener('click', () => {
        mainNav.classList.toggle('open');
        // Đóng giỏ hàng nếu menu đang mở
        if (cartDropdown && cartDropdown.classList.contains('show')) {
            cartDropdown.classList.remove('show');
        }
    });
}

// Chức năng bật/tắt Giỏ hàng Dropdown
if (cartButton && cartDropdown) {
    cartButton.addEventListener('click', function(e) {
        // Ngăn chặn hành vi mặc định của thẻ <a> (ngăn nó chuyển trang)
        e.preventDefault(); 
        
        // Bật/tắt trạng thái hiển thị của giỏ hàng
        cartDropdown.classList.toggle('show');
        
        // Đóng menu nếu giỏ hàng đang mở
        if (mainNav && mainNav.classList.contains('open')) {
            mainNav.classList.remove('open');
        }
    });

    // Đóng cả hai khi click ra ngoài
    document.addEventListener('click', function(e) {
        // Kiểm tra xem click có phải là bên trong nút Giỏ hàng hoặc dropdown Giỏ hàng
        const isClickInsideCart = cartButton.contains(e.target) || cartDropdown.contains(e.target);
        // Kiểm tra xem click có phải là bên trong nút Hamburger hoặc menu chính
        const isClickInsideMenu = hamburger.contains(e.target) || mainNav.contains(e.target);

        // Đóng Giỏ hàng nếu click là bên ngoài khu vực Giỏ hàng
        if (!isClickInsideCart) {
            cartDropdown.classList.remove('show');
        }
        
        // Đóng Menu nếu click là bên ngoài khu vực Menu (và không phải nút Giỏ hàng)
        // Chúng ta cần một điều kiện phức tạp hơn để tránh xung đột khi Giỏ hàng mở
        if (!isClickInsideMenu && !cartButton.contains(e.target)) {
            mainNav.classList.remove('open');
        }
    });
}
