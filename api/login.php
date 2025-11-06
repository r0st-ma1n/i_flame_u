<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';
include_once '../models/User.php';

$database = new Database();
$db = $database->getConnection();

$user = new User($db);

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)) {
    $user->email = $data->email;
    $password = $data->password;

    if($user->login($password)) {
        session_start();
        $_SESSION['user_id'] = $user->id;
        $_SESSION['user_name'] = $user->first_name . ' ' . $user->last_name;
        $_SESSION['user_email'] = $user->email;

        http_response_code(200);
        echo json_encode(array(
            "message" => "Успешный вход в систему.",
            "user" => array(
                "id" => $user->id,
                "name" => $user->first_name . ' ' . $user->last_name,
                "email" => $user->email
            )
        ));
    } else {
        http_response_code(401);
        echo json_encode(array("message" => "Ошибка входа. Неверный email или пароль."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Невозможно выполнить вход. Данные неполные."));
}
?>