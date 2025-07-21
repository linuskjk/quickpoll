<?php
$id = $_GET['id'] ?? '';
$path = "../polls/$id.json";

if (!file_exists($path)) {
  echo json_encode(['status' => 'error']);
  exit;
}

$data = json_decode(file_get_contents($path), true);
echo json_encode(['status' => 'ok', 'options' => $data['options']]);
