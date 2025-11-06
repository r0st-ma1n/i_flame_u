// Авторизация и регистрация
$(document).ready(function() {
    // Переключение между вкладками
    $('.auth-tab').on('click', function() {
        const targetTab = $(this).data('tab');

        // Убираем активный класс со всех кнопок и форм
        $('.auth-tab').removeClass('active');
        $('.auth-form').removeClass('active');

        // Добавляем активный класс к текущей кнопке и форме
        $(this).addClass('active');
        $('#' + targetTab).addClass('active');
    });

    // Валидация формы входа
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();

        const email = $('#loginEmail').val().trim();
        const password = $('#loginPassword').val();

        // Базовая валидация
        if (!validateEmail(email)) {
            showAlert('Пожалуйста, введите корректный email адрес', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('Пароль должен содержать не менее 6 символов', 'error');
            return;
        }

        // Симуляция запроса к серверу
        showAlert('Выполняется вход...', 'info');

        setTimeout(() => {
            // В реальном приложении здесь будет запрос к серверу
            console.log('Вход:', { email, password });

            // Перенаправление на главную страницу после успешного входа
            showAlert('Вход выполнен успешно!', 'success');
            setTimeout(() => {
                window.location.href = './index.html';
            }, 1000);
        }, 1500);
    });

    // Валидация формы регистрации
    $('#registerForm').on('submit', function(e) {
        e.preventDefault();

        const firstName = $('#registerFirstName').val().trim();
        const lastName = $('#registerLastName').val().trim();
        const email = $('#registerEmail').val().trim();
        const phone = $('#registerPhone').val().trim();
        const password = $('#registerPassword').val();
        const confirmPassword = $('#registerConfirmPassword').val();

        // Валидация полей
        if (firstName === '' || lastName === '') {
            showAlert('Пожалуйста, введите имя и фамилию', 'error');
            return;
        }

        if (!validateEmail(email)) {
            showAlert('Пожалуйста, введите корректный email адрес', 'error');
            return;
        }

        if (!validatePhone(phone)) {
            showAlert('Пожалуйста, введите корректный номер телефона', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('Пароль должен содержать не менее 6 символов', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showAlert('Пароли не совпадают', 'error');
            return;
        }

        if (!$('#agreeTerms').is(':checked')) {
            showAlert('Пожалуйста, согласитесь с условиями использования', 'error');
            return;
        }

        // Симуляция запроса к серверу
        showAlert('Регистрация...', 'info');

        setTimeout(() => {
            // В реальном приложении здесь будет запрос к серверу
            console.log('Регистрация:', {
                firstName,
                lastName,
                email,
                phone,
                password
            });

            showAlert('Регистрация прошла успешно!', 'success');

            // Переключение на вкладку входа
            setTimeout(() => {
                $('.auth-tab').removeClass('active');
                $('.auth-form').removeClass('active');
                $('.auth-tab[data-tab="login"]').addClass('active');
                $('#login').addClass('active');
                $('#loginEmail').val(email);

                // Очистка формы регистрации
                $('#registerForm')[0].reset();
            }, 1500);
        }, 2000);
    });

    // Социальная авторизация
    $('.social-btn').on('click', function() {
        const provider = $(this).hasClass('google-btn') ? 'Google' : 'Facebook';
        showAlert(`Авторизация через ${provider}...`, 'info');

        // В реальном приложении здесь будет OAuth авторизация
        setTimeout(() => {
            showAlert(`Авторизация через ${provider} пока недоступна`, 'warning');
        }, 1000);
    });

    // Восстановление пароля
    $('.forgot-password').on('click', function(e) {
        e.preventDefault();
        showAlert('Функция восстановления пароля пока недоступна', 'warning');
    });

    // Функции валидации
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        const re = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
        return re.test(phone);
    }

    // Функция показа уведомлений
    function showAlert(message, type = 'info') {
        // Удаляем предыдущие уведомления
        $('.auth-alert').remove();

        const alertClass = type === 'error' ? 'alert-danger' :
            type === 'success' ? 'alert-success' :
            type === 'warning' ? 'alert-warning' : 'alert-info';

        const alert = $(`
            <div class="alert ${alertClass} auth-alert alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `);

        $('.auth-form-content').prepend(alert);

        // Автоматическое скрытие через 5 секунд
        setTimeout(() => {
            alert.alert('close');
        }, 5000);
    }
});