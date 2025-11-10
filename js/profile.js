// profile.js
$(document).ready(function() {
    console.log('=== ПРОФИЛЬ: Начало загрузки ===');

    // Загружаем данные пользователя при загрузке страницы
    loadUserData();

    // Обработка переключения вкладок профиля
    $('.profile-menu-item').on('click', function(e) {
        e.preventDefault();

        $('.profile-menu-item').removeClass('active');
        $(this).addClass('active');

        $('.profile-tab').removeClass('active');
        const tabId = $(this).data('tab') + '-tab';
        $('#' + tabId).addClass('active');
    });

    // Функция загрузки данных пользователя
    function loadUserData() {
        console.log('1. Запуск loadUserData()');

        // Получаем user_id из localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const user_id = user.id || 1;

        const formData = {
            action: 'get_profile_data',
            user_id: user_id
        };

        console.log('2. Отправка запроса на:', 'api/save_profile.php');
        console.log('3. Данные запроса:', formData);

        $.ajax({
            url: 'api/save_profile.php',
            type: 'POST',
            data: JSON.stringify(formData),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                console.log('4. УСПЕХ: Получен ответ от сервера:', response);

                if (response.success && response.user) {
                    console.log('5. Данные пользователя получены:', response.user);
                    fillProfileForm(response.user);
                } else {
                    console.log('5. ОШИБКА: Неверный формат ответа:', response);
                    showNotification('Не удалось загрузить данные профиля', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.log('4. ОШИБКА AJAX:');
                console.log('   - Status:', status);
                console.log('   - Error:', error);
                console.log('   - XHR:', xhr);
                console.log('   - Response Text:', xhr.responseText);

                let errorMsg = 'Ошибка при загрузке данных: ' + error;
                if (xhr.responseText) {
                    errorMsg += '\nОтвет сервера: ' + xhr.responseText.substring(0, 200);
                }
                showNotification(errorMsg, 'error');
            }
        });
    }

    // Функция заполнения формы данными пользователя
    function fillProfileForm(userData) {
        console.log('6. Заполнение формы данными:', userData);

        $('#first-name').val(userData.first_name || '');
        $('#last-name').val(userData.last_name || '');
        $('#email').val(userData.email || '');
        $('#phone').val(userData.phone || '');

        if (userData.birthdate && userData.birthdate !== '0000-00-00') {
            $('#birthdate').val(userData.birthdate);
        } else {
            $('#birthdate').val('');
        }

        $('#country').val(userData.country || '');
        $('#address').val(userData.address || '');

        updateHeaderInfo(userData.first_name, userData.last_name, userData.email);

        console.log('7. Форма успешно заполнена');
    }

    function updateHeaderInfo(firstName, lastName, email) {
        const fullName = firstName + ' ' + lastName;
        $('#user-name').text(fullName);
        $('#dropdown-user-name').text(fullName);
        $('#dropdown-user-email').text(email);
        console.log('8. Хедер обновлен:', fullName);
    }

    // Валидация формы
    function validateProfileForm(formData) {
        console.log('Валидация формы:', formData);

        const errors = [];

        // Проверка ОБЯЗАТЕЛЬНЫХ полей
        if (!formData.first_name || formData.first_name.trim() === '') {
            errors.push('Поле "Имя" обязательно для заполнения');
        }

        if (!formData.last_name || formData.last_name.trim() === '') {
            errors.push('Поле "Фамилия" обязательно для заполнения');
        }

        if (!formData.email || formData.email.trim() === '') {
            errors.push('Поле "Email" обязательно для заполнения');
        }

        return errors;
    }

    // Функция для показа ошибок валидации
    function showValidationErrors(errors) {
        // Убираем предыдущие ошибки
        $('.field-error').remove();
        $('.form-group').removeClass('has-error');

        // Показываем новые ошибки
        errors.forEach(error => {
            showNotification(error, 'error');
        });

        // Подсвечиваем поля с ошибками
        if (errors.some(error => error.includes('Имя'))) {
            $('#first-name').closest('.form-group').addClass('has-error');
        }
        if (errors.some(error => error.includes('Фамилия'))) {
            $('#last-name').closest('.form-group').addClass('has-error');
        }
        if (errors.some(error => error.includes('Email'))) {
            $('#email').closest('.form-group').addClass('has-error');
        }
    }

    // Обработка загрузки аватара
    $('#avatar-upload').on('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $('.profile-avatar img').attr('src', e.target.result);
                showNotification('Фото профиля успешно обновлено!', 'success');
            }
            reader.readAsDataURL(file);
        }
    });

    // Обработка формы личной информации
    $('#personal-info-tab .profile-form').on('submit', function(e) {
        e.preventDefault();
        console.log('9. Отправка формы личной информации');

        const formData = {
            action: 'update_profile',
            first_name: $('#first-name').val().trim(),
            last_name: $('#last-name').val().trim(),
            email: $('#email').val().trim(),
            phone: $('#phone').val().trim(),
            birthdate: $('#birthdate').val(),
            country: $('#country').val().trim(),
            address: $('#address').val().trim()
        };

        console.log('10. Данные для сохранения:', formData);

        // Валидация формы
        const errors = validateProfileForm(formData);

        if (errors.length > 0) {
            console.log('10. Ошибки валидации:', errors);
            showValidationErrors(errors);
            return; // ОСТАНАВЛИВАЕМ отправку если есть ошибки
        }

        saveProfileData(formData);
    });

    // Обработка формы безопасности
    $('#security-tab .profile-form').on('submit', function(e) {
        e.preventDefault();
        console.log('11. Отправка формы безопасности');

        const currentPassword = $('#current-password').val();
        const newPassword = $('#new-password').val();
        const confirmPassword = $('#confirm-password').val();

        if (!currentPassword || !newPassword || !confirmPassword) {
            showNotification('Все поля пароля обязательны для заполнения', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('Пароли не совпадают!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('Пароль должен содержать минимум 6 символов!', 'error');
            return;
        }

        const formData = {
            action: 'update_password',
            current_password: currentPassword,
            new_password: newPassword
        };

        console.log('12. Данные для смены пароля:', {...formData, new_password: '***' });

        saveProfileData(formData);

        $('#current-password').val('');
        $('#new-password').val('');
        $('#confirm-password').val('');
    });

    // Обработка формы предпочтений
    $('#preferences-tab .profile-form').on('submit', function(e) {
        e.preventDefault();
        console.log('13. Отправка формы предпочтений');

        const preferences = {
            action: 'update_preferences'
        };

        saveProfileData(preferences);
    });

    // Функция для отправки данных на сервер
    function saveProfileData(data) {
        console.log('14. Отправка данных на сервер:', data);

        // Добавляем user_id ко всем запросам
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        data.user_id = user.id || 1;

        $.ajax({
            url: 'api/save_profile.php',
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            dataType: 'json',
            success: function(response) {
                console.log('15. УСПЕХ сохранения:', response);

                if (response.success) {
                    showNotification(response.message, 'success');
                    if (data.first_name && data.last_name && data.email) {
                        updateHeaderInfo(data.first_name, data.last_name, data.email);
                    }
                } else {
                    showNotification(response.message, 'error');
                }
            },
            error: function(xhr, status, error) {
                console.log('15. ОШИБКА сохранения:');
                console.log('   - Status:', status);
                console.log('   - Error:', error);
                console.log('   - XHR:', xhr);
                console.log('   - Response Text:', xhr.responseText);

                let errorMsg = 'Ошибка соединения с сервером: ' + error;
                if (xhr.responseText) {
                    errorMsg += '\nОтвет: ' + xhr.responseText.substring(0, 200);
                }
                showNotification(errorMsg, 'error');
            }
        });
    }

    // Функция для показа уведомлений
    function showNotification(message, type = 'success') {
        console.log('16. Показ уведомления:', type, message);

        const notification = $('<div class="notification"></div>');
        notification.addClass(type);
        notification.text(message);

        notification.css({
            'position': 'fixed',
            'top': '20px',
            'right': '20px',
            'padding': '15px 20px',
            'border-radius': '5px',
            'color': 'white',
            'font-weight': '500',
            'z-index': '10000',
            'max-width': '300px',
            'box-shadow': '0 4px 12px rgba(0,0,0,0.15)',
            'transform': 'translateX(400px)',
            'transition': 'transform 0.3s ease'
        });

        if (type === 'success') {
            notification.css('background-color', '#4CAF50');
        } else if (type === 'error') {
            notification.css('background-color', '#f44336');
        } else {
            notification.css('background-color', '#2196F3');
        }

        $('body').append(notification);

        setTimeout(() => {
            notification.css('transform', 'translateX(0)');
        }, 100);

        setTimeout(() => {
            notification.css('transform', 'translateX(400px)');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);

        notification.on('click', function() {
            $(this).css('transform', 'translateX(400px)');
            setTimeout(() => {
                $(this).remove();
            }, 300);
        });
    }

    // Обработка кнопок бронирований
    $('.booking-actions .primary-btn').on('click', function(e) {
        e.preventDefault();
        const action = $(this).text().trim();
        if (action === 'Детали') {
            showNotification('Детали бронирования будут показаны здесь', 'info');
        } else if (action === 'Отменить') {
            if (confirm('Вы уверены, что хотите отменить бронирование?')) {
                $(this).closest('.booking-item').fadeOut();
                showNotification('Бронирование успешно отменено!', 'success');
            }
        } else if (action === 'Оставить отзыв') {
            showNotification('Форма для оставления отзыва будет открыта здесь', 'info');
        }
    });

    console.log('=== ПРОФИЛЬ: Инициализация завершена ===');
});

// Добавляем стили для ошибок
const errorStyles = `
<style>
.form-group.has-error input,
.form-group.has-error select {
    border-color: #f44336 !important;
    box-shadow: 0 0 5px rgba(244, 67, 54, 0.3) !important;
}

.field-error {
    color: #f44336;
    font-size: 12px;
    margin-top: 5px;
    display: block;
}

.notification.error {
    background-color: #f44336 !important;
}
</style>
`;

$('head').append(errorStyles);

// Добавляем обработчики для снятия ошибок при вводе
$('#first-name, #last-name, #email').on('input', function() {
    $(this).closest('.form-group').removeClass('has-error');
});