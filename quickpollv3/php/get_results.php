<?php
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


$path = "../polls/$id.json";
if (!file_exists($path)) {
  echo json_encode(['status' => 'error']);
  exit;
}

$data = json_decode(file_get_contents($path), true);
echo json_encode([
    'status' => 'ok',
    'theme' => $data['theme'] ?? 'default', // Add this line
    'options' => $data['options']
]);
