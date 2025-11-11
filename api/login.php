<?php

session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Логируем запрос
file_put_contents('login_debug.log', "Login request: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);
file_put_contents('login_debug.log', "Session ID at start: " . session_id() . "\n", FILE_APPEND);
file_put_contents('login_debug.log', "Session data before login: " . print_r($_SESSION, true) . "\n", FILE_APPEND);

try {
    include_once '../config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    if(!$db) {
        throw new Exception("Не удалось подключиться к базе данных");
    }
    
    $user = new User($db);
    
    $input = file_get_contents("php://input");
    file_put_contents('login_debug.log', "Input: " . $input . "\n", FILE_APPEND);
    
    if(empty($input)) {
        throw new Exception("Пустой запрос");
    }
    
    $data = json_decode($input);
    
    if(!$data) {
        throw new Exception("Неверный JSON формат");
    }
    
    if(empty($data->email) || empty($data->password)) {
        http_response_code(400);
        echo json_encode(["message" => "Email и пароль обязательны"]);
        exit;
    }
    
    $email = trim($data->email);
    $password = $data->password;
    
    file_put_contents('login_debug.log', "Attempting login for: " . $email . "\n", FILE_APPEND);
    
    $user_data = $user->login($email, $password);
    
    if($user_data) {
        file_put_contents('login_debug.log', "Login SUCCESS for: " . $email . "\n", FILE_APPEND);
        
        // ДОБАВЬТЕ ЭТО - УСТАНОВКА СЕССИИ
        $_SESSION['user_id'] = $user_data['id'];
        $_SESSION['user_email'] = $user_data['email'];
        $_SESSION['user_name'] = $user_data['first_name'] . ' ' . $user_data['last_name'];
        $_SESSION['logged_in'] = true;
        
        file_put_contents('login_debug.log', "Session data after login: " . print_r($_SESSION, true) . "\n", FILE_APPEND);
        
        // ВЫЗОВ ФУНКЦИИ ПОДСЧЕТА АВТОРИЗАЦИЙ
        $user_id = $user_data['id'];
        $login_count = incrementLoginCount($db, $user_id);
        
        file_put_contents('login_debug.log', "Login count for user {$user_id}: {$login_count}\n", FILE_APPEND);
        
        http_response_code(200);
        echo json_encode([
            "message" => "Успешный вход в систему",
            "success" => true,
            "user" => [
                "id" => $user_data['id'],
                "name" => $user_data['first_name'] . ' ' . $user_data['last_name'],
                "email" => $user_data['email'],
                "first_name" => $user_data['first_name'],
                "last_name" => $user_data['last_name']
            ],
            "login_count" => $login_count,
            "session_id" => session_id() // Для отладки
        ]);
        
        file_put_contents('login_debug.log', "Login response sent successfully\n", FILE_APPEND);
    } else {
        file_put_contents('login_debug.log', "Login FAILED for: " . $email . "\n", FILE_APPEND);
        
        http_response_code(401);
        echo json_encode([
            "message" => "Неверный email или пароль",
            "success" => false
        ]);
    }
    
} catch(Exception $e) {
    file_put_contents('login_debug.log', "Login ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        "message" => "Ошибка сервера: " . $e->getMessage(),
        "success" => false
    ]);
}

// ФУНКЦИЯ ПОДСЧЕТА АВТОРИЗАЦИЙ
function incrementLoginCount($db, $user_id) {
    try {
        $query = "SELECT IncrementLoginCount(:user_id) as login_count";
        $stmt = $db->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['login_count'];
    } catch(Exception $e) {
        file_put_contents('login_debug.log', "Error in incrementLoginCount: " . $e->getMessage() . "\n", FILE_APPEND);
        return 1;
    }
}
?>