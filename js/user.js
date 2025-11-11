// Проверка статуса авторизации
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.name) {
        updateUIForLoggedInUser(user);
    } else {
        updateUIForGuest();
    }
}

function reinitCart() {
    const cartLink = document.getElementById('cart-link');
    if (cartLink) {
        cartLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof openCartModal === 'function') {
                openCartModal();
            }
        });
    }
}

// Обновление интерфейса для авторизованного пользователя
function updateUIForLoggedInUser(user) {
    const displayName = user.first_name && user.first_name.length > 12 ?
        user.first_name.substring(0, 12) + '...' :
        user.first_name || user.name;

    let userMenu = $('.user-menu');

    if (userMenu.length === 0) {
        $('.nav-right').html(`
            <div class="user-menu">
                <button class="user-btn primary-btn">
                    <i class="fa fa-user"></i>
                    ${displayName}
                </button>
                <div class="user-dropdown">
                    <div class="user-info">
                        <strong>${user.first_name || user.name} ${user.last_name || ''}</strong>
                        <span>${user.email}</span>
                    </div>
                    <a href="profile.php" class="dropdown-item">
                        <i class="fa fa-user-circle"></i>Профиль
                    </a>
                    <a href="bookings.html" class="dropdown-item">
                        <i class="fa fa-calendar"></i>Мои бронирования
                    </a>
                    <div class="dropdown-divider"></div>
                    <button id="logoutBtn" class="dropdown-item logout-btn">
                        <i class="fa fa-sign-out"></i>Выйти
                    </button>
                </div>
            </div>
            <div class="cart-icon">
                <a href="#" id="cart-link">
                    <img src="img/cart.png" alt="Корзина" class="cart-img">
                    <span id="cart-count">0</span>
                </a>
            </div>
        `);
    } else {
        $('.user-btn').html(`<i class="fa fa-user"></i>${displayName}`);
        $('.user-info strong').text(`${user.first_name || user.name} ${user.last_name || ''}`);
        $('.user-info span').text(user.email);
    }

    initUserDropdown();
    reinitCart();
}

// Обновление интерфейса для гостя
function updateUIForGuest() {
    $('.nav-right').html(`
        <a href="./auth.html" class="primary-btn">Войти</a>
    `);
}

// Инициализация выпадающего меню пользователя
function initUserDropdown() {
    const userBtn = $('.user-btn');
    const dropdown = $('.user-dropdown');

    dropdown.hide();

    userBtn.off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        $('.user-dropdown').not(dropdown).hide();
        dropdown.toggle();
    });

    $(document).off('click.userDropdown').on('click.userDropdown', function(e) {
        if (!$(e.target).closest('.user-menu').length) {
            dropdown.hide();
        }
    });

    $(document).off('keyup.userDropdown').on('keyup.userDropdown', function(e) {
        if (e.key === 'Escape') {
            dropdown.hide();
        }
    });

    $('#logoutBtn').off('click').on('click', function(e) {
        e.preventDefault();
        dropdown.hide();
        logoutUser();
    });

    dropdown.off('click').on('click', function(e) {
        e.stopPropagation();
    });
}

// Выход из системы
function logoutUser() {
    showLogoutNotification();

    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');

    setTimeout(() => {
        updateUIForGuest();

        if (window.location.pathname.includes('profile.php') ||
            window.location.pathname.includes('bookings.html')) {
            window.location.href = './index.html';
        }

        if (window.location.pathname.includes('auth.html')) {
            showAlert('Вы успешно вышли из системы', 'success');
        }
    }, 1000);
}

// Показ уведомления о выходе
function showLogoutNotification() {
    const notification = $(`
        <div class="logout-notification">
            <div class="notification-content">
                <i class="fa fa-check-circle"></i>
                <span>Вы успешно вышли из системы</span>
            </div>
        </div>
    `);

    $('body').append(notification);

    setTimeout(() => {
        notification.addClass('show');
    }, 100);

    setTimeout(() => {
        notification.removeClass('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Универсальная функция показа уведомлений
function showAlert(message, type = 'error') {
    // Удаляем предыдущие уведомления того же типа
    $(`.alert-${type}`).remove();

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        background-color: ${getAlertColor(type)};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        max-width: 400px;
        font-weight: 500;
        transition: all 0.3s ease;
    `;

    const icon = getAlertIcon(type);
    alertDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fa ${icon}" style="font-size: 18px;"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(alertDiv);

    // Анимация появления
    setTimeout(() => {
        alertDiv.style.transform = 'translateX(0)';
    }, 100);

    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 300);
    }, 4000);
}

function getAlertColor(type) {
    const colors = {
        error: '#f44336',
        success: '#4CAF50',
        warning: '#ff9800',
        info: '#2196F3'
    };
    return colors[type] || colors.error;
}

function getAlertIcon(type) {
    const icons = {
        error: 'fa-exclamation-circle',
        success: 'fa-check-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.error;
}

// Функция для принудительного обновления интерфейса
function updateUserInterface() {
    checkAuthStatus();
}

// Проверка доступа к защищенным страницам
function checkProtectedPageAccess() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const protectedPages = ['profile.php', 'bookings.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage) && !isLoggedIn) {
        showAlert('Для доступа к этой странице необходимо авторизоваться', 'warning');
        setTimeout(() => {
            window.location.href = './auth.html';
        }, 2000);
        return false;
    }
    return true;
}

// Функция обработки успешного входа - ИСПРАВЛЕННАЯ ВЕРСИЯ
function handleLoginSuccess(response) {
    console.log('🟢 [USER] handleLoginSuccess вызван с ответом:', response);

    // ИСПРАВЛЕНИЕ: Упрощенная проверка успеха
    const isSuccess = response.success === true ||
        response.success === 'true' ||
        (response.message && response.message.includes('Успешный')) ||
        response.user !== undefined;

    console.log('🔵 [USER] Определен успех входа:', isSuccess);
    console.log('🔵 [USER] Данные пользователя:', response.user);

    if (isSuccess && response.user) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify(response.user));

        console.log('🟢 [USER] Данные пользователя сохранены:');
        console.log('  - user.name:', response.user.name);
        console.log('  - user.first_name:', response.user.first_name);
        console.log('  - user.email:', response.user.email);

        // Показываем уведомление с проверкой наличия данных
        const userName = response.user.first_name || response.user.name || 'Пользователь';
        const loginCount = response.login_count || 1;

        showLoginNotification(userName, loginCount);

        setTimeout(() => {
            if (response.redirect_url) {
                console.log('🔵 [USER] Перенаправление по redirect_url:', response.redirect_url);
                window.location.href = response.redirect_url;
            } else {
                console.log('🔵 [USER] Стандартное перенаправление на index.html');
                window.location.href = './index.html';
            }
        }, 1500);
    } else {
        console.error('🔴 [USER] Ошибка: некорректные данные пользователя в ответе');
        showAlert('Ошибка входа: некорректные данные', 'error');
    }
}

// Функция для показа уведомления об авторизации
function showLoginNotification(userName, loginCount) {
    const notification = $(`
        <div class="login-notification">
            <div class="notification-content">
                <i class="fa fa-check-circle"></i>
                <div>
                    <strong>Добро пожаловать, ${userName}!</strong>
                    <br>
                    <small>Это ваша ${loginCount}-я авторизация</small>
                </div>
            </div>
        </div>
    `);

    $('body').append(notification);

    notification.css({
        'position': 'fixed',
        'top': '20px',
        'right': '20px',
        'padding': '20px',
        'border-radius': '10px',
        'background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'color': 'white',
        'font-weight': '500',
        'z-index': '10000',
        'max-width': '300px',
        'box-shadow': '0 10px 30px rgba(0,0,0,0.3)',
        'transform': 'translateX(400px)',
        'transition': 'transform 0.3s ease'
    });

    setTimeout(() => {
        notification.css('transform', 'translateX(0)');
    }, 100);

    setTimeout(() => {
        notification.css('transform', 'translateX(400px)');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Инициализация проверок при загрузке
$(document).ready(function() {
    checkAuthStatus();

    // Проверяем доступ к защищенным страницам (кроме auth.html)
    if (!window.location.pathname.includes('auth.html')) {
        checkProtectedPageAccess();
    }
});