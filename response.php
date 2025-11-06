<?php

// Подключение к MySQL
$mysqli = new mysqli("localhost:3306", "root", "Buymecopibarra3454", "new_schema");

// Проверка подключения
if ($mysqli->connect_error) {
    die("Connection failed: " . $mysqli->connect_error);
}

// Предположим, что у пользователя есть идентификатор 5, который только что вошел
$user_id = 5;

// Вызываем функцию log_user_login из PHP
$query = "SELECT log_user_login($user_id)";
$result = $mysqli->query($query);

if ($result) {
    echo "Login logged successfully!";
} else {
    echo "Error logging login: " . $mysqli->error;
}

$mysqli->close();

?>