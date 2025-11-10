<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Логируем запрос
file_put_contents('login_debug.log', "Login request: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

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
    
   // В login.php после успешной авторизации добавляем:
    if($user_data) {
    // Увеличиваем счетчик авторизаций
    $query = "SELECT IncrementLoginCount(:user_id) as login_count";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":user_id", $user_data['id']);
    $stmt->execute();
    $login_count = $stmt->fetch(PDO::FETCH_ASSOC)['login_count'];
    
    // РЕДИРЕКТИМ НА СТРАНИЦУ УСПЕХА С ДАННЫМИ В URL
    $redirect_url = "login-success.html?name=" . urlencode($user_data['first_name'] . ' ' . $user_data['last_name']) . 
                   "&email=" . urlencode($user_data['email']) . 
                   "&count=" . $login_count;
    
    echo json_encode([
        "message" => "Успешный вход в систему",
        "login_count" => $login_count,
        "redirect_url" => $redirect_url,
        "user" => $user_data
    ]);
}
    
} catch(Exception $e) {
    file_put_contents('login_debug.log', "Login ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    
    http_response_code(500);
    echo json_encode([
        "message" => "Ошибка сервера: " . $e->getMessage()
    ]);
}
?>