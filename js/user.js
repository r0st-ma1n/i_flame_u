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
    // Переинициализация обработчиков корзины
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
    // Обрезаем длинные имена
    const displayName = user.first_name && user.first_name.length > 12 ?
        user.first_name.substring(0, 12) + '...' :
        user.first_name || user.name;

    // Создаем или обновляем меню пользователя
    let userMenu = $('.user-menu');

    if (userMenu.length === 0) {
        // Создаем новое меню
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
                    <a href="profile.html" class="dropdown-item">
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
            <!-- Иконка корзины с количеством товаров -->
            <div class="cart-icon">
                <a href="#" id="cart-link">
                    <img src="img/cart.png" alt="Корзина" class="cart-img">
                    <span id="cart-count">0</span>
                </a>
            </div>
            
        `);
    } else {
        // Обновляем существующее меню
        $('.user-btn').html(`<i class="fa fa-user"></i>${displayName}`);
        $('.user-info strong').text(`${user.first_name || user.name} ${user.last_name || ''}`);
        $('.user-info span').text(user.email);
    }

    // Инициализируем выпадающее меню
    initUserDropdown();
    // Переинициализируем корзину
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

    // Скрываем меню при загрузке
    dropdown.hide();

    // Обработчик клика по кнопке пользователя
    userBtn.off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        // Закрываем все другие открытые dropdown'ы
        $('.user-dropdown').not(dropdown).hide();

        // Переключаем текущее меню
        dropdown.toggle();
    });

    // Закрытие меню при клике вне его
    $(document).off('click.userDropdown').on('click.userDropdown', function(e) {
        if (!$(e.target).closest('.user-menu').length) {
            dropdown.hide();
        }
    });

    // Закрытие меню при нажатии Escape
    $(document).off('keyup.userDropdown').on('keyup.userDropdown', function(e) {
        if (e.key === 'Escape') {
            dropdown.hide();
        }
    });

    // Обработчик выхода
    $('#logoutBtn').off('click').on('click', function(e) {
        e.preventDefault();
        dropdown.hide(); // Скрываем меню перед выходом
        logoutUser();
    });

    // Предотвращаем закрытие при клике внутри меню
    dropdown.off('click').on('click', function(e) {
        e.stopPropagation();
    });
}

// Выход из системы
function logoutUser() {
    // Показываем уведомление
    showLogoutNotification();

    // Удаляем данные
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');

    // Обновляем интерфейс через короткую задержку
    setTimeout(() => {
        updateUIForGuest();

        // Если мы на странице профиля или бронирований - перенаправляем на главную
        if (window.location.pathname.includes('profile.html') ||
            window.location.pathname.includes('bookings.html')) {
            window.location.href = './index.html';
        }

        // Если мы на странице авторизации - показываем сообщение
        if (window.location.pathname.includes('auth.html')) {
            showAlert('Вы успешно вышли из системы', 'success');
        }
    }, 1000);
}

// Показ уведомления о выходе
function showLogoutNotification() {
    // Создаем уведомление
    const notification = $(`
        <div class="logout-notification">
            <div class="notification-content">
                <i class="fa fa-check-circle"></i>
                <span>Вы успешно вышли из системы</span>
            </div>
        </div>
    `);

    $('body').append(notification);

    // Анимация появления
    setTimeout(() => {
        notification.addClass('show');
    }, 100);

    // Убираем уведомление через 3 секунды
    setTimeout(() => {
        notification.removeClass('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Функция для принудительного обновления интерфейса
function updateUserInterface() {
    checkAuthStatus();
}

// Проверяем статус при загрузке страницы
$(document).ready(function() {
    checkAuthStatus();

    // Обновляем интерфейс при изменении localStorage (многопользовательские вкладки)
    $(window).on('storage', function(e) {
        if (e.originalEvent.key === 'isLoggedIn' || e.originalEvent.key === 'user') {
            checkAuthStatus();
        }
    });
});

// Если пользователь авторизован и открыл страницу авторизации - перенаправляем
function checkAuthPageAccess() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (isLoggedIn && window.location.pathname.includes('auth.html')) {
        showAlert('Вы уже авторизованы! Перенаправляем на главную...', 'info');
        setTimeout(() => {
            window.location.href = './index.html';
        }, 2000);
        return true;
    }
    return false;
}

// Проверка доступа к защищенным страницам
function checkProtectedPageAccess() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const protectedPages = ['profile.html', 'bookings.html'];
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

// Инициализация проверок при загрузке
$(document).ready(function() {
    checkAuthStatus();

    // Проверяем доступ к страницам
    if (window.location.pathname.includes('auth.html')) {
        checkAuthPageAccess();
    } else {
        checkProtectedPageAccess();
    }
});