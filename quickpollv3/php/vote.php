<?php
$id = $_POST['id'] ?? '';

// --- Expiry check ---
function expire_and_delete_poll($id) {
    $pollFile = "../polls/$id.json";
    if (!file_exists($pollFile)) return false;
    $data = json_decode(file_get_contents($pollFile), true);
    if (!$data || !isset($data['created_at'])) return false;
    if (time() - $data['created_at'] > 3600) {
        unlink($pollFile);
        foreach (glob("../polls/{$id}-*.txt") as $voteFile) {
            unlink($voteFile);
        }
        return true;
    }
    return false;
}
if (expire_and_delete_poll($id)) {
    echo json_encode(['status' => 'expired']);
    exit;
}
// --- End expiry check ---

$options = json_decode($_POST['options'] ?? '[]');
if (!is_array($options)) $options = [$options];

$ip = $_SERVER['REMOTE_ADDR'];
$log = "../polls/$id-$ip.txt";

$path = "../polls/$id.json";
if (!file_exists($path)) {
  echo json_encode(['status' => 'error']);
  exit;
}

$data = json_decode(file_get_contents($path), true);

// Prevent double voting
if (file_exists($log)) {
  echo json_encode(['status' => 'error']);
  exit;
}

// Make sure options are valid indexes
foreach ($options as $opt) {
  $opt = (int)$opt;
  if (!isset($data['options'][$opt])) continue;
  $data['options'][$opt]['votes'] += 1;
}
file_put_contents($path, json_encode($data));
file_put_contents($log, "voted");

echo json_encode(['status' => 'ok']);
