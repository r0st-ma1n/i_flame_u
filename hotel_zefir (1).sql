-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Ноя 10 2025 г., 11:18
-- Версия сервера: 10.4.32-MariaDB
-- Версия PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `hotel_zefir`
--

DELIMITER $$
--
-- Процедуры
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `CleanupOldCarts` ()   BEGIN
    -- Удаляем элементы корзины старше 24 часов
    DELETE FROM cart_items 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    AND order_id IN (
        SELECT order_id FROM orders 
        WHERE status = 'pending'
    );
    
    -- Удаляем пустые заказы старше 24 часов
    DELETE FROM orders 
    WHERE status = 'pending' 
    AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    AND order_id NOT IN (
        SELECT DISTINCT order_id FROM cart_items
    );
END$$

--
-- Функции
--
CREATE DEFINER=`root`@`localhost` FUNCTION `CalculateOrderTotal` (`order_id` INT) RETURNS DECIMAL(10,2) DETERMINISTIC READS SQL DATA BEGIN
    DECLARE total_amount DECIMAL(10,2);
    
    SELECT SUM(ci.quantity * ci.price) INTO total_amount
    FROM cart_items ci
    WHERE ci.order_id = order_id;
    
    RETURN COALESCE(total_amount, 0);
END$$

CREATE DEFINER=`root`@`localhost` FUNCTION `IncrementLoginCount` (`user_id` INT) RETURNS INT(11) DETERMINISTIC READS SQL DATA BEGIN
    DECLARE current_count INT;
    
    -- Вставляем или обновляем запись
    INSERT INTO user_login_stats (user_id, login_count, last_login) 
    VALUES (user_id, 1, NOW())
    ON DUPLICATE KEY UPDATE 
        login_count = login_count + 1,
        last_login = NOW();
    
    -- Получаем текущее количество
    SELECT login_count INTO current_count 
    FROM user_login_stats 
    WHERE user_id = user_id;
    
    RETURN current_count;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Структура таблицы `cart_items`
--

CREATE TABLE `cart_items` (
  `cart_item_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `room_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT 1,
  `check_in_date` date DEFAULT NULL,
  `check_out_date` date DEFAULT NULL,
  `guests_count` int(11) DEFAULT 1,
  `price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Триггеры `cart_items`
--
DELIMITER $$
CREATE TRIGGER `CheckRoomAvailabilityBeforeCart` BEFORE INSERT ON `cart_items` FOR EACH ROW BEGIN
    DECLARE room_available INT DEFAULT 0;
    DECLARE room_capacity INT;
    
    -- Простая проверка доступности комнаты
    SELECT is_available INTO room_available
    FROM rooms 
    WHERE room_id = NEW.room_id;
    
    -- Проверяем вместимость номера
    SELECT capacity INTO room_capacity
    FROM rooms 
    WHERE room_id = NEW.room_id;
    
    IF room_available = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Номер недоступен';
    END IF;
    
    IF NEW.guests_count > room_capacity THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Превышена вместимость номера';
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `UpdateOrderTotalAfterCartChange` AFTER INSERT ON `cart_items` FOR EACH ROW BEGIN
    DECLARE order_total DECIMAL(10,2);
    
    SET order_total = CalculateOrderTotal(NEW.order_id);
    
    UPDATE orders 
    SET total_amount = order_total,
        updated_at = NOW()
    WHERE order_id = NEW.order_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Структура таблицы `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `total_amount` decimal(10,2) DEFAULT 0.00,
  `status` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
  `customer_name` varchar(100) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `special_requests` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `rooms`
--

CREATE TABLE `rooms` (
  `room_id` int(11) NOT NULL,
  `room_name` varchar(100) NOT NULL,
  `room_type` varchar(50) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `capacity` int(11) DEFAULT 2,
  `is_available` tinyint(1) DEFAULT 1,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `rooms`
--

INSERT INTO `rooms` (`room_id`, `room_name`, `room_type`, `price`, `capacity`, `is_available`, `description`) VALUES
(1, 'Королевский Люкс', 'luxury', 29000.00, 2, 1, 'Роскошный номер с видом на город'),
(2, 'Двухместный номер с видом на море', 'standard', 15000.00, 2, 1, 'Комфортный номер с видом на море'),
(3, 'Двухместный номер', 'standard', 12000.00, 2, 1, 'Стандартный двухместный номер'),
(4, 'Трехместный номер с видом на море', 'family', 18000.00, 3, 1, 'Просторный номер для семьи');

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `birthdate`, `country`, `address`, `password`, `created_at`, `updated_at`) VALUES
(1, 'Test', 'User', 'test1762485063@test.com', '1234567890', NULL, NULL, NULL, '$2y$10$WZLRZPkQT3u5mq8Z9Ae6zO2Pu8SCN8z6Pbf90.CEltD2yw7j0slv2', '2025-11-07 03:11:03', '2025-11-07 03:11:03'),
(3, 'Test', 'User', 'test1762486645@test.com', '1234567890', NULL, NULL, NULL, '$2y$10$8r6fF9nObmeDYHDt17beo.GQSnk0IbyzJ13QhBbwdMKjKopw6I0JC', '2025-11-07 03:37:25', '2025-11-07 03:37:25'),
(6, 'Тест', 'Тестов', 'test@test.com', '1234567890', NULL, NULL, NULL, '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2025-11-07 07:05:47', '2025-11-07 07:05:47'),
(11, 'ввввв', 'ввввввв', 'parslexsei@gmail.com', '89128185858', NULL, NULL, NULL, '$2y$10$fZvZN7.55D0oajdR64izzONmBll8NGUhKSSowUppMivSGY06BY1KS', '2025-11-10 09:56:51', '2025-11-10 09:56:51');

--
-- Триггеры `users`
--
DELIMITER $$
CREATE TRIGGER `after_user_insert` AFTER INSERT ON `users` FOR EACH ROW BEGIN
    INSERT INTO user_audit_log (user_id, action, changed_fields, changed_at)
    VALUES (NEW.id, 'CREATE', 
            CONCAT('first_name:', NEW.first_name, ';',
                   'last_name:', NEW.last_name, ';',
                   'email:', NEW.email, ';',
                   'phone:', NEW.phone),
            NOW());
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_user_update` AFTER UPDATE ON `users` FOR EACH ROW BEGIN
    INSERT INTO user_audit_log (user_id, action, changed_fields, changed_at)
    VALUES (NEW.id, 'UPDATE', 
            CONCAT('first_name:', OLD.first_name, '->', NEW.first_name, ';',
                   'last_name:', OLD.last_name, '->', NEW.last_name, ';',
                   'email:', OLD.email, '->', NEW.email, ';',
                   'phone:', OLD.phone, '->', NEW.phone),
            NOW());
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Структура таблицы `user_audit_log`
--

CREATE TABLE `user_audit_log` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL,
  `changed_fields` text DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `user_login_stats`
--

CREATE TABLE `user_login_stats` (
  `user_id` int(11) NOT NULL,
  `login_count` int(11) DEFAULT 1,
  `last_login` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`cart_item_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Индексы таблицы `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`);

--
-- Индексы таблицы `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`room_id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Индексы таблицы `user_audit_log`
--
ALTER TABLE `user_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Индексы таблицы `user_login_stats`
--
ALTER TABLE `user_login_stats`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `cart_item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT для таблицы `rooms`
--
ALTER TABLE `rooms`
  MODIFY `room_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT для таблицы `user_audit_log`
--
ALTER TABLE `user_audit_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `cart_items`
--
ALTER TABLE `cart_items`
  ADD CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  ADD CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`room_id`);

--
-- Ограничения внешнего ключа таблицы `user_audit_log`
--
ALTER TABLE `user_audit_log`
  ADD CONSTRAINT `user_audit_log_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Ограничения внешнего ключа таблицы `user_login_stats`
--
ALTER TABLE `user_login_stats`
  ADD CONSTRAINT `user_login_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
