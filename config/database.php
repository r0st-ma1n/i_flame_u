<?php
class Database {
    private $host = "localhost";
    private $db_name = "hotel_zefir";
    private $username = "root";
    private $password = "";  // Пароль пустой в XAMPP
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username, 
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            throw new Exception("Database connection error: " . $exception->getMessage());
        }
        return $this->conn;
    }
}

class User {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function register($first_name, $last_name, $email, $phone, $password) {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO " . $this->table_name . " 
                  (first_name, last_name, email, phone, password) 
                  VALUES (:first_name, :last_name, :email, :phone, :password)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":first_name", $first_name);
        $stmt->bindParam(":last_name", $last_name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":password", $hashed_password);
        
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

   public function login($email, $password) {
    $query = "SELECT id, first_name, last_name, email, phone, password 
              FROM " . $this->table_name . " 
              WHERE email = :email LIMIT 1";
    
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(":email", $email);
    $stmt->execute();
    
    file_put_contents('user_login.log', "Login query for: " . $email . "\n", FILE_APPEND);
    file_put_contents('user_login.log', "Rows found: " . $stmt->rowCount() . "\n", FILE_APPEND);
    
    if($stmt->rowCount() == 1) {
        $user = $stmt->fetch();
        file_put_contents('user_login.log', "User found: " . print_r($user, true) . "\n", FILE_APPEND);
        
        // Проверяем пароль
        $password_verified = password_verify($password, $user['password']);
        file_put_contents('user_login.log', "Password verified: " . ($password_verified ? "YES" : "NO") . "\n", FILE_APPEND);
        file_put_contents('user_login.log', "Input password: " . $password . "\n", FILE_APPEND);
        file_put_contents('user_login.log', "Stored hash: " . $user['password'] . "\n", FILE_APPEND);
        
        if($password_verified) {
            // Убираем пароль из результата
            unset($user['password']);
            return $user;
        }
    }
    
    return false;
}

    public function emailExists($email) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }
}
?>