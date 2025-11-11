<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Симулируем успешный логин как в login.php
$_SESSION['user_id'] = 14;
$_SESSION['user_email'] = 'parshevalexsei@gmail.com';
$_SESSION['user_name'] = 'Алексей Паршев';
$_SESSION['logged_in'] = true;

echo "Session ID: " . session_id() . "<br>";
echo "Session Data SET in test:<br>";
echo "<pre>";
print_r($_SESSION);
echo "</pre>";

echo "<p><a href='profile.php'>Теперь перейдите в профиль</a></p>";
?>