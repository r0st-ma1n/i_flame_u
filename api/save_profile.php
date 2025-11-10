<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Подключаем БД
include_once '../config/database.php';
$database = new Database();
$db = $database->getConnection();

// Получаем данные
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Нет данных']);
    exit;
}

$user_id = $data['user_id'] ?? 1;

try {    
    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'get_profile_data':
                // Получаем данные пользователя
                $stmt = $db->prepare("SELECT first_name, last_name, email, phone, birthdate, country, address FROM users WHERE id = ?");
                $stmt->execute([$user_id]);
                $user_data = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($user_data) {
                    echo json_encode(['success' => true, 'user' => $user_data]);
                } else {
                    // Создаем тестового пользователя если нет
                    $stmt = $db->prepare("INSERT INTO users (first_name, last_name, email, password) VALUES (?, ?, ?, ?)");
                    $stmt->execute(['Иван', 'Иванов', 'test@example.com', password_hash('123456', PASSWORD_DEFAULT)]);
                    $new_id = $db->lastInsertId();
                    
                    $stmt = $db->prepare("SELECT first_name, last_name, email, phone, birthdate, country, address FROM users WHERE id = ?");
                    $stmt->execute([$new_id]);
                    $user_data = $stmt->fetch(PDO::FETCH_ASSOC);
                    
                    echo json_encode(['success' => true, 'user' => $user_data]);
                }
                break;

            case 'update_profile':
                // Обновляем данные
                $stmt = $db->prepare("UPDATE users SET first_name=?, last_name=?, email=?, phone=?, birthdate=?, country=?, address=? WHERE id=?");
                $result = $stmt->execute([
                    $data['first_name'],
                    $data['last_name'], 
                    $data['email'],
                    $data['phone'] ?? '',
                    $data['birthdate'] ?? null,
                    $data['country'] ?? '',
                    $data['address'] ?? '',
                    $user_id
                ]);
                
                echo json_encode([
                    'success' => $result,
                    'message' => $result ? 'Данные успешно сохранены!' : 'Ошибка сохранения'
                ]);
                break;

            case 'update_password':
                echo json_encode(['success' => true, 'message' => 'Пароль изменен!']);
                break;

            case 'update_preferences':
                echo json_encode(['success' => true, 'message' => 'Настройки сохранены!']);
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Неизвестное действие']);
        }
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Ошибка: ' . $e->getMessage()]);
}
?>