<?php
// RideKadaApps/php/get_announcements.php
// API endpoint for users to fetch active announcements

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

include 'connect.php';

try {
    // Get only active announcements, ordered by most recent first
    $stmt = $conn->prepare("
        SELECT 
            AnnouncementID,
            Title,
            Message,
            CreatedAt
        FROM announcements 
        WHERE IsActive = 1 
        ORDER BY CreatedAt DESC 
        LIMIT 10
    ");
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $announcements = [];
    while ($row = $result->fetch_assoc()) {
        $announcements[] = [
            'id' => $row['AnnouncementID'],
            'title' => $row['Title'],
            'message' => $row['Message'],
            'date' => $row['CreatedAt']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'count' => count($announcements),
        'announcements' => $announcements
    ]);
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch announcements',
        'error' => $e->getMessage()
    ]);
}

$conn->close();
?>