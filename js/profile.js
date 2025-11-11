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
        console.log('2. Отправка запроса на: api/save_profile.php');

        $.ajax({
            url: 'api/save_profile.php',
            type: 'POST',
            data: { action: 'get_profile_data' },
            dataType: 'json',
            success: function(response) {
                console.log('4. УСПЕХ AJAX:', response);
                if (response.success) {
                    displayUserData(response.user);
                } else {
                    // УБРАТЬ alert здесь
                    console.log('Ошибка при загрузке данных: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                console.log('4. ОШИБКА AJAX:');
                console.log('   - Status:', status);
                console.log('   - Error:', error);
                console.log('   - Response Text:', xhr.responseText);
                // УБРАТЬ alert здесь
            }
        });
    }

    function displayUserData(user) {
        console.log('5. Отображение данных пользователя:', user);

        $('#first-name').val(user.first_name || '');
        $('#last-name').val(user.last_name || '');
        $('#email').val(user.email || '');
        $('#phone').val(user.phone || '');
        $('#birthdate').val(user.birthdate || ''); // ДОБАВЬТЕ
        $('#country').val(user.country || 'RU'); // ДОБАВЬТЕ
        $('#address').val(user.address || ''); // ДОБАВЬТЕ

        // Также обновите данные в шапке
        $('#user-name').text(user.first_name + ' ' + user.last_name);
        $('#dropdown-user-name').text(user.first_name + ' ' + user.last_name);
        $('#dropdown-user-email').text(user.email);
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
    function saveProfileData(formData) {
        console.log('14. Отправка данных на сервер:', formData);

        $.ajax({
            url: 'api/save_profile.php',
            type: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                console.log('15. Ответ сервера:', response);
                if (response.success) {
                    let message = 'Данные успешно сохранены!';

                    if (response.trigger_text) {
                        let formattedText = response.trigger_text
                            .replace(/;/g, '\n')
                            .replace(/->/g, ' → ');

                        message += '\n\n' + formattedText;
                    }

                    alert(message);
                    loadUserData(); // ВОССТАНОВИТЬ здесь
                } else {
                    alert('Ошибка сохранения: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                console.log('15. ОШИБКА сохранения:');
                console.log('   - Status:', status);
                console.log('   - Error:', error);
                console.log('   - Response Text:', xhr.responseText);
                alert('Ошибка соединения с сервером: ' + error);
            }
        });
    }

    // Функция для показа уведомлений
    function showNotification(message, type = 'УСПЕШНО') {
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

        if (type === 'Успешно') {
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