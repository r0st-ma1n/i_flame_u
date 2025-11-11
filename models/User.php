<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $first_name;
    public $last_name;
    public $email;
    public $phone;
    public $password;
    public $birthdate;
    public $country;
    public $address;
    public $created_at;
    public $updated_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Регистрация пользователя
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

    // Вход пользователя
    public function login($email, $password) {
        $query = "SELECT id, first_name, last_name, email, phone, password, 
                         birthdate, country, address, created_at, updated_at
                  FROM " . $this->table_name . " 
                  WHERE email = :email LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        
        if($stmt->rowCount() == 1) {
            $user = $stmt->fetch();
            
            // Проверяем пароль
            if(password_verify($password, $user['password'])) {
                // Убираем пароль из результата
                unset($user['password']);
                return $user;
            }
        }
        
        return false;
    }

    // Проверка существования email
    public function emailExists($email) {
        $query = "SELECT id FROM " . $this->table_name . " WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    // Получение данных пользователя по ID
    public function getUserById($id) {
        $query = "SELECT id, first_name, last_name, email, phone, 
                         birthdate, country, address, created_at, updated_at
                  FROM " . $this->table_name . " 
                  WHERE id = :id LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        
        if($stmt->rowCount() == 1) {
            return $stmt->fetch();
        }
        return false;
    }

    // Обновление данных пользователя
    public function updateProfile($id, $first_name, $last_name, $email, $phone, $birthdate, $country, $address) {
        $query = "UPDATE " . $this->table_name . "
                SET first_name = :first_name,
                    last_name = :last_name,
                    email = :email,
                    phone = :phone,
                    birthdate = :birthdate,
                    country = :country,
                    address = :address,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);

        // Привязка значений
        $stmt->bindParam(":first_name", $first_name);
        $stmt->bindParam(":last_name", $last_name);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":birthdate", $birthdate);
        $stmt->bindParam(":country", $country);
        $stmt->bindParam(":address", $address);
        $stmt->bindParam(":id", $id);

        return $stmt->execute();
    }

    // Обновление пароля
    public function updatePassword($id, $new_password) {
        $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
        
        $query = "UPDATE " . $this->table_name . "
                SET password = :password,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = :id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":password", $hashed_password);
        $stmt->bindParam(":id", $id);

        return $stmt->execute();
    }

    // Проверка текущего пароля
    public function verifyPassword($id, $password) {
        $query = "SELECT password FROM " . $this->table_name . " WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        $stmt->execute();
        
        if($stmt->rowCount() == 1) {
            $user = $stmt->fetch();
            return password_verify($password, $user['password']);
        }
        return false;
    }
}
?>