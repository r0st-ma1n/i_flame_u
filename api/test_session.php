<?php
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');

echo json_encode([
    'session_id' => session_id(),
    'user_id' => $_SESSION['user_id'] ?? 'not_set',
    'session_data' => $_SESSION
]);
?>