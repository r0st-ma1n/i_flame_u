<?php
class Database {
    private $host = "localhost";
<<<<<<< Updated upstream
    private $db_name = "hotel_zefir";
    private $username = "your_username";
    private $password = "your_password";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
=======
    private $db_name = "new_schema";
    private $username = "root"; // или ваш пользователь MySQL
    private $password = ""; // ваш пароль MySQL
    public $conn;

    // Получение соединения с базой данных
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
>>>>>>> Stashed changes
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }
        return $this->conn;
    }
}
<<<<<<< Updated upstream
=======

// Класс для работы с пользователями (авторизация)
class User {
    private $conn;
    private $table_name = "users";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Регистрация нового пользователя
    public function register($username, $password, $first_name, $last_name, $email, $phone, $role = 'guest') {
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO " . $this->table_name . " 
                  (username, password, first_name, last_name, email, phone, role) 
                  VALUES (:username, :password, :first_name, :last_name, :email, :phone, :role)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":username", $username);
        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":first_name", $first_name);
        $stmt->bindParam(":last_name", $last_name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":role", $role);
        
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Авторизация пользователя
    public function login($email, $password) {
        $query = "SELECT id, username, password, first_name, last_name, email, role 
                  FROM " . $this->table_name . " 
                  WHERE email = :email";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        if($stmt->rowCount() == 1) {
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if(password_verify($password, $user['password'])) {
                // Обновляем счетчик входов
                $this->updateLoginCount($user['id']);
                return $user;
            }
        }
        return false;
    }

    // Обновление счетчика входов
    private function updateLoginCount($user_id) {
        $query = "UPDATE " . $this->table_name . " 
                  SET login_count = login_count + 1 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $user_id);
        $stmt->execute();
    }

    // Проверка существования пользователя по email
    public function userExists($email) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Получение информации о пользователе по ID
    public function getUserById($id) {
        $query = "SELECT id, username, first_name, last_name, email, phone, role 
                  FROM " . $this->table_name . " 
                  WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}

// Класс для работы с гостями
class Guest {
    private $conn;
    private $table_name = "guests";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Создание гостя и связь с пользователем
    public function createGuest($first_name, $last_name, $email, $phone, $address, $user_id = null) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (first_name, last_name, email, phone, address, user_id) 
                  VALUES (:first_name, :last_name, :email, :phone, :address, :user_id)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":first_name", $first_name);
        $stmt->bindParam(":last_name", $last_name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":address", $address);
        $stmt->bindParam(":user_id", $user_id);
        
        if($stmt->execute()) {
            return $this->conn->lastInsertId();
        }
        return false;
    }

    // Получение всех гостей
    public function getAllGuests() {
        $query = "SELECT g.*, u.username 
                  FROM " . $this->table_name . " g
                  LEFT JOIN users u ON g.user_id = u.id
                  ORDER BY g.guest_id DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Класс для работы с бронированиями
class Booking {
    private $conn;
    private $table_name = "bookings";

    public function __construct($db) {
        $this->conn = $db;
    }

    // Создание бронирования
    public function createBooking($guest_id, $room_id, $check_in_date, $check_out_date) {
        $query = "INSERT INTO " . $this->table_name . " 
                  (guest_id, room_id, check_in_date, check_out_date) 
                  VALUES (:guest_id, :room_id, :check_in_date, :check_out_date)";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":guest_id", $guest_id);
        $stmt->bindParam(":room_id", $room_id);
        $stmt->bindParam(":check_in_date", $check_in_date);
        $stmt->bindParam(":check_out_date", $check_out_date);
        
        return $stmt->execute();
    }

    // Получение всех бронирований с информацией о гостях и номерах
    public function getAllBookings() {
        $query = "SELECT b.*, g.first_name, g.last_name, r.room_number, r.room_type
                  FROM " . $this->table_name . " b
                  JOIN guests g ON b.guest_id = g.guest_id
                  JOIN rooms r ON b.room_id = r.room_id
                  ORDER BY b.check_in_date DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

// Инициализация базы данных
try {
    $database = new Database();
    $db = $database->getConnection();
    
    // Создаем экземпляры классов
    $user = new User($db);
    $guest = new Guest($db);
    $booking = new Booking($db);
    
} catch(PDOException $exception) {
    echo "Database connection error: " . $exception->getMessage();
}
>>>>>>> Stashed changes
?>