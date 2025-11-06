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
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Проверка существования пользователя
    public function emailExists() {
        $query = "SELECT id, first_name, last_name, password 
                  FROM " . $this->table_name . " 
                  WHERE email = ? 
                  LIMIT 0,1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(1, $this->email);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->first_name = $row['first_name'];
            $this->last_name = $row['last_name'];
            $this->password = $row['password'];
            return true;
        }
        return false;
    }

    // Создание пользователя
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET first_name=:first_name, last_name=:last_name, 
                    email=:email, phone=:phone, password=:password";

        $stmt = $this->conn->prepare($query);

        // Очистка данных
        $this->first_name = htmlspecialchars(strip_tags($this->first_name));
        $this->last_name = htmlspecialchars(strip_tags($this->last_name));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->phone = htmlspecialchars(strip_tags($this->phone));

        // Хеширование пароля
        $this->password = password_hash($this->password, PASSWORD_DEFAULT);

        // Привязка значений
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":password", $this->password);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    // Вход пользователя
    public function login($password) {
        if($this->emailExists() && password_verify($password, $this->password)) {
            return true;
        }
        return false;
    }
}
?>