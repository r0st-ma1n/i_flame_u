<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

try {
    include_once '../config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    if(!$db) {
        throw new Exception("Не удалось подключиться к базе данных");
    }
    
    $user = new User($db);
    
    $input = file_get_contents("php://input");
    
    if(empty($input)) {
        throw new Exception("Пустой запрос");
    }
    
    $data = json_decode($input);
    
    if(!$data) {
        throw new Exception("Неверный JSON формат");
    }
    
    // Проверяем обязательные поля
    $required = ['first_name', 'last_name', 'email', 'phone', 'password'];
    $missing = [];
    
    foreach($required as $field) {
        if(empty($data->$field)) {
            $missing[] = $field;
        }
    }
    
    if(!empty($missing)) {
        http_response_code(400);
        echo json_encode([
            "message" => "Неполные данные",
            "missing_fields" => $missing
        ]);
        exit;
    }
    
    $first_name = trim($data->first_name);
    $last_name = trim($data->last_name);
    $email = trim($data->email);
    $phone = trim($data->phone);
    $password = $data->password;
    
    // Проверяем email
    if(!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["message" => "Неверный формат email"]);
        exit;
    }
    
    // Проверяем существует ли пользователь
    if($user->emailExists($email)) {
        http_response_code(400);
        echo json_encode(["message" => "Пользователь с таким email уже существует"]);
        exit;
    }
    
    // Регистрируем пользователя
    $user_id = $user->register($first_name, $last_name, $email, $phone, $password);
    
    if($user_id) {
        http_response_code(201);
        echo json_encode([
            "message" => "Регистрация успешна",
            "user_id" => $user_id,
            "user" => [
                "first_name" => $first_name,
                "last_name" => $last_name,
                "email" => $email
            ]
        ]);
    } else {
        throw new Exception("Ошибка при регистрации пользователя");
    }
    
} catch(Exception $e) {
    http_response_code(500);
    echo json_encode([
        "message" => "Ошибка сервера: " . $e->getMessage()
    ]);
}
?>