<?php
// config/session.php
function initSession() {
    // Используем стандартный путь для сессий
    session_start();
    
    // Устанавливаем параметры cookies
    session_set_cookie_params([
        'lifetime' => 86400, // 24 часа
        'path' => '/',
        'domain' => $_SERVER['HTTP_HOST'],
        'secure' => false, // true если HTTPS
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}
?>