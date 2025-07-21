<?php
// filepath: \\ds920\web\quickpoll\php\get_poll.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$id = $_GET['id'] ?? '';
$path = "../polls/$id.json";

if (!file_exists($path)) {
  echo json_encode(['status' => 'error']);
  exit;
}

$data = json_decode(file_get_contents($path), true);
echo json_encode(['status' => 'ok', 'title' => $data['title'], 'options' => array_map(fn($o) => $o['name'], $data['options'])]);