<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Test Login API</h2>";

try {
    include_once 'config/database.php';
    
    $database = new Database();
    $db = $database->getConnection();
    
    $user = new User($db);
    
    // Получаем последнего зарегистрированного пользователя
    $stmt = $db->query("SELECT * FROM users ORDER BY id DESC LIMIT 1");
    $last_user = $stmt->fetch();
    
    if($last_user) {
        echo "<h3>Testing with user:</h3>";
        echo "<pre>" . print_r($last_user, true) . "</pre>";
        
        // Тестируем вход
        $test_password = "123456"; // стандартный тестовый пароль
        
        echo "<h3>Testing login with password: $test_password</h3>";
        
        $login_result = $user->login($last_user['email'], $test_password);
        
        if($login_result) {
            echo "<p style='color: green;'>✅ Login successful!</p>";
            echo "<pre>User data: " . print_r($login_result, true) . "</pre>";
        } else {
            echo "<p style='color: red;'>❌ Login failed</p>";
            
            // Проверяем хеш пароля
            echo "<h3>Password verification:</h3>";
            $is_password_correct = password_verify($test_password, $last_user['password']);
            echo "<p>Password verify: " . ($is_password_correct ? "TRUE" : "FALSE") . "</p>";
            echo "<p>Stored hash: " . $last_user['password'] . "</p>";
        }
    } else {
        echo "<p style='color: red;'>❌ No users found in database</p>";
    }
    
} catch(Exception $e) {
    echo "<p style='color: red;'>❌ Error: " . $e->getMessage() . "</p>";
}

echo "<hr>";
echo "<p><a href='auth.html'>Go to login page</a></p>";
?>