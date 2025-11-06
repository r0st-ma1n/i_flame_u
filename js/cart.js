// cart.js - Функционал корзины для сайта отеля

// Объект для хранения данных корзины
let cart = {
    items: [],
    total: 0
};

// Цены номеров (в реальном приложении эти данные должны приходить с сервера)
const roomPrices = {
    "Королевский Люкс": 15000,
    "Двухместный номер с видом на море": 9000,
    "Двухместный номер": 7500,
    "Трехместный номер с видом на море": 12000
};

// Инициализация корзины при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromStorage();
    updateCartDisplay();

    // Добавление обработчиков событий для кнопок "Забронировать"
    const bookButtons = document.querySelectorAll('.primary-btn');
    bookButtons.forEach(button => {
        if (button.textContent.trim() === 'Забронировать') {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const roomName = this.closest('.ri-text').querySelector('h2').textContent;
                addToCart(roomName);
            });
        }
    });

    // Обработчики для модального окна корзины
    document.getElementById('cart-link').addEventListener('click', function(e) {
        e.preventDefault();
        openCartModal();
    });

    document.querySelector('.close-cart').addEventListener('click', closeCartModal);

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('cart-modal');
        if (e.target === modal) {
            closeCartModal();
        }
    });

    // Обработчик для кнопки оформления заказа
    document.getElementById('checkout-btn').addEventListener('click', function() {
        if (cart.items.length > 0) {
            alert('Заказ успешно оформлен! С вами свяжутся для подтверждения.');
            clearCart();
            closeCartModal();
        }
    });
});

// Функция добавления номера в корзину
function addToCart(roomName) {
    // Проверяем, есть ли уже такой номер в корзине
    const existingItemIndex = cart.items.findIndex(item => item.name === roomName);

    if (existingItemIndex !== -1) {
        // Если номер уже в корзине, увеличиваем количество
        cart.items[existingItemIndex].quantity += 1;
    } else {
        // Добавляем новый номер в корзину
        cart.items.push({
            name: roomName,
            price: roomPrices[roomName] || 0,
            quantity: 1
        });
    }

    // Пересчитываем общую стоимость
    calculateTotal();

    // Сохраняем корзину в localStorage
    saveCartToStorage();

    // Обновляем отображение корзины
    updateCartDisplay();

    // Показываем уведомление
    showNotification(`Номер "${roomName}" добавлен в корзину!`);
}

// Функция удаления номера из корзины
function removeFromCart(roomName) {
    cart.items = cart.items.filter(item => item.name !== roomName);
    calculateTotal();
    saveCartToStorage();
    updateCartDisplay();
}

// Функция расчета общей стоимости
function calculateTotal() {
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Функция обновления отображения корзины
function updateCartDisplay() {
    // Обновляем счетчик товаров
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').textContent = totalItems;

    // Обновляем содержимое модального окна корзины
    updateCartModal();
}

// Функция обновления модального окна корзины
function updateCartModal() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Очищаем контейнер
    cartItemsContainer.innerHTML = '';

    if (cart.items.length === 0) {
        // Если корзина пуста
        cartItemsContainer.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        checkoutBtn.disabled = true;
    } else {
        // Добавляем товары в корзину
        cart.items.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price} руб. x ${item.quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <span>${item.price * item.quantity} руб.</span>
                    <button class="remove-item" data-room="${item.name}">&times;</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });

        // Добавляем обработчики для кнопок удаления
        const removeButtons = document.querySelectorAll('.remove-item');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const roomName = this.getAttribute('data-room');
                removeFromCart(roomName);
            });
        });

        checkoutBtn.disabled = false;
    }

    // Обновляем общую стоимость
    cartTotalPrice.textContent = cart.total;
}

// Функция открытия модального окна корзины
function openCartModal() {
    document.getElementById('cart-modal').style.display = 'block';
    updateCartModal();
}

// Функция закрытия модального окна корзины
function closeCartModal() {
    document.getElementById('cart-modal').style.display = 'none';
}

// Функция сохранения корзины в localStorage
function saveCartToStorage() {
    localStorage.setItem('hotelCart', JSON.stringify(cart));
}

// Функция загрузки корзины из localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('hotelCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        calculateTotal();
    }
}

// Функция очистки корзины
function clearCart() {
    cart.items = [];
    cart.total = 0;
    saveCartToStorage();
    updateCartDisplay();
}

// Функция показа уведомления
function showNotification(message) {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1001;
        transition: all 0.3s ease;
    `;

    // Добавляем уведомление на страницу
    document.body.appendChild(notification);

    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Добавляем стили для уведомления в CSS
const style = document.createElement('style');
style.textContent = `
    .notification {
        animation: slideIn 0.3s ease;
    }
    
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
`;
document.head.appendChild(style);