// Авторизация и регистрация
$(document).ready(function() {
    const API_BASE = 'api'; // Путь к API

    // Переключение между вкладками
    $('.auth-tab').on('click', function() {
        const targetTab = $(this).data('tab');

        $('.auth-tab').removeClass('active');
        $('.auth-form').removeClass('active');

        $(this).addClass('active');
        $('#' + targetTab).addClass('active');
    });

    // Валидация формы входа
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();

        const email = $('#loginEmail').val().trim();
        const password = $('#loginPassword').val();

        if (!validateEmail(email)) {
            showAlert('Пожалуйста, введите корректный email адрес', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('Пароль должен содержать не менее 6 символов', 'error');
            return;
        }

        showAlert('Выполняется вход...', 'info');

        // Отправка запроса на сервер
        $.ajax({
            url: `${API_BASE}/login.php`,
            type: 'POST',
            data: JSON.stringify({
                email: email,
                password: password
            }),
            contentType: 'application/json',
            success: function(response) {
                showAlert('Вход выполнен успешно!', 'success');
                // Сохраняем данные пользователя
                localStorage.setItem('user', JSON.stringify(response.user));
                localStorage.setItem('isLoggedIn', 'true');

                setTimeout(() => {
                    window.location.href = './index.html';
                }, 1000);
            },
            error: function(xhr) {
                const response = JSON.parse(xhr.responseText);
                showAlert(response.message || 'Ошибка входа', 'error');
            }
        });
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

        showAlert('Регистрация...', 'info');

        // Отправка запроса на сервер
        $.ajax({
            url: `${API_BASE}/register.php`,
            type: 'POST',
            data: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone,
                password: password
            }),
            contentType: 'application/json',
            success: function(response) {
                showAlert('Регистрация прошла успешно!', 'success');

                setTimeout(() => {
                    $('.auth-tab').removeClass('active');
                    $('.auth-form').removeClass('active');
                    $('.auth-tab[data-tab="login"]').addClass('active');
                    $('#login').addClass('active');
                    $('#loginEmail').val(email);

                    $('#registerForm')[0].reset();
                }, 1500);
            },
            error: function(xhr) {
                const response = JSON.parse(xhr.responseText);
                showAlert(response.message || 'Ошибка регистрации', 'error');
            }
        });
    });

    // Социальная авторизация
    $('.social-btn').on('click', function() {
        const provider = $(this).hasClass('google-btn') ? 'Google' : 'Facebook';
        showAlert(`Авторизация через ${provider}...`, 'info');

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

        setTimeout(() => {
            alert.alert('close');
        }, 5000);
    }
});