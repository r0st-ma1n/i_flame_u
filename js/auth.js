// Авторизация и регистрация с подробным логированием
$(document).ready(function() {
    const API_BASE = 'api';

    console.log('🔵 [AUTH] Document ready - началась загрузка auth.js');
    console.log('🔵 [AUTH] Текущая страница:', window.location.pathname);

    // Проверяем данные в localStorage
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const user = localStorage.getItem('user');

    console.log('🔵 [AUTH] Проверка localStorage:');
    console.log('  - isLoggedIn:', isLoggedIn);
    console.log('  - user:', user);
    console.log('  - typeof isLoggedIn:', typeof isLoggedIn);
    console.log('  - isLoggedIn === "true":', isLoggedIn === 'true');

    // Проверяем, если пользователь уже авторизован - перенаправляем
    if (isLoggedIn === 'true' && user) {
        console.log('🟡 [AUTH] Пользователь уже авторизован, перенаправляем на index.html');
        console.log('🟡 [AUTH] Данные пользователя:', JSON.parse(user));

        try {
            window.location.href = './index.html';
            return;
        } catch (error) {
            console.error('🔴 [AUTH] Ошибка при перенаправлении:', error);
        }
    } else {
        console.log('🟢 [AUTH] Пользователь не авторизован, продолжаем загрузку страницы авторизации');
    }

    // Инициализация интерфейса
    initializeAuthPage();

    // Объявляем функции глобально внутри ready
    window.handleLogin = function() {
        const email = $('#loginEmail').val().trim();
        const password = $('#loginPassword').val();

        console.log('🔵 [AUTH] Обработка входа:');
        console.log('  - email:', email);
        console.log('  - password length:', password ? password.length : 0);

        if (!validateEmail(email)) {
            console.warn('🟡 [AUTH] Невалидный email:', email);
            showAlert('Пожалуйста, введите корректный email адрес', 'error');
            return;
        }

        if (password.length < 6) {
            console.warn('🟡 [AUTH] Слишком короткий пароль:', password.length);
            showAlert('Пароль должен содержать не менее 6 символов', 'error');
            return;
        }

        console.log('🔵 [AUTH] Валидация пройдена, отправка запроса на сервер');
        showAlert('Выполняется вход...', 'info');

        // Отправка запроса на сервер
        $.ajax({
            url: `api/login.php`,
            type: 'POST',
            data: JSON.stringify({
                email: email,
                password: password
            }),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                console.log('🟢 [AUTH] Успешный ответ от сервера:', response);
                console.log('  - response.success:', response.success);
                console.log('  - response.message:', response.message);
                console.log('  - response.user:', response.user);

                // ИСПРАВЛЕНИЕ: Проверяем наличие пользователя в ответе
                if (response.user) {
                    console.log('🟢 [AUTH] Вход успешен (определено по наличию user)');

                    // Используем функцию из user.js
                    if (typeof handleLoginSuccess === 'function') {
                        console.log('🔵 [AUTH] Используется handleLoginSuccess из user.js');

                        // Добавляем success: true если его нет
                        if (response.success === undefined) {
                            response.success = true;
                        }

                        handleLoginSuccess(response);
                    } else {
                        console.log('🟡 [AUTH] handleLoginSuccess не найден, используем fallback');
                        // Fallback если функция не доступна
                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('user', JSON.stringify(response.user));
                        console.log('🟢 [AUTH] Данные сохранены в localStorage');
                        showAlert('Успешный вход! Перенаправление...', 'success');
                        setTimeout(() => {
                            console.log('🔵 [AUTH] Перенаправление на index.html');
                            window.location.href = './index.html';
                        }, 1500);
                    }
                } else {
                    console.warn('🟡 [AUTH] Ошибка входа:', response.message);
                    showAlert(response.message || 'Ошибка входа', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('🔴 [AUTH] Ошибка AJAX запроса:');
                console.error('  - status:', status);
                console.error('  - error:', error);
                console.error('  - responseText:', xhr.responseText);
                console.error('  - readyState:', xhr.readyState);
                console.error('  - status:', xhr.status);

                let errorMessage = 'Ошибка соединения с сервером';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage = response.message || errorMessage;
                    console.log('🔵 [AUTH] Распарсенный ответ ошибки:', response);
                } catch (e) {
                    console.error('🔴 [AUTH] Ошибка парсинга ответа:', e);
                }
                showAlert(errorMessage, 'error');
            }
        });
    };

    window.handleRegistration = function() {
        const firstName = $('#registerFirstName').val().trim();
        const lastName = $('#registerLastName').val().trim();
        const email = $('#registerEmail').val().trim();
        const phone = $('#registerPhone').val().trim();
        const password = $('#registerPassword').val();
        const confirmPassword = $('#registerConfirmPassword').val();

        console.log('🔵 [AUTH] Обработка регистрации:');
        console.log('  - firstName:', firstName);
        console.log('  - lastName:', lastName);
        console.log('  - email:', email);
        console.log('  - phone:', phone);
        console.log('  - password length:', password ? password.length : 0);
        console.log('  - confirmPassword length:', confirmPassword ? confirmPassword.length : 0);
        console.log('  - agreeTerms checked:', $('#agreeTerms').is(':checked'));

        // Валидация полей
        if (firstName === '' || lastName === '') {
            console.warn('🟡 [AUTH] Не заполнены имя или фамилия');
            showAlert('Пожалуйста, введите имя и фамилию', 'error');
            return;
        }

        if (!validateEmail(email)) {
            console.warn('🟡 [AUTH] Невалидный email:', email);
            showAlert('Пожалуйста, введите корректный email адрес', 'error');
            return;
        }

        if (!validatePhone(phone)) {
            console.warn('🟡 [AUTH] Невалидный телефон:', phone);
            showAlert('Пожалуйста, введите корректный номер телефона', 'error');
            return;
        }

        if (password.length < 6) {
            console.warn('🟡 [AUTH] Слишком короткий пароль:', password.length);
            showAlert('Пароль должен содержать не менее 6 символов', 'error');
            return;
        }

        if (password !== confirmPassword) {
            console.warn('🟡 [AUTH] Пароли не совпадают');
            showAlert('Пароли не совпадают', 'error');
            return;
        }

        if (!$('#agreeTerms').is(':checked')) {
            console.warn('🟡 [AUTH] Не приняты условия использования');
            showAlert('Пожалуйста, согласитесь с условиями использования', 'error');
            return;
        }

        console.log('🔵 [AUTH] Валидация регистрации пройдена, отправка запроса');
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
            dataType: 'json',
            success: function(response) {
                console.log('🟢 [AUTH] Ответ регистрации:', response);
                console.log('  - response.success:', response.success);
                console.log('  - response.message:', response.message);

                if (response.success) {
                    console.log('🟢 [AUTH] Регистрация успешна, выполняем автоматический вход');
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
                        dataType: 'json',
                        success: function(loginResponse) {
                            console.log('🟢 [AUTH] Ответ автоматического входа:', loginResponse);

                            if (loginResponse.user) {
                                if (typeof handleLoginSuccess === 'function') {
                                    console.log('🔵 [AUTH] Используется handleLoginSuccess для автоматического входа');
                                    // Добавляем success: true если его нет
                                    if (loginResponse.success === undefined) {
                                        loginResponse.success = true;
                                    }
                                    handleLoginSuccess(loginResponse);
                                } else {
                                    console.log('🟡 [AUTH] handleLoginSuccess не найден, сохраняем напрямую');
                                    localStorage.setItem('user', JSON.stringify(loginResponse.user));
                                    localStorage.setItem('isLoggedIn', 'true');
                                    showAlert('Регистрация успешна! Перенаправление...', 'success');
                                    setTimeout(() => {
                                        console.log('🔵 [AUTH] Перенаправление после регистрации');
                                        window.location.href = './index.html';
                                    }, 2000);
                                }
                            } else {
                                console.warn('🟡 [AUTH] Автоматический вход не удался:', loginResponse.message);
                                showAlert('Регистрация успешна! Теперь войдите в систему.', 'success');
                                switchToLoginTab(email);
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error('🔴 [AUTH] Ошибка автоматического входа:', error);
                            showAlert('Регистрация успешна! Теперь войдите в систему.', 'success');
                            switchToLoginTab(email);
                        }
                    });
                } else {
                    console.warn('🟡 [AUTH] Ошибка регистрации:', response.message);
                    showAlert(response.message || 'Ошибка регистрации', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('🔴 [AUTH] Ошибка AJAX регистрации:');
                console.error('  - status:', status);
                console.error('  - error:', error);
                console.error('  - responseText:', xhr.responseText);

                let errorMessage = 'Ошибка регистрации';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage = response.message || errorMessage;
                    console.log('🔵 [AUTH] Распарсенный ответ ошибки регистрации:', response);
                } catch (e) {
                    console.error('🔴 [AUTH] Ошибка парсинга ответа регистрации:', e);
                }
                showAlert(errorMessage, 'error');
            }
        });
    };

    function initializeAuthPage() {
        console.log('🔵 [AUTH] Инициализация страницы авторизации...');

        // Проверяем существование элементов на странице
        const loginForm = $('#loginForm');
        const registerForm = $('#registerForm');
        const authTabs = $('.auth-tab');

        console.log('🔵 [AUTH] Поиск элементов:');
        console.log('  - loginForm:', loginForm.length);
        console.log('  - registerForm:', registerForm.length);
        console.log('  - authTabs:', authTabs.length);

        if (loginForm.length === 0 || registerForm.length === 0) {
            console.error('🔴 [AUTH] Не найдены необходимые элементы на странице!');
            return;
        }

        // Переключение между вкладками
        $('.auth-tab').on('click', function() {
            const targetTab = $(this).data('tab');
            console.log('🔵 [AUTH] Переключение на вкладку:', targetTab);

            $('.auth-tab').removeClass('active');
            $('.auth-form').removeClass('active');

            $(this).addClass('active');
            $('#' + targetTab).addClass('active');

            // Очищаем сообщения при переключении вкладок
            $('.auth-alert').remove();
            console.log('🔵 [AUTH] Вкладка переключена успешно');
        });

        // Валидация формы входа
        $('#loginForm').on('submit', function(e) {
            e.preventDefault();
            console.log('🔵 [AUTH] Отправка формы входа');
            handleLogin();
        });

        // Валидация формы регистрации
        $('#registerForm').on('submit', function(e) {
            e.preventDefault();
            console.log('🔵 [AUTH] Отправка формы регистрации');
            handleRegistration();
        });

        // Социальная авторизация
        $('.social-btn').on('click', function() {
            const provider = $(this).hasClass('google-btn') ? 'Google' : 'Facebook';
            console.log('🔵 [AUTH] Клик по социальной авторизации:', provider);
            showAlert(`Авторизация через ${provider}...`, 'info');

            setTimeout(() => {
                showAlert(`Авторизация через ${provider} пока недоступна`, 'warning');
            }, 1000);
        });

        // Восстановление пароля
        $('.forgot-password').on('click', function(e) {
            e.preventDefault();
            console.log('🔵 [AUTH] Клик по "Забыли пароль"');
            showAlert('Функция восстановления пароля пока недоступна', 'warning');
        });

        console.log('🟢 [AUTH] Страница авторизации успешно инициализирована');
    }

    // Функции валидации
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = re.test(email);
        console.log(`🔵 [AUTH] Валидация email "${email}": ${isValid}`);
        return isValid;
    }

    function validatePhone(phone) {
        const re = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
        const isValid = re.test(phone);
        console.log(`🔵 [AUTH] Валидация телефона "${phone}": ${isValid}`);
        return isValid;
    }

    function switchToLoginTab(email = '') {
        console.log('🔵 [AUTH] Переключение на вкладку входа, email:', email);

        $('.auth-tab').removeClass('active');
        $('.auth-form').removeClass('active');
        $('.auth-tab[data-tab="login"]').addClass('active');
        $('#login').addClass('active');

        if (email) {
            $('#loginEmail').val(email);
            console.log('🔵 [AUTH] Email установлен в поле входа');
        }

        console.log('🟢 [AUTH] Переключение на вкладку входа завершено');
    }

    // Проверяем доступность функций из user.js
    console.log('🔵 [AUTH] Проверка зависимостей:');
    console.log('  - typeof showAlert:', typeof showAlert);
    console.log('  - typeof handleLoginSuccess:', typeof handleLoginSuccess);
    console.log('  - typeof checkAuthStatus:', typeof checkAuthStatus);

    console.log('🟢 [AUTH] Скрипт auth.js полностью загружен и готов к работе');
});