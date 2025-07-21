<?php
$id = uniqid();
$title = $_POST['title'] ?? '';
$options = json_decode($_POST['options'] ?? '[]');

$data = [
  'title' => $title,
  'options' => array_map(fn($o) => ['name' => $o, 'votes' => 0], $options)
];

file_put_contents("../polls/$id.json", json_encode($data));
echo json_encode(['status' => 'ok', 'id' => $id]);
