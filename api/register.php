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

if(
    !empty($data->first_name) &&
    !empty($data->last_name) &&
    !empty($data->email) &&
    !empty($data->phone) &&
    !empty($data->password)
) {
    $user->first_name = $data->first_name;
    $user->last_name = $data->last_name;
    $user->email = $data->email;
    $user->phone = $data->phone;
    $user->password = $data->password;

    if($user->emailExists()) {
        http_response_code(400);
        echo json_encode(array("message" => "Пользователь с таким email уже существует."));
    } else {
        if($user->create()) {
            http_response_code(201);
            echo json_encode(array(
                "message" => "Пользователь успешно зарегистрирован.",
                "user" => array(
                    "id" => $user->id,
                    "first_name" => $user->first_name,
                    "last_name" => $user->last_name,
                    "email" => $user->email
                )
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "Невозможно зарегистрировать пользователя."));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Невозможно зарегистрировать пользователя. Данные неполные."));
}
?>