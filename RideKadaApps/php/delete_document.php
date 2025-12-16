<?php
// RideKadaApps/php/delete_document.php
// Deletes a driver's document

header('Content-Type: application/json');
session_start();
require_once 'connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$documentId = isset($data['documentId']) ? intval($data['documentId']) : 0;
$driverId = isset($data['driverId']) ? intval($data['driverId']) : 0;

if ($documentId <= 0 || $driverId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid document or driver ID'
    ]);
    exit;
}

try {
    // Get document info
    $stmt = $conn->prepare("
        SELECT FilePath 
        FROM driver_documents 
        WHERE DocumentID = ? AND DriverID = ?
    ");
    $stmt->bind_param("ii", $documentId, $driverId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Document not found'
        ]);
        exit;
    }
    
    $doc = $result->fetch_assoc();
    $stmt->close();
    
    // Delete file from filesystem
    $filePath = __DIR__ . '/../' . $doc['FilePath'];
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    
    // Delete from database
    $deleteStmt = $conn->prepare("
        DELETE FROM driver_documents 
        WHERE DocumentID = ? AND DriverID = ?
    ");
    $deleteStmt->bind_param("ii", $documentId, $driverId);
    $deleteStmt->execute();
    $deleteStmt->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Document deleted successfully'
    ]);
    
} catch (Exception $e) {
    error_log("Delete document error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete document'
    ]);
}

$conn->close();
?>