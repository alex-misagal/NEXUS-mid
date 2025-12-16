<?php
// RideKadaApps/php/get_driver_documents.php
// Retrieves driver's uploaded documents

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();
require_once 'connect.php';

// Check if database connection exists
if (!$conn) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed',
        'debug' => 'Check connect.php'
    ]);
    exit;
}

// Check if driver_documents table exists
$tableCheck = $conn->query("SHOW TABLES LIKE 'driver_documents'");
if (!$tableCheck || $tableCheck->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Documents table not found. Please run the SQL setup script.',
        'debug' => 'Table driver_documents does not exist',
        'action' => 'Run add_driver_documents_table.sql in phpMyAdmin'
    ]);
    exit;
}

$driverId = isset($_GET['driverId']) ? intval($_GET['driverId']) : 0;

if ($driverId <= 0) {
    // Try to get from session
    if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
        $driverId = intval($_SESSION['user']['DriverID'] ?? 0);
    }
}

if ($driverId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid driver ID',
        'debug' => 'No driver ID provided in GET parameter or session'
    ]);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT 
            DocumentID,
            DocumentType,
            FileName,
            FilePath,
            FileSize,
            MimeType,
            UploadedAt,
            Status,
            RejectionReason
        FROM driver_documents
        WHERE DriverID = ?
        ORDER BY UploadedAt DESC
    ");
    
    if (!$stmt) {
        throw new Exception('Failed to prepare statement: ' . $conn->error);
    }
    
    $stmt->bind_param("i", $driverId);
    
    if (!$stmt->execute()) {
        throw new Exception('Failed to execute statement: ' . $stmt->error);
    }
    
    $result = $stmt->get_result();
    
    $documents = [];
    while ($row = $result->fetch_assoc()) {
        $documents[] = [
            'documentId' => $row['DocumentID'],
            'documentType' => $row['DocumentType'],
            'fileName' => $row['FileName'],
            'filePath' => $row['FilePath'],
            'fileSize' => $row['FileSize'],
            'mimeType' => $row['MimeType'],
            'uploadedAt' => $row['UploadedAt'],
            'status' => $row['Status'],
            'rejectionReason' => $row['RejectionReason']
        ];
    }
    
    $stmt->close();
    
    echo json_encode([
        'success' => true,
        'documents' => $documents,
        'count' => count($documents),
        'driverId' => $driverId
    ]);
    
} catch (Exception $e) {
    error_log("Get documents error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to retrieve documents',
        'debug' => $e->getMessage()
    ]);
}

$conn->close();
?>