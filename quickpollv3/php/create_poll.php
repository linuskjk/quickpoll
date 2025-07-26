<?php
$id = uniqid();
$title = $_POST['title'] ?? '';
$options = json_decode($_POST['options'] ?? '[]');
$theme = $_POST['theme'] ?? 'default';
// FIX: Convert string to boolean
$multiple = isset($_POST['multiple']) && ($_POST['multiple'] === 'true' || $_POST['multiple'] === true);

$data = [
  'title' => $title,
  'created_at' => time(),
  'theme' => $theme,
  'multiple' => $multiple, // store as boolean!
  'options' => array_map(fn($o) => ['name' => $o, 'votes' => 0], $options)
];

file_put_contents("../polls/$id.json", json_encode($data));
echo json_encode(['status' => 'ok', 'id' => $id]);
