<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST");
header("Access-Control-Allow-Headers: Content-Type");

// Включаем вывод ошибок
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Прямое подключение к базе данных - БЕЗ config/database.php
function connectDB() {
    try {
        $host = "localhost";
        $db_name = "hotel_zefir";
        $username = "root";
        $password = "";
        
        $db = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $db;
    } catch (PDOException $e) {
        return null;
    }
}

$action = $_GET['action'] ?? '';

// Получаем входные данные
$input = json_decode(file_get_contents("php://input"), true);

// Подключаемся к базе
$db = connectDB();
if (!$db) {
    echo json_encode(["success" => false, "message" => "Database connection failed"]);
    exit;
}

// Обрабатываем действия
try {
    switch ($action) {
        case 'get_active_order':
            $result = handleGetActiveOrder($db);
            break;
        case 'create_order':
            $result = handleCreateOrder($db);
            break;
        case 'get_room_id':
            $result = handleGetRoomId($db, $input);
            break;
        case 'add_to_cart':
            $result = handleAddToCart($db, $input);
            break;
        case 'get_cart':
            $result = handleGetCart($db);
            break;
        case 'remove_from_cart':
            $result = handleRemoveFromCart($db, $input);
            break;
            // В switch($action) добавь:
        case 'clear_cart':
            $result = handleClearCart($db, $input);
            break;
        default:
            $result = ["success" => false, "message" => "Unknown action: " . $action];
    }
} catch (Exception $e) {
    $result = ["success" => false, "message" => $e->getMessage()];
}

echo json_encode($result);

function handleGetActiveOrder($db) {
    $query = "SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($order) {
        $items = getCartItems($db, $order['order_id']);
        return [
            "success" => true,
            "order" => $order,
            "items" => $items,
            "total" => $order['total_amount']
        ];
    } else {
        return ["success" => true, "order" => null, "items" => [], "total" => 0];
    }
}

function handleCreateOrder($db) {
    $query = "INSERT INTO orders (status, total_amount) VALUES ('pending', 0)";
    $stmt = $db->prepare($query);
    
    if ($stmt->execute()) {
        $orderId = $db->lastInsertId();
        return ["success" => true, "order_id" => $orderId];
    } else {
        return ["success" => false, "message" => "Failed to create order"];
    }
}

function handleGetRoomId($db, $input) {
    $roomName = $input['room_name'] ?? '';
    
    $query = "SELECT room_id FROM rooms WHERE room_name = :room_name";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":room_name", $roomName);
    $stmt->execute();
    
    $room = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($room) {
        return ["success" => true, "room_id" => $room['room_id']];
    } else {
        return ["success" => false, "message" => "Room not found: " . $roomName];
    }
}

function handleAddToCart($db, $input) {
    $orderId = $input['order_id'] ?? '';
    $roomId = $input['room_id'] ?? '';
    $price = $input['price'] ?? 0;
    
    // Проверяем существующий элемент
    $checkQuery = "SELECT * FROM cart_items WHERE order_id = :order_id AND room_id = :room_id";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->bindParam(":order_id", $orderId);
    $checkStmt->bindParam(":room_id", $roomId);
    $checkStmt->execute();
    
    $existingItem = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existingItem) {
        // Обновляем количество
        $updateQuery = "UPDATE cart_items SET quantity = quantity + 1 WHERE cart_item_id = :cart_item_id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(":cart_item_id", $existingItem['cart_item_id']);
        $success = $updateStmt->execute();
    } else {
        // Добавляем новый элемент
        $insertQuery = "INSERT INTO cart_items (order_id, room_id, price, quantity) VALUES (:order_id, :room_id, :price, 1)";
        $insertStmt = $db->prepare($insertQuery);
        $insertStmt->bindParam(":order_id", $orderId);
        $insertStmt->bindParam(":room_id", $roomId);
        $insertStmt->bindParam(":price", $price);
        $success = $insertStmt->execute();
    }
    
    if ($success) {
        updateOrderTotal($db, $orderId);
        return ["success" => true];
    } else {
        return ["success" => false, "message" => "Failed to add to cart"];
    }
}

function handleGetCart($db) {
    $orderId = $_GET['order_id'] ?? '';
    
    $items = getCartItems($db, $orderId);
    
    $totalQuery = "SELECT total_amount FROM orders WHERE order_id = :order_id";
    $totalStmt = $db->prepare($totalQuery);
    $totalStmt->bindParam(":order_id", $orderId);
    $totalStmt->execute();
    $order = $totalStmt->fetch(PDO::FETCH_ASSOC);
    
    return [
        "success" => true,
        "items" => $items,
        "total" => $order ? $order['total_amount'] : 0
    ];
}

function handleRemoveFromCart($db, $input) {
    $cartItemId = $input['cart_item_id'] ?? '';
    
    // Сначала получаем order_id
    $getOrderQuery = "SELECT order_id FROM cart_items WHERE cart_item_id = :cart_item_id";
    $getOrderStmt = $db->prepare($getOrderQuery);
    $getOrderStmt->bindParam(":cart_item_id", $cartItemId);
    $getOrderStmt->execute();
    $item = $getOrderStmt->fetch(PDO::FETCH_ASSOC);
    
    $query = "DELETE FROM cart_items WHERE cart_item_id = :cart_item_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":cart_item_id", $cartItemId);
    
    if ($stmt->execute()) {
        if ($item) {
            updateOrderTotal($db, $item['order_id']);
        }
        return ["success" => true];
    } else {
        return ["success" => false, "message" => "Failed to remove from cart"];
    }
}

function getCartItems($db, $orderId) {
    $query = "SELECT ci.*, r.room_name 
              FROM cart_items ci 
              JOIN rooms r ON ci.room_id = r.room_id 
              WHERE ci.order_id = :order_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":order_id", $orderId);
    $stmt->execute();
    
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function updateOrderTotal($db, $orderId) {
    $query = "UPDATE orders SET total_amount = (
                SELECT COALESCE(SUM(price * quantity), 0) 
                FROM cart_items 
                WHERE order_id = :order_id
              ) WHERE order_id = :order_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(":order_id", $orderId);
    $stmt->execute();
}

function handleClearCart($db, $input) {
    try {
        $orderId = $input['order_id'] ?? '';
        
        if (empty($orderId)) {
            return ["success" => false, "message" => "Order ID is required"];
        }
        
        // Удаляем все элементы корзины для этого заказа
        $deleteQuery = "DELETE FROM cart_items WHERE order_id = :order_id";
        $deleteStmt = $db->prepare($deleteQuery);
        $deleteStmt->bindParam(":order_id", $orderId);
        $deleteStmt->execute();
        
        // Обновляем статус заказа на 'completed'
        $updateQuery = "UPDATE orders SET status = 'completed' WHERE order_id = :order_id";
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bindParam(":order_id", $orderId);
        $updateStmt->execute();
        
        return ["success" => true];
        
    } catch (Exception $e) {
        return ["success" => false, "message" => $e->getMessage()];
    }
}
?>