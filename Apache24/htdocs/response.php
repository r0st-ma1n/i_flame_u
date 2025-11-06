<?php

$mysqli = new mysqli("localhost", "root", "Buymecopibarra3454", "new_schema");

// Тест коннект
if ($mysqli->connect_error) {
    die("Ошибка соединения с БД: " . $mysqli->connect_error);
}

// Получаю данные формы
$username = $mysqli->real_escape_string($_POST['username']);
$password = $mysqli->real_escape_string($_POST['password']);
$action = $_POST['action'];

// кнопки
function display_back_button() {
    echo '<br><br><a href="index.html"><button>Вернуться на главную страницу</button></a>';
}
function display_play_button() {
    echo '<br><br><a href="rooms.html"><button>Продожить</button></a>';
}
function display_login_button() {
    echo '<br><br><a href="rooms.html"><button>Авторизация</button></a>';
}


switch ($action) {
    case 'login':
        // вход юзера
        $query = "SELECT id, login_count FROM users WHERE username = '$username' AND password = '$password'";
        $result = $mysqli->query($query);
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $user_id = $row['id'];
            $query = "SELECT log_user_login($user_id)";
            $result = $mysqli->query($query);
            $login_count = $row['login_count'] + 1; // увеличиваем на 1, т.к. только что произошел вход
            echo "Авторизация прошла успешно! Количество авторизаций: $login_count";
        } else {
            echo "Неправильный логин или пароль. Повторите попытку!";
        }
        display_play_button();
        break;
    case 'register':
        // рег юзера
        $query = "INSERT INTO users (username, password) VALUES ('$username', '$password')";
        $result = $mysqli->query($query);
        if ($result) {
            echo "Регистрация прошла успешно!";
        } else {
            echo "Ошибка регистрации: " . $mysqli->error;
        }
        display_login_button();
        break;
    case 'delete':
        // удаление учетки юзераы
        $query = "DELETE FROM users WHERE username = '$username' AND password = '$password'";
        $result = $mysqli->query($query);
        if ($mysqli->affected_rows > 0) {
            echo "Аккаунт успешно был удален!";
        } else {
            echo "Ошибка удаления аккаунта: " . $mysqli->error;
        }
        display_back_button();
        break;
    default:
        echo "Неверные данные";
        display_back_button();
}

$mysqli->close();

?>