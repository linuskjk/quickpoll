<?php
$id = $_POST['id'] ?? '';
$opt = (int)($_POST['option'] ?? -1);
$ip = $_SERVER['REMOTE_ADDR'];
$log = "../polls/$id-$ip.txt";

if (file_exists($log)) {
  echo json_encode(['status' => 'error']);
  exit;
}

$path = "../polls/$id.json";
if (!file_exists($path)) {
  echo json_encode(['status' => 'error']);
  exit;
}

$data = json_decode(file_get_contents($path), true);
if (!isset($data['options'][$opt])) {
  echo json_encode(['status' => 'error']);
  exit;
}

$data['options'][$opt]['votes'] += 1;
file_put_contents($path, json_encode($data));
file_put_contents($log, "voted");

echo json_encode(['status' => 'ok']);
