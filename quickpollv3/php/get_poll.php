<?php
// filepath: \\ds920\web\quickpoll\php\get_poll.php
error_reporting(E_ALL);
ini_set('display_errors', 1);
$id = $_GET['id'] ?? '';

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

$path = "../polls/$id.json";
if (!file_exists($path)) {
  echo json_encode(['status' => 'error']);
  exit;
}

$data = json_decode(file_get_contents($path), true);
echo json_encode([
    'status' => 'ok',
    'title' => $data['title'],
    'theme' => $data['theme'] ?? 'default',
    'multiple' => $data['multiple'] ?? false, // <-- ADD THIS LINE
    'options' => array_map(fn($o) => $o['name'], $data['options'])
]);