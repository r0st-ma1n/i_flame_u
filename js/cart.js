// cart.js - Функционал корзины с базой данных

let cart = {
    items: [],
    total: 0,
    orderId: null
};

// Инициализация корзины при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Cart.js loaded');
    initializeCart();

    // Обработчики для кнопок "Забронировать"
    const bookButtons = document.querySelectorAll('.primary-btn');
    bookButtons.forEach(button => {
        if (button.textContent.trim() === 'Забронировать') {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                const roomElement = this.closest('.ri-text');
                if (roomElement) {
                    const roomName = roomElement.querySelector('h2').textContent;
                    const roomPrice = extractPrice(roomElement);
                    console.log('Adding to cart:', roomName, roomPrice);
                    addToCart(roomName, roomPrice);
                }
            });
        }
    });

    // Обработчики для модального окна корзины
    initCartModal();
});

// Инициализация модального окна корзины
function initCartModal() {
    const cartIcon = document.getElementById('cart-icon');
    const cartModal = document.getElementById('cart-modal');
    const closeCart = document.querySelector('.close-cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    const customerForm = document.getElementById('order-form');

    // Обработчик для открытия корзины
    if (cartIcon && cartModal) {
        cartIcon.addEventListener('click', function(e) {
            e.preventDefault();
            openCartModal();
        });
    }

    // Обработчик для закрытия корзины
    if (closeCart) {
        closeCart.addEventListener('click', closeCartModal);
    }

    // Закрытие корзины при клике вне модального окна
    if (cartModal) {
        cartModal.addEventListener('click', function(e) {
            if (e.target === cartModal) {
                closeCartModal();
            }
        });
    }

    // Обработчик для оформления заказа
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (validateCustomerInfo()) {
                processOrder();
            }
        });
    }

    // Обработчик для формы
    if (customerForm) {
        customerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateCustomerInfo()) {
                processOrder();
            }
        });
    }

    // Обработчики для валидации полей в реальном времени
    const nameField = document.getElementById('customer-name');
    const phoneField = document.getElementById('customer-phone');
    const emailField = document.getElementById('customer-email');

    if (nameField) {
        nameField.addEventListener('blur', function() {
            validateField(this, 'name-error', validateName);
        });
    }

    if (phoneField) {
        phoneField.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
        phoneField.addEventListener('blur', function() {
            validateField(this, 'phone-error', validatePhone);
        });
    }

    if (emailField) {
        emailField.addEventListener('blur', function() {
            validateField(this, 'email-error', validateEmail);
        });
    }

    // Загружаем сохраненные данные пользователя
    loadCustomerInfo();
}

// Открытие модального окна корзины
function openCartModal() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        updateCartModal();
    }
}

// Закрытие модального окна корзины
function closeCartModal() {
    const cartModal = document.getElementById('cart-modal');
    if (cartModal) {
        cartModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// Инициализация корзины
async function initializeCart() {
    try {
        console.log('Initializing cart...');
        const response = await fetch('api/cart.php?action=get_active_order', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        console.log('Cart initialization result:', result);

        if (result.success && result.order) {
            cart.orderId = result.order.order_id;
            cart.items = result.items || [];
            cart.total = result.order.total_amount || 0;
        }

        updateCartDisplay();
    } catch (error) {
        console.error('Error initializing cart:', error);
    }
}

// Функция добавления в корзину
async function addToCart(roomName, roomPrice) {
    try {
        console.log('Adding to cart:', roomName, roomPrice);

        // Сначала получаем ID комнаты по имени
        const roomResponse = await fetch('api/cart.php?action=get_room_id', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ room_name: roomName })
        });

        const roomResult = await roomResponse.json();
        console.log('Room ID result:', roomResult);

        if (!roomResult.success) {
            showNotification('Ошибка: номер не найден в базе данных');
            return;
        }

        const roomId = roomResult.room_id;

        // Создаем заказ если его нет
        if (!cart.orderId) {
            const orderResponse = await fetch('api/cart.php?action=create_order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const orderResult = await orderResponse.json();
            console.log('Create order result:', orderResult);

            if (orderResult.success) {
                cart.orderId = orderResult.order_id;
            } else {
                showNotification('Ошибка при создании заказа');
                return;
            }
        }

        // Добавляем товар в корзину
        const addResponse = await fetch('api/cart.php?action=add_to_cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: cart.orderId,
                room_id: roomId,
                price: roomPrice
            })
        });

        const addResult = await addResponse.json();
        console.log('Add to cart result:', addResult);

        if (addResult.success) {
            // Обновляем локальную корзину
            await loadCartFromDB();
            showNotification(`Номер "${roomName}" добавлен в корзину!`);
        } else {
            showNotification('Ошибка при добавлении в корзину');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showNotification('Ошибка при добавлении в корзину');
    }
}

// Загрузка корзины из БД
async function loadCartFromDB() {
    try {
        if (!cart.orderId) return;

        const response = await fetch(`api/cart.php?action=get_cart&order_id=${cart.orderId}`);
        const result = await response.json();

        if (result.success) {
            cart.items = result.items;
            cart.total = result.total;
            updateCartDisplay();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// Удаление из корзины
async function removeFromCart(cartItemId) {
    try {
        const response = await fetch('api/cart.php?action=remove_from_cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cart_item_id: cartItemId
            })
        });

        const result = await response.json();

        if (result.success) {
            await loadCartFromDB();
            showNotification('Номер удален из корзины');
        } else {
            showNotification('Ошибка при удалении из корзины');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        showNotification('Ошибка при удалении из корзины');
    }
}

// Обновление отображения корзины
function updateCartDisplay() {
    // Обновляем счетчик товаров
    const totalItems = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

// Обновление модального окна корзины
function updateCartModal() {
    const cartItemsContainer = document.getElementById('cart-items');
    const customerInfo = document.getElementById('customer-info');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const checkoutBtn = document.getElementById('checkout-btn');

    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';

    if (cart.items.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        if (customerInfo) customerInfo.style.display = 'none';
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (cartTotalPrice) cartTotalPrice.textContent = '0';
    } else {
        cart.items.forEach(item => {
            const quantity = item.quantity || 1;
            const itemTotal = item.price * quantity;

            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.room_name}</h4>
                    <p>${item.price} руб. x ${quantity}</p>
                </div>
                <div class="cart-item-actions">
                    <span>${itemTotal} руб.</span>
                    <button type="button" class="remove-item" data-cart-item-id="${item.cart_item_id}">&times;</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });

        if (customerInfo) customerInfo.style.display = 'block';

        // Добавляем обработчики для кнопок удаления
        const removeButtons = document.querySelectorAll('.remove-item');
        removeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const cartItemId = this.getAttribute('data-cart-item-id');
                removeFromCart(cartItemId);
            });
        });

        if (checkoutBtn) checkoutBtn.disabled = false;
    }

    if (cartTotalPrice) {
        cartTotalPrice.textContent = cart.total || 0;
    }
}

// Извлечение цены из элемента
function extractPrice(roomElement) {
    console.log('Extracting price from:', roomElement);

    // Сначала ищем элемент с классом room-price
    const priceElement = roomElement.querySelector('.room-price');
    if (priceElement) {
        const priceText = priceElement.textContent;
        console.log('Found price element:', priceText);

        // Ищем число в тексте
        const priceMatch = priceText.match(/(\d+[\s\d]*)\s*₽/) ||
            priceText.match(/(\d+[\s\d]*)\s*руб/) ||
            priceText.match(/\b(\d{4,5})\b/);

        if (priceMatch) {
            const price = parseInt(priceMatch[1].replace(/\s/g, ''));
            console.log('Extracted price:', price);
            return price;
        }
    }

    // Если не нашли по классу, ищем в любом параграфе
    const allParagraphs = roomElement.querySelectorAll('p');
    for (let paragraph of allParagraphs) {
        const text = paragraph.textContent;
        const priceMatch = text.match(/(\d+[\s\d]*)\s*₽/) ||
            text.match(/(\d+[\s\d]*)\s*руб/) ||
            text.match(/\b(\d{4,5})\b/);

        if (priceMatch) {
            const price = parseInt(priceMatch[1].replace(/\s/g, ''));
            console.log('Found price in paragraph:', price);
            return price;
        }
    }

    // Если цена не найдена, используем цены из базы данных на основе названия номера
    const roomName = roomElement.querySelector('h2').textContent;
    const priceMap = {
        'Королевский Люкс': 29000,
        'Двухместный номер с видом на море': 15000,
        'Двухместный номер': 12000,
        'Трехместный номер с видом на море': 18000
    };

    const price = priceMap[roomName] || 5000;
    console.log('Using mapped price for', roomName, ':', price);
    return price;
}

// Сохранение данных пользователя
function saveCustomerInfo() {
    const nameField = document.getElementById('customer-name');
    const phoneField = document.getElementById('customer-phone');
    const emailField = document.getElementById('customer-email');
    const requestsField = document.getElementById('special-requests');

    if (nameField && phoneField && emailField && requestsField) {
        const customerInfo = {
            name: nameField.value,
            phone: phoneField.value,
            email: emailField.value,
            requests: requestsField.value
        };
        localStorage.setItem('hotelCustomerInfo', JSON.stringify(customerInfo));
    }
}

// Загрузка сохраненных данных пользователя
function loadCustomerInfo() {
    const savedInfo = localStorage.getItem('hotelCustomerInfo');
    if (savedInfo) {
        const customerInfo = JSON.parse(savedInfo);
        const nameField = document.getElementById('customer-name');
        const phoneField = document.getElementById('customer-phone');
        const emailField = document.getElementById('customer-email');
        const requestsField = document.getElementById('special-requests');

        if (nameField && customerInfo.name) nameField.value = customerInfo.name;
        if (phoneField && customerInfo.phone) phoneField.value = customerInfo.phone;
        if (emailField && customerInfo.email) emailField.value = customerInfo.email;
        if (requestsField && customerInfo.requests) requestsField.value = customerInfo.requests;
    }
}

// Очистка корзины
async function clearCart() {
    try {
        cart.items = [];
        cart.total = 0;
        cart.orderId = null; // Важно: сбрасываем orderId
        updateCartDisplay();
        updateCartModal();
    } catch (error) {
        console.error('Error clearing cart:', error);
    }
}

// ========== СИСТЕМА УВЕДОМЛЕНИЙ СО СТЕКОМ ==========
let activeNotifications = [];
const NOTIFICATION_SPACING = 80;

// Переопределяем функцию showNotification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    // Рассчитываем позицию для нового уведомления
    const topPosition = 100 + (activeNotifications.length * NOTIFICATION_SPACING);

    // Принудительные стили с !important
    notification.style.cssText = `
        position: fixed !important;
        top: ${topPosition}px !important;
        right: 20px !important;
        background: #4CAF50 !important;
        color: white !important;
        padding: 15px 20px !important;
        border-radius: 5px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
        z-index: 10010 !important;
        transition: all 0.3s ease !important;
        transform: translateX(100%) !important;
        opacity: 0 !important;
        max-width: 300px !important;
        word-wrap: break-word !important;
    `;

    document.body.appendChild(notification);

    // Добавляем в массив активных уведомлений
    activeNotifications.push(notification);

    // Анимация появления
    setTimeout(() => {
        notification.style.transform = 'translateX(0) !important';
        notification.style.opacity = '1 !important';
    }, 10);

    // Автозакрытие через 3 секунды
    setTimeout(() => {
        closeNotification(notification);
    }, 3000);
}

function closeNotification(notification) {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);

            // Удаляем из массива и пересчитываем позиции
            const index = activeNotifications.indexOf(notification);
            if (index > -1) {
                activeNotifications.splice(index, 1);
            }

            // Обновляем позиции оставшихся уведомлений
            updateNotificationPositions();
        }
    }, 300);
}

function updateNotificationPositions() {
    activeNotifications.forEach((notification, index) => {
        const topPosition = 100 + (index * NOTIFICATION_SPACING);
        notification.style.top = `${topPosition}px`;
    });
}
// ========== КОНЕЦ СИСТЕМЫ УВЕДОМЛЕНИЙ ==========

// Валидация формы
function validateCustomerInfo() {
    const name = document.getElementById('customer-name');
    const phone = document.getElementById('customer-phone');
    const email = document.getElementById('customer-email');

    let isValid = true;

    // Валидация имени
    const nameValue = name ? name.value.trim() : '';
    if (!validateName(nameValue)) {
        showError(name, 'name-error', 'Пожалуйста, введите корректное имя (минимум 2 символа)');
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
    const emailValue = email ? email.value.trim() : '';
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
                errorMessage = 'Пожалуйста, введите корректное имя (минимум 2 символа)';
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
    return name.length >= 2 && /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/.test(name);
}

function validatePhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 11 && /^[78]/.test(cleanPhone);
}

function validateEmail(email) {
    if (!email) return true;
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
        errorElement.style.display = 'block';
    }
}

function clearError(field, errorId) {
    if (!field) return;

    field.classList.remove('error');
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// Обработка заказа
async function processOrder() {
    console.log('Processing order...');

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
        items: [...cart.items],
        total: cart.total,
        orderDate: new Date().toISOString(),
        orderId: generateOrderId()
    };

    console.log('Order created:', order);

    try {
        // Сохраняем заказ
        saveOrder(order);

        // Очищаем корзину в БД
        if (cart.orderId) {
            await clearCartFromDB();
        }

        // Показываем подтверждение
        showOrderConfirmation(order);

        // Очищаем локальную корзину
        clearCart();

        // Очищаем данные пользователя
        clearCustomerInfo();

    } catch (error) {
        console.error('Error processing order:', error);
        showNotification('Ошибка при оформлении заказа');
    }
}

// Функция для очистки корзины из БД
async function clearCartFromDB() {
    try {
        const response = await fetch('api/cart.php?action=clear_cart', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                order_id: cart.orderId
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log('Cart cleared from database');
        } else {
            console.error('Failed to clear cart from database:', result.message);
        }
    } catch (error) {
        console.error('Error clearing cart from database:', error);
    }
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
    console.log('Order saved to localStorage');
}

// Показ подтверждения заказа
function showOrderConfirmation(order) {
    console.log('Showing order confirmation');

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