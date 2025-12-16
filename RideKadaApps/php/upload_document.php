<?php
// RideKadaApps/php/upload_document.php
// Handles driver document uploads

header('Content-Type: application/json');
session_start();
require_once 'connect.php';

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Maximum file size (5MB)
define('MAX_FILE_SIZE', 5 * 1024 * 1024);

// Allowed file types
$allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
];

$allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];

// Upload directory
$uploadDir = __DIR__ . '/../uploads/driver_documents/';

// Create upload directory if it doesn't exist
if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create upload directory'
        ]);
        exit;
    }
}

// Get driver ID from POST or session
$driverId = isset($_POST['driverId']) ? intval($_POST['driverId']) : 0;

if ($driverId <= 0) {
    // Try to get from session
    if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
        $driverId = intval($_SESSION['user']['DriverID'] ?? 0);
    }
}

if ($driverId <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid driver ID. Please login again.'
    ]);
    exit;
}

// Check if driver exists
$stmt = $conn->prepare("SELECT DriverID FROM driver WHERE DriverID = ?");
$stmt->bind_param("i", $driverId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Driver not found'
    ]);
    exit;
}
$stmt->close();

// Validate document type
$documentType = $_POST['documentType'] ?? '';
$validTypes = ['License', 'VehicleRegistration', 'Insurance', 'Other'];

if (!in_array($documentType, $validTypes)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid document type'
    ]);
    exit;
}

// Check if file was uploaded
if (!isset($_FILES['document']) || $_FILES['document']['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION => 'File upload stopped by extension'
    ];
    
    $errorCode = $_FILES['document']['error'] ?? UPLOAD_ERR_NO_FILE;
    $errorMsg = $errorMessages[$errorCode] ?? 'Unknown upload error';
    
    echo json_encode([
        'success' => false,
        'message' => $errorMsg
    ]);
    exit;
}

$file = $_FILES['document'];

// Validate file size
if ($file['size'] > MAX_FILE_SIZE) {
    echo json_encode([
        'success' => false,
        'message' => 'File size exceeds 5MB limit'
    ]);
    exit;
}

// Validate file type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedTypes)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file type. Only JPG, PNG, and PDF files are allowed.'
    ]);
    exit;
}

// Validate file extension
$fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($fileExtension, $allowedExtensions)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid file extension. Only .jpg, .jpeg, .png, and .pdf are allowed.'
    ]);
    exit;
}

try {
    // Generate unique filename
    $timestamp = time();
    $randomString = bin2hex(random_bytes(8));
    $newFileName = "driver_{$driverId}_{$documentType}_{$timestamp}_{$randomString}.{$fileExtension}";
    $filePath = $uploadDir . $newFileName;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Failed to move uploaded file');
    }
    
    // Store relative path for database
    $relativePath = 'uploads/driver_documents/' . $newFileName;
    
    // Check if document already exists for this driver and type
    $checkStmt = $conn->prepare("
        SELECT DocumentID, FilePath 
        FROM driver_documents 
        WHERE DriverID = ? AND DocumentType = ?
    ");
    $checkStmt->bind_param("is", $driverId, $documentType);
    $checkStmt->execute();
    $existingDoc = $checkStmt->get_result();
    
    if ($existingDoc->num_rows > 0) {
        // Delete old file
        $oldDoc = $existingDoc->fetch_assoc();
        $oldFilePath = __DIR__ . '/../' . $oldDoc['FilePath'];
        if (file_exists($oldFilePath)) {
            unlink($oldFilePath);
        }
        
        // Update existing record
        $updateStmt = $conn->prepare("
            UPDATE driver_documents 
            SET FileName = ?, FilePath = ?, FileSize = ?, MimeType = ?, 
                UploadedAt = CURRENT_TIMESTAMP, Status = 'Pending', RejectionReason = NULL
            WHERE DriverID = ? AND DocumentType = ?
        ");
        $updateStmt->bind_param("ssiiss", 
            $file['name'], 
            $relativePath, 
            $file['size'], 
            $mimeType, 
            $driverId, 
            $documentType
        );
        $updateStmt->execute();
        $documentId = $oldDoc['DocumentID'];
        $updateStmt->close();
    } else {
        // Insert new record
        $insertStmt = $conn->prepare("
            INSERT INTO driver_documents 
            (DriverID, DocumentType, FileName, FilePath, FileSize, MimeType, Status)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending')
        ");
        $insertStmt->bind_param("isssis", 
            $driverId, 
            $documentType, 
            $file['name'], 
            $relativePath, 
            $file['size'], 
            $mimeType
        );
        $insertStmt->execute();
        $documentId = $conn->insert_id;
        $insertStmt->close();
    }
    
    $checkStmt->close();
    
    // Update driver's document submission status
    $updateDriverStmt = $conn->prepare("
        UPDATE driver 
        SET DocumentsSubmitted = 1 
        WHERE DriverID = ?
    ");
    $updateDriverStmt->bind_param("i", $driverId);
    $updateDriverStmt->execute();
    $updateDriverStmt->close();
    
    echo json_encode([
        'success' => true,
        'message' => 'Document uploaded successfully',
        'documentId' => $documentId,
        'fileName' => $file['name'],
        'documentType' => $documentType
    ]);
    
} catch (Exception $e) {
    // Delete file if database insert failed
    if (isset($filePath) && file_exists($filePath)) {
        unlink($filePath);
    }
    
    error_log("Document upload error: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Failed to upload document: ' . $e->getMessage()
    ]);
}

$conn->close();
?>