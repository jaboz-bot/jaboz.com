const cartIcon = document.getElementById('cart-icon');
const cartDropdown = document.getElementById('cart-dropdown');

cartIcon.addEventListener('click', () => {
    cartDropdown.style.display = cartDropdown.style.display === 'block' ? 'none' : 'block';
});

// Đóng dropdown khi click ra ngoài
document.addEventListener('click', (e) => {
    if(!cartDropdown.contains(e.target) && e.target !== cartIcon){
        cartDropdown.style.display = 'none';
    }
});
