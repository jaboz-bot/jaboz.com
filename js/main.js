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
        e.preventDefault(); 
        cartDropdown.classList.toggle('show');
        
        // Đóng menu nếu giỏ hàng đang mở
        if (mainNav && mainNav.classList.contains('open')) {
            mainNav.classList.remove('open');
        }
    });

    // Đóng cả hai khi click ra ngoài
    document.addEventListener('click', function(e) {
        // Kiểm tra xem click có phải là nút menu, nav, nút giỏ hàng, hay dropdown giỏ hàng không
        const isClickInsideCart = cartButton.contains(e.target) || cartDropdown.contains(e.target);
        const isClickInsideMenu = hamburger.contains(e.target) || mainNav.contains(e.target);

        if (!isClickInsideCart) {
            cartDropdown.classList.remove('show');
        }
        
        if (!isClickInsideMenu) {
            mainNav.classList.remove('open');
        }
    });
}
