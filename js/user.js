// Проверка статуса авторизации
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.name) {
        // Обновляем кнопку входа на имя пользователя
        $('.nav-right .primary-btn').text(user.name);
        $('.nav-right .primary-btn').attr('href', '#');

        // Добавляем выпадающее меню
        $('.nav-right').append(`
            <div class="user-dropdown" style="display: none;">
                <a href="profile.html">Профиль</a>
                <a href="bookings.html">Мои бронирования</a>
                <a href="#" id="logoutBtn">Выйти</a>
            </div>
        `);

        // Показываем меню при клике
        $('.nav-right .primary-btn').on('click', function(e) {
            e.preventDefault();
            $('.user-dropdown').toggle();
        });

        // Выход из системы
        $('#logoutBtn').on('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('user');
            window.location.reload();
        });
    }
}

// Проверяем статус при загрузке страницы
$(document).ready(function() {
    checkAuthStatus();
});