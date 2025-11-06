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
    console.log('Cart.js loaded'); // Отладочное сообщение
    loadCartFromStorage();
    updateCartDisplay();

    // Добавление обработчиков событий для кнопок "Забронировать"
    const bookButtons = document.querySelectorAll('.primary-btn');
    bookButtons.forEach(button => {
        if (button.textContent.trim() === 'Забронировать') {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const roomName = this.closest('.ri-text').querySelector('h2').textContent;
                console.log('Adding to cart:', roomName); // Отладочное сообщение
                addToCart(roomName);
            });
        }
    });

    // Обработчики для модального окна корзины
    const cartLink = document.getElementById('cart-link');
    if (cartLink) {
        cartLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Cart link clicked'); // Отладочное сообщение
            openCartModal();
        });
    }

    const closeCart = document.querySelector('.close-cart');
    if (closeCart) {
        closeCart.addEventListener('click', closeCartModal);
    }

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('cart-modal');
        if (e.target === modal) {
            closeCartModal();
        }
    });

    // Обработчик для формы заказа - ИСПРАВЛЕННАЯ ВЕРСИЯ
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Предотвращаем стандартную отправку формы
            console.log('Order form submitted'); // Отладочное сообщение
            if (validateCustomerInfo()) {
                processOrder();
            }
        });
    }

    // Обработчик для кнопки оформления заказа (дополнительная защита)
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Предотвращаем стандартное поведение
            console.log('Checkout button clicked'); // Отладочное сообщение
            if (validateCustomerInfo()) {
                processOrder();
            }
        });
    }

    // Валидация формы в реальном времени
    const customerName = document.getElementById('customer-name');
    if (customerName) {
        customerName.addEventListener('input', function() {
            validateField(this, 'name-error', validateName);
        });
    }

    const customerPhone = document.getElementById('customer-phone');
    if (customerPhone) {
        customerPhone.addEventListener('input', function() {
            formatPhoneNumber(this);
            validateField(this, 'phone-error', validatePhone);
        });
    }

    const customerEmail = document.getElementById('customer-email');
    if (customerEmail) {
        customerEmail.addEventListener('input', function() {
            validateField(this, 'email-error', validateEmail);
        });
    }
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
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    // Обновляем содержимое модального окна корзины
    updateCartModal();
}

// Функция обновления модального окна корзины
function updateCartModal() {
    const cartItemsContainer = document.getElementById('cart-items');
    const customerInfo = document.getElementById('customer-info');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartItemsContainer) return;

    // Очищаем контейнер
    cartItemsContainer.innerHTML = '';

    if (cart.items.length === 0) {
        // Если корзина пуста
        cartItemsContainer.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        if (customerInfo) customerInfo.style.display = 'none';
        if (checkoutBtn) checkoutBtn.disabled = true;
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
                    <button type="button" class="remove-item" data-room="${item.name}">&times;</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });

        // Показываем форму для данных пользователя
        if (customerInfo) customerInfo.style.display = 'block';

        // Добавляем обработчики для кнопок удаления
        const removeButtons = document.querySelectorAll('.remove-item');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const roomName = this.getAttribute('data-room');
                removeFromCart(roomName);
            });
        });

        if (checkoutBtn) checkoutBtn.disabled = false;
    }

    // Обновляем общую стоимость
    if (cartTotalPrice) {
        cartTotalPrice.textContent = cart.total;
    }
}

// Функция открытия модального окна корзины
function openCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'block';
        updateCartModal();
        // Загружаем сохраненные данные пользователя
        loadCustomerInfo();
    }
}

// Функция закрытия модального окна корзины
function closeCartModal() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Функция сохранения корзины в localStorage
function saveCartToStorage() {
    localStorage.setItem('hotelCart', JSON.stringify(cart));
}

// Функция загрузки корзины из localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('hotelCart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            calculateTotal();
        } catch (e) {
            console.error('Error loading cart from storage:', e);
            cart = { items: [], total: 0 };
        }
    }
}

// Функция сохранения данных пользователя
function saveCustomerInfo() {
    const nameField = document.getElementById('customer-name');
    const phoneField = document.getElementById('customer-phone');
    const emailField = document.getElementById('customer-email');
    const requestsField = document.getElementById('special-requests');

    const customerInfo = {
        name: nameField ? nameField.value : '',
        phone: phoneField ? phoneField.value : '',
        email: emailField ? emailField.value : '',
        requests: requestsField ? requestsField.value : ''
    };
    localStorage.setItem('hotelCustomerInfo', JSON.stringify(customerInfo));
}

// Функция загрузки данных пользователя
function loadCustomerInfo() {
    const savedInfo = localStorage.getItem('hotelCustomerInfo');
    if (savedInfo) {
        try {
            const customerInfo = JSON.parse(savedInfo);
            const nameField = document.getElementById('customer-name');
            const phoneField = document.getElementById('customer-phone');
            const emailField = document.getElementById('customer-email');
            const requestsField = document.getElementById('special-requests');

            if (nameField) nameField.value = customerInfo.name || '';
            if (phoneField) phoneField.value = customerInfo.phone || '';
            if (emailField) emailField.value = customerInfo.email || '';
            if (requestsField) requestsField.value = customerInfo.requests || '';
        } catch (e) {
            console.error('Error loading customer info:', e);
        }
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

// Валидация формы
function validateCustomerInfo() {
    const name = document.getElementById('customer-name');
    const phone = document.getElementById('customer-phone');
    const email = document.getElementById('customer-email');

    let isValid = true;

    // Валидация имени
    const nameValue = name ? name.value : '';
    if (!validateName(nameValue)) {
        showError(name, 'name-error', 'Пожалуйста, введите корректное имя');
        isValid = false;
    } else {
        clearError(name, 'name-error');
    }

    // Валидация телефона
    const phoneValue = phone ? phone.value : '';
    if (!validatePhone(phoneValue)) {
        showError(phone, 'phone-error', 'Пожалуйста, введите корректный номер телефона');
        isValid = false;
    } else {
        clearError(phone, 'phone-error');
    }

    // Валидация email (необязательное поле)
    const emailValue = email ? email.value : '';
    if (emailValue && !validateEmail(emailValue)) {
        showError(email, 'email-error', 'Пожалуйста, введите корректный email');
        isValid = false;
    } else {
        clearError(email, 'email-error');
    }

    return isValid;
}

// Валидация отдельных полей
function validateField(field, errorId, validationFunction) {
    if (!field) return;

    if (validationFunction(field.value)) {
        clearError(field, errorId);
    } else {
        let errorMessage = '';
        switch (field.id) {
            case 'customer-name':
                errorMessage = 'Пожалуйста, введите корректное имя';
                break;
            case 'customer-phone':
                errorMessage = 'Пожалуйста, введите корректный номер телефона';
                break;
            case 'customer-email':
                errorMessage = 'Пожалуйста, введите корректный email';
                break;
        }
        showError(field, errorId, errorMessage);
    }

    // Сохраняем данные при изменении
    saveCustomerInfo();
}

// Функции валидации
function validateName(name) {
    return name.trim().length >= 2 && /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/.test(name);
}

function validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 11 && /^[78]/.test(cleanPhone);
}

function validateEmail(email) {
    if (!email) return true; // Email не обязателен
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Форматирование номера телефона
function formatPhoneNumber(input) {
    if (!input) return;

    let value = input.value.replace(/\D/g, '');

    if (value.length === 0) return;

    if (value[0] === '7' || value[0] === '8') {
        value = value.substring(1);
    }

    let formattedValue = '+7 (';

    if (value.length > 0) {
        formattedValue += value.substring(0, 3);
    }
    if (value.length > 3) {
        formattedValue += ') ' + value.substring(3, 6);
    }
    if (value.length > 6) {
        formattedValue += '-' + value.substring(6, 8);
    }
    if (value.length > 8) {
        formattedValue += '-' + value.substring(8, 10);
    }

    input.value = formattedValue;
}

// Функции для отображения ошибок
function showError(field, errorId, message) {
    if (!field) return;

    field.classList.add('error');
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearError(field, errorId) {
    if (!field) return;

    field.classList.remove('error');
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = '';
    }
}

// Обработка заказа
function processOrder() {
    console.log('Processing order...'); // Отладочное сообщение

    const nameField = document.getElementById('customer-name');
    const phoneField = document.getElementById('customer-phone');
    const emailField = document.getElementById('customer-email');
    const requestsField = document.getElementById('special-requests');

    const customerInfo = {
        name: nameField ? nameField.value.trim() : '',
        phone: phoneField ? phoneField.value : '',
        email: emailField ? emailField.value.trim() : '',
        requests: requestsField ? requestsField.value.trim() : ''
    };

    // Создаем объект заказа
    const order = {
        customer: customerInfo,
        items: [...cart.items], // создаем копию массива
        total: cart.total,
        orderDate: new Date().toISOString(),
        orderId: generateOrderId()
    };

    console.log('Order created:', order); // Отладочное сообщение

    // Сохраняем заказ
    saveOrder(order);

    // Показываем подтверждение
    showOrderConfirmation(order);

    // Очищаем корзину
    clearCart();

    // Очищаем данные пользователя
    clearCustomerInfo();
}

// Генерация ID заказа
function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Сохранение заказа
function saveOrder(order) {
    const orders = JSON.parse(localStorage.getItem('hotelOrders') || '[]');
    orders.push(order);
    localStorage.setItem('hotelOrders', JSON.stringify(orders));
    console.log('Order saved to localStorage'); // Отладочное сообщение
}

// Показ подтверждения заказа
function showOrderConfirmation(order) {
    console.log('Showing order confirmation'); // Отладочное сообщение

    const cartBody = document.querySelector('.cart-body');
    if (!cartBody) return;

    cartBody.innerHTML = `
        <div class="order-success">
            <div class="success-icon">✓</div>
            <h4>Заказ успешно оформлен!</h4>
            <p>Номер вашего заказа: <strong>${order.orderId}</strong></p>
            <p>С вами свяжутся в ближайшее время для подтверждения бронирования.</p>
            <p>Сумма заказа: <strong>${order.total} руб.</strong></p>
            <button type="button" class="primary-btn" onclick="closeCartModal()">Понятно</button>
        </div>
    `;

    // Скрываем footer корзины
    const cartFooter = document.querySelector('.cart-footer');
    if (cartFooter) {
        cartFooter.style.display = 'none';
    }
}

// Очистка данных пользователя
function clearCustomerInfo() {
    const nameField = document.getElementById('customer-name');
    const phoneField = document.getElementById('customer-phone');
    const emailField = document.getElementById('customer-email');
    const requestsField = document.getElementById('special-requests');

    if (nameField) nameField.value = '';
    if (phoneField) phoneField.value = '';
    if (emailField) emailField.value = '';
    if (requestsField) requestsField.value = '';

    localStorage.removeItem('hotelCustomerInfo');
}