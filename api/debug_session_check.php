<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Проверка сохранения сессии</h2>";
echo "Session ID: " . session_id() . "<br>";
echo "Session Data GET:<br>";
echo "<pre>";
print_r($_SESSION);
echo "</pre>";

if (isset($_SESSION['debug_test'])) {
    echo "<p style='color: green;'>✅ Сессия СОХРАНЯЕТСЯ между запросами</p>";
} else {
    echo "<p style='color: red;'>❌ Сессия НЕ СОХРАНЯЕТСЯ между запросами</p>";
}
?>