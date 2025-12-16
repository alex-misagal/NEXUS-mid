<?php
// RideKadaApps/php/test_documents.php
// Diagnostic script to check document upload system

header('Content-Type: application/json');
require_once 'connect.php';

$response = [
    'status' => 'Testing Document Upload System',
    'checks' => []
];

// Check 1: Database connection
if ($conn) {
    $response['checks']['database'] = [
        'status' => 'OK',
        'message' => 'Database connected successfully'
    ];
} else {
    $response['checks']['database'] = [
        'status' => 'FAIL',
        'message' => 'Database connection failed'
    ];
    echo json_encode($response);
    exit;
}

// Check 2: Does driver_documents table exist?
$tableCheck = $conn->query("SHOW TABLES LIKE 'driver_documents'");
if ($tableCheck && $tableCheck->num_rows > 0) {
    $response['checks']['table_exists'] = [
        'status' => 'OK',
        'message' => 'driver_documents table exists'
    ];
    
    // Get table structure
    $structure = $conn->query("DESCRIBE driver_documents");
    $columns = [];
    while ($row = $structure->fetch_assoc()) {
        $columns[] = $row['Field'];
    }
    $response['checks']['table_structure'] = [
        'status' => 'OK',
        'columns' => $columns
    ];
    
    // Count documents
    $count = $conn->query("SELECT COUNT(*) as total FROM driver_documents");
    $total = $count->fetch_assoc()['total'];
    $response['checks']['document_count'] = [
        'status' => 'OK',
        'total_documents' => $total
    ];
    
} else {
    $response['checks']['table_exists'] = [
        'status' => 'FAIL',
        'message' => 'driver_documents table does NOT exist - You need to run the SQL script!',
        'action' => 'Run add_driver_documents_table.sql in phpMyAdmin'
    ];
}

// Check 3: Does driver table have new columns?
$driverColumns = $conn->query("DESCRIBE driver");
$driverCols = [];
while ($row = $driverColumns->fetch_assoc()) {
    $driverCols[] = $row['Field'];
}

if (in_array('DocumentsSubmitted', $driverCols) && in_array('DocumentsVerified', $driverCols)) {
    $response['checks']['driver_table_updated'] = [
        'status' => 'OK',
        'message' => 'Driver table has new columns'
    ];
} else {
    $response['checks']['driver_table_updated'] = [
        'status' => 'FAIL',
        'message' => 'Driver table missing DocumentsSubmitted/DocumentsVerified columns',
        'action' => 'Run the ALTER TABLE commands from the SQL script'
    ];
}

// Check 4: Upload directory exists and is writable
$uploadDir = __DIR__ . '/../uploads/driver_documents/';
if (file_exists($uploadDir)) {
    if (is_writable($uploadDir)) {
        $response['checks']['upload_directory'] = [
            'status' => 'OK',
            'message' => 'Upload directory exists and is writable',
            'path' => $uploadDir
        ];
    } else {
        $response['checks']['upload_directory'] = [
            'status' => 'WARNING',
            'message' => 'Upload directory exists but is NOT writable',
            'path' => $uploadDir,
            'action' => 'Run: chmod -R 755 uploads'
        ];
    }
} else {
    $response['checks']['upload_directory'] = [
        'status' => 'FAIL',
        'message' => 'Upload directory does NOT exist',
        'path' => $uploadDir,
        'action' => 'Create directory: mkdir -p uploads/driver_documents'
    ];
}

// Check 5: Test query with a sample driver
$testDriver = $conn->query("SELECT DriverID, FirstName, LastName FROM driver LIMIT 1");
if ($testDriver && $testDriver->num_rows > 0) {
    $driver = $testDriver->fetch_assoc();
    $response['checks']['test_driver'] = [
        'status' => 'OK',
        'message' => 'Found test driver',
        'driver_id' => $driver['DriverID'],
        'name' => $driver['FirstName'] . ' ' . $driver['LastName']
    ];
    
    // Try to get documents for this driver
    if ($tableCheck && $tableCheck->num_rows > 0) {
        $docs = $conn->query("SELECT * FROM driver_documents WHERE DriverID = " . $driver['DriverID']);
        $response['checks']['test_driver_docs'] = [
            'status' => 'OK',
            'message' => 'Query executed successfully',
            'documents_found' => $docs->num_rows
        ];
    }
} else {
    $response['checks']['test_driver'] = [
        'status' => 'WARNING',
        'message' => 'No drivers found in database'
    ];
}

// Overall status
$allPassed = true;
foreach ($response['checks'] as $check) {
    if ($check['status'] === 'FAIL') {
        $allPassed = false;
        break;
    }
}

$response['overall_status'] = $allPassed ? 'READY' : 'NEEDS SETUP';
$response['summary'] = $allPassed 
    ? 'Document upload system is ready to use!' 
    : 'Some setup steps are required. Check the details above.';

echo json_encode($response, JSON_PRETTY_PRINT);

$conn->close();
?>