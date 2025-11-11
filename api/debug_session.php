<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Отладка сессии</h2>";

// Принудительно устанавливаем тестовые данные
$_SESSION['debug_test'] = 'test_value_' . time();
$_SESSION['debug_user_id'] = 999;

echo "Session ID: " . session_id() . "<br>";
echo "Session Data SET:<br>";
echo "<pre>";
print_r($_SESSION);
echo "</pre>";

// Сохраняем сессию
session_write_close();

echo "<p><a href='debug_session_check.php'>Проверить сохранение сессии</a></p>";
?>ы