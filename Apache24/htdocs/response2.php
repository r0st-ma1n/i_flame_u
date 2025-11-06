<?php
// Подключение к базе данных
$mysqli = new mysqli("localhost", "root", "Buymecopibarra3454", "new_schema");

// Тест коннект
if ($mysqli->connect_error) {
    die("Ошибка соединения с БД: " . $mysqli->connect_error);
}

    // Получаем значение поля "Дата вьезда"
   
    $checkInDate = $_POST['checkInDate'];
    $checkInDateFormatted = date('Y-m-d', strtotime($checkInDate));
    $checkOutDate = $_POST['checkOutDate'];
    $checkOutDateFormatted = date('Y-m-d', strtotime($checkOutDate));
    // Получаем значение поля "Тип комнаты"
    $roomType = $_POST['roomType'];
    $singleQuantity = $_POST['singleQuantity'];



// Выполнение операции с базой данных
// Например, добавление записи в таблицу
$roomId = 13;
$guestId = 34;

$query1 = "INSERT INTO bookings (guest_id, room_id, check_in_date, check_out_date) VALUES ('$guestId', '$roomId', '$checkInDateFormatted', '$checkOutDateFormatted')";

$result1 = $mysqli->query($query1);


if ($result1) {
    echo "Записи успешно добавлены в базу данных!";
} else {
    echo "Ошибка добавления записей: " . $mysqli->error;
}


// Закрытие соединения с базой данных
mysqli_close($connection);
?>