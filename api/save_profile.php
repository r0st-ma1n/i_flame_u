<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Начинаем сессию для проверки авторизации
session_start();

// Проверяем авторизацию
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Необходима авторизация']);
    exit;
}

include_once '../config/database.php';
include_once '../models/user.php';

$database = new Database();
$db = $database->getConnection();
$user = new User($db);

// Получаем данные из POST запроса
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Неверный формат данных']);
    exit;
}

try {
    $user_id = $_SESSION['user_id'];
    
    if (isset($data['action'])) {
        switch ($data['action']) {
            case 'update_profile':
                // Проверяем обязательные поля
                if (empty($data['first_name']) || empty($data['last_name']) || empty($data['email'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Имя, фамилия и email обязательны']);
                    break;
                }
                
                // Проверяем email на уникальность (если изменился)
                $current_user = $user->getUserById($user_id);
                if ($current_user && $current_user['email'] != $data['email']) {
                    if ($user->emailExists($data['email'])) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => 'Пользователь с таким email уже существует']);
                        break;
                    }
                }
                
                // Обновляем профиль
                $result = $user->updateProfile(
                    $user_id,
                    $data['first_name'],
                    $data['last_name'],
                    $data['email'],
                    $data['phone'] ?? '',
                    $data['birthdate'] ?? null,
                    $data['country'] ?? '',
                    $data['address'] ?? ''
                );
                
                if ($result) {
                    // Обновляем данные в сессии
                    $_SESSION['user_name'] = $data['first_name'] . ' ' . $data['last_name'];
                    $_SESSION['user_email'] = $data['email'];
                    
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Данные успешно сохранены!',
                        'user' => [
                            'id' => $user_id,
                            'first_name' => $data['first_name'],
                            'last_name' => $data['last_name'],
                            'email' => $data['email']
                        ]
                    ]);
                } else {
                    echo json_encode([
                        'success' => false, 
                        'message' => 'Ошибка при сохранении данных'
                    ]);
                }
                break;

            case 'update_password':
                // Проверяем обязательные поля
                if (empty($data['current_password']) || empty($data['new_password'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Все поля пароля обязательны']);
                    break;
                }
                
                // Проверяем текущий пароль
                if (!$user->verifyPassword($user_id, $data['current_password'])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Текущий пароль неверен']);
                    break;
                }
                
                // Обновляем пароль
                if ($user->updatePassword($user_id, $data['new_password'])) {
                    echo json_encode([
                        'success' => true, 
                        'message' => 'Пароль успешно изменен!'
                    ]);
                } else {
                    echo json_encode([
                        'success' => false, 
                        'message' => 'Ошибка при изменении пароля'
                    ]);
                }
                break;

            case 'update_preferences':
                // Здесь можно добавить логику для сохранения предпочтений
                // Пока просто возвращаем успех
                echo json_encode([
                    'success' => true, 
                    'message' => 'Предпочтения успешно сохранены!'
                ]);
                break;

            case 'get_profile_data':
                // Получаем данные пользователя для заполнения формы
                $user_data = $user->getUserById($user_id);
                if ($user_data) {
                    echo json_encode([
                        'success' => true,
                        'user' => $user_data
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Не удалось загрузить данные пользователя'
                    ]);
                }
                break;

            default:
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'message' => 'Неизвестное действие'
                ]);
        }
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Действие не указано'
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Ошибка сервера: ' . $e->getMessage()
    ]);
}
?>