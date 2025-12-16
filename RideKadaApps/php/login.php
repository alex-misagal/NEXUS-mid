<?php
// RideKadaApps/php/login.php - UPDATED VERSION
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents('php://input'), true);

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(["success" => false, "message" => "Please provide email and password."]);
    exit;
}

try {
    // First check if it's a passenger (user table)
    $stmt = $conn->prepare("SELECT UserID, Fname, Lname, Email, PhoneNumber, 'Passenger' as UserType FROM user WHERE Email = ? AND Password = ?");
    $stmt->bind_param("ss", $email, $password);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        echo json_encode([
            "success" => true,
            "user" => $user,
            "redirectTo" => "home.html"
        ]);
        $stmt->close();
        exit;
    }
    $stmt->close();

    // Check if it's a driver
    $stmt = $conn->prepare("SELECT DriverID, Fname, Lname, Email, PhoneNumber, Status, 'Driver' as UserType FROM driver WHERE Email = ? AND Password = ?");
    $stmt->bind_param("ss", $email, $password);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $driver = $result->fetch_assoc();
        
        // Check driver status
        switch ($driver['Status']) {
            case 'Pending':
                echo json_encode([
                    "success" => false,
                    "message" => "Your account is pending admin approval. Please wait for verification."
                ]);
                $stmt->close();
                exit;
                
            case 'Declined':
                echo json_encode([
                    "success" => false,
                    "message" => "Your registration has been declined. Please contact admin for more information."
                ]);
                $stmt->close();
                exit;
                
            case 'Suspended':
                echo json_encode([
                    "success" => false,
                    "message" => "Your account has been suspended. Please contact admin."
                ]);
                $stmt->close();
                exit;
                
            case 'Inactive':
                echo json_encode([
                    "success" => false,
                    "message" => "Your account is inactive. Please contact admin to reactivate."
                ]);
                $stmt->close();
                exit;
                
            case 'Active':
                echo json_encode([
                    "success" => true,
                    "user" => $driver,
                    "redirectTo" => "driver_dashboard.html"
                ]);
                $stmt->close();
                exit;
                
            default:
                echo json_encode([
                    "success" => false,
                    "message" => "Invalid account status. Please contact admin."
                ]);
                $stmt->close();
                exit;
        }
    }
    $stmt->close();

    // No match found
    echo json_encode([
        "success" => false,
        "message" => "Invalid email or password."
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Server error. Please try again."
    ]);
}

$conn->close();
?>