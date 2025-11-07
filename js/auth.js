// Авторизация и регистрация
$(document).ready(function() {
    const API_BASE = 'api';

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

        console.log("Login attempt:", email, password);

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
                console.log("Login success:", response);
                showAlert('Вход выполнен успешно!', 'success');

                // Сохраняем данные пользователя
                localStorage.setItem('user', JSON.stringify(response.user));
                localStorage.setItem('isLoggedIn', 'true');

                // Перенаправляем на главную через 2 секунды
                setTimeout(() => {
                    window.location.href = './index.html';
                }, 2000);
            },
            error: function(xhr, status, error) {
                console.log("Login error:", xhr.responseText, status, error);
                let errorMessage = 'Ошибка входа';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage = response.message || errorMessage;
                } catch (e) {
                    console.log("JSON parse error:", e);
                    errorMessage = 'Ошибка сервера';
                }
                showAlert(errorMessage, 'error');
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
                showAlert('Регистрация прошла успешно! Автоматический вход...', 'success');

                // Автоматически логиним пользователя после регистрации
                $.ajax({
                    url: `${API_BASE}/login.php`,
                    type: 'POST',
                    data: JSON.stringify({
                        email: email,
                        password: password
                    }),
                    contentType: 'application/json',
                    success: function(loginResponse) {
                        // Сохраняем данные пользователя
                        localStorage.setItem('user', JSON.stringify(loginResponse.user));
                        localStorage.setItem('isLoggedIn', 'true');

                        // Перенаправляем на главную через 2 секунды
                        setTimeout(() => {
                            window.location.href = './index.html';
                        }, 2000);
                    },
                    error: function() {
                        // Если авто-логин не удался, просто переключаем на вкладку входа
                        showAlert('Регистрация успешна! Теперь войдите в систему.', 'success');
                        setTimeout(() => {
                            $('.auth-tab').removeClass('active');
                            $('.auth-form').removeClass('active');
                            $('.auth-tab[data-tab="login"]').addClass('active');
                            $('#login').addClass('active');
                            $('#loginEmail').val(email);
                        }, 2000);
                    }
                });
            },
            error: function(xhr) {
                let errorMessage = 'Ошибка регистрации';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage = response.message || errorMessage;
                } catch (e) {
                    // Если не JSON, используем стандартное сообщение
                }
                showAlert(errorMessage, 'error');
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
        // Удаляем предыдущие уведомления
        $('.auth-alert').remove();

        const alertClass = type === 'error' ? 'alert-danger' :
            type === 'success' ? 'alert-success' :
            type === 'warning' ? 'alert-warning' : 'alert-info';

        const alert = $(`
            <div class="alert ${alertClass} auth-alert alert-dismissible fade show" role="alert">
                <strong>${type === 'error' ? 'Ошибка!' : type === 'success' ? 'Успех!' : 'Информация'}</strong> ${message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `);

        $('.auth-form-content').prepend(alert);

        // Для успешных сообщений не закрываем автоматически
        if (type !== 'success') {
            setTimeout(() => {
                alert.alert('close');
            }, 5000);
        }
    }

    // Проверяем если пользователь уже авторизован
    checkAuthStatus();
});

// Проверка статуса авторизации
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (isLoggedIn === 'true' && user.name) {
        // Если пользователь уже авторизован, перенаправляем на главную
        window.location.href = './index.html';
    }
}

// После успешного входа или регистрации
function handleSuccessfulAuth() {
    // Обновляем интерфейс
    if (typeof updateUserInterface === 'function') {
        updateUserInterface();
    }

    // Перенаправляем на главную
    setTimeout(() => {
        window.location.href = './index.html';
    }, 2000);
}

// В функциях успешного входа и регистрации замените:
// Вместо setTimeout с перенаправлением вызывайте:
// handleSuccessfulAuth();