<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/database.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");

// Проверка авторизации
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Необходима авторизация'
    ]);
    exit;
}

$user_id = $_SESSION['user_id'];
$input = $_POST;

// Проверяем наличие действия
if (!isset($input['action'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Не указано действие'
    ]);
    exit;
}

try {
    // ИСПРАВЬТЕ ЭТУ СТРОКУ - используйте класс Database вместо getPDO()
    $database = new Database();
    $pdo = $database->getConnection();
    
    switch ($input['action']) {
        case 'get_profile_data':
    $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, phone, birthdate, country, address FROM users WHERE id = ?");
    $stmt->execute([$user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode([
            'success' => true,
            'user' => $user
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Пользователь не найден'
        ]);
    }
    break;
            
        case 'update_profile':
    // Валидация данных
    $first_name = trim($input['first_name']);
    $last_name = trim($input['last_name']);
    $email = trim($input['email']);
    $phone = trim($input['phone']);
    $birthdate = isset($input['birthdate']) ? trim($input['birthdate']) : null;
    $country = isset($input['country']) ? trim($input['country']) : null;
    $address = isset($input['address']) ? trim($input['address']) : null;
    
    // Проверка обязательных полей
    if (empty($first_name) || empty($last_name) || empty($email)) {
        echo json_encode([
            'success' => false,
            'message' => 'Заполните обязательные поля'
        ]);
        break;
    }
    
    // Проверка уникальности email
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
    $stmt->execute([$email, $user_id]);
    if ($stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Этот email уже используется'
        ]);
        break;
    }
    
    // Обновление данных (ДОБАВЬТЕ НОВЫЕ ПОЛЯ)
    $stmt = $pdo->prepare("UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, birthdate = ?, country = ?, address = ? WHERE id = ?");
    $result = $stmt->execute([$first_name, $last_name, $email, $phone, $birthdate, $country, $address, $user_id]);
    
    if ($result) {
        echo json_encode([
            'success' => true,
            'message' => 'Данные успешно обновлены'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Ошибка при обновлении данных'
        ]);
    }
    break;
            
        default:
            echo json_encode([
                'success' => false,
                'message' => 'Неизвестное действие'
            ]);
    }
    
} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Ошибка базы данных: ' . $e->getMessage()
    ]);
}
?>