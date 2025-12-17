-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 16, 2025 at 11:10 PM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nexus-mid`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
CREATE TABLE IF NOT EXISTS `admin` (
  `AdminID` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`AdminID`),
  UNIQUE KEY `Username` (`Username`)
) ENGINE=MyISAM AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`AdminID`, `Username`, `Password`, `Email`, `CreatedAt`) VALUES
(2, 'admin', 'admin123', 'admin@ridekada.com', '2025-12-16 22:00:22');

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
CREATE TABLE IF NOT EXISTS `announcements` (
  `AnnouncementID` int NOT NULL AUTO_INCREMENT,
  `AdminID` int DEFAULT NULL,
  `Title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Announcement',
  `Message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `IsActive` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`AnnouncementID`)
) ENGINE=MyISAM AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

DROP TABLE IF EXISTS `booking`;
CREATE TABLE IF NOT EXISTS `booking` (
  `BookingID` int NOT NULL AUTO_INCREMENT,
  `RideID` int DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL,
  `PaymentStatus` varchar(20) DEFAULT NULL,
  `SeatCount` int DEFAULT NULL,
  `TotalFare` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`BookingID`),
  KEY `RideID` (`RideID`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`BookingID`, `RideID`, `Status`, `PaymentStatus`, `SeatCount`, `TotalFare`) VALUES
(1, 1, 'Cancelled', 'Paid', 1, 120.00),
(2, 2, 'Cancelled', 'Paid', 2, 180.00),
(3, 3, 'Cancelled', 'Unpaid', 1, 150.00),
(4, 4, 'Cancelled', 'Paid', 1, 200.00),
(5, 5, 'Completed', 'Paid', 1, 85.00),
(6, 6, 'Completed', 'Paid', 1, 140.00),
(7, 7, 'Completed', 'Paid', 1, 100.00),
(8, 8, 'Completed', 'Paid', 2, 230.00),
(9, 9, 'Cancelled', 'Unpaid', 1, 180.00),
(10, 10, 'Completed', 'Paid', 1, 220.00),
(11, 11, 'Completed', 'Paid', 1, 135.00),
(12, 12, 'Completed', 'Paid', 1, 145.00),
(13, 13, 'Completed', 'Paid', 2, 320.00),
(14, 14, 'Completed', 'Paid', 1, 175.00),
(15, 15, 'Completed', 'Paid', 1, 155.00);

-- --------------------------------------------------------

--
-- Table structure for table `driver`
--

DROP TABLE IF EXISTS `driver`;
CREATE TABLE IF NOT EXISTS `driver` (
  `DriverID` int NOT NULL AUTO_INCREMENT,
  `PhoneNumber` varchar(20) DEFAULT NULL,
  `Fname` varchar(50) DEFAULT NULL,
  `Lname` varchar(50) DEFAULT NULL,
  `Email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `Status` enum('Active','Suspended','Inactive','Pending','Declined') DEFAULT 'Pending',
  `DocumentsSubmitted` tinyint(1) DEFAULT '0',
  `DocumentsVerified` tinyint(1) DEFAULT '0',
  `Destination` varchar(255) DEFAULT NULL,
  `VehicleID` int DEFAULT NULL,
  PRIMARY KEY (`DriverID`),
  UNIQUE KEY `PhoneNumber` (`PhoneNumber`),
  KEY `VehicleID` (`VehicleID`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `driver`
--

INSERT INTO `driver` (`DriverID`, `PhoneNumber`, `Fname`, `Lname`, `Email`, `Password`, `Status`, `DocumentsSubmitted`, `DocumentsVerified`, `Destination`, `VehicleID`) VALUES
(1, '09981230001', 'Carlos', 'Mendoza', 'carlosm@gmail.com', 'driver123', 'Active', 1, 0, 'Session Road, Barangay Kabayanihan, Baguio City, Benguet 2600', 1),
(2, '09981230002', 'Jayson', 'Reyes', 'jaysonr@gmail.com', 'driver123', 'Active', 0, 0, 'La Trinidad Public Market, Km 5, Barangay Poblacion, La Trinidad, Benguet 2601', 2),
(3, '09981230003', 'Arthur', 'Lim', 'arthurl@gmail.com', 'driver123', 'Suspended', 0, 0, 'Tuba Town Proper, Barangay Poblacion, Tuba, Benguet 2603', 3),
(4, '09981230004', 'Leo', 'Tan', 'leotan@gmail.com', 'driver123', 'Active', 0, 0, 'Itogon Central Barangay Hall, Poblacion, Itogon, Benguet 2604', 4),
(5, '09981230005', 'Mark', 'Santos', 'marks@gmail.com', 'driver123', 'Active', 0, 0, 'Sablan Municipal Hall, Poblacion, Sablan, Benguet 2614', 5),
(6, '09981230006', 'Joshua', 'Cruz', 'joshuac@gmail.com', 'driver123', 'Active', 0, 0, 'Burnham Park, Jose Abad Santos Drive, Baguio City, Benguet 2600', 6),
(7, '09981230007', 'Nathan', 'Rivera', 'nathanr@gmail.com', 'driver123', 'Active', 0, 0, 'Tublay Trading Post, Poblacion, Tublay, Benguet 2615', 7),
(8, '09981230008', 'Patrick', 'Tan', 'patrickt@gmail.com', 'driver123', 'Active', 0, 0, 'Benguet State University, Km 6, La Trinidad, Benguet 2601', 8),
(9, '09981230009', 'Rico', 'Delos Reyes', 'ricodr@gmail.com', 'driver123', 'Suspended', 0, 0, 'SM Baguio Terminal, Upper Session Road, Baguio City, Benguet 2600', 9),
(10, '09981230010', 'Dennis', 'Villanueva', 'dennisv@gmail.com', 'driver123', 'Active', 0, 0, 'Mines View Park, Outlook Drive, Baguio City, Benguet 2600', 10),
(11, '09981230011', 'Ken', 'Morales', 'kenm@gmail.com', 'driver123', 'Active', 0, 0, 'Ambuklao Dam, Barangay Ambuklao, Bokod, Benguet 2605', 11),
(12, '09981230012', 'Oscar', 'Lopez', 'oscarl@gmail.com', 'driver123', 'Active', 0, 0, 'Northern Barangay Hall, Poblacion, Atok, Benguet 2602', 12),
(13, '09981230013', 'Sam', 'Flores', 'samf@gmail.com', 'driver123', 'Active', 0, 0, 'Sablan Viewdeck, Sitio Banangan, Sablan, Benguet 2614', 13),
(14, '09981230014', 'Gino', 'Santiago', 'ginos@gmail.com', 'driver123', 'Active', 0, 0, 'Tublay Municipal Hall, Barangay Ambongdolan, Tublay, Benguet 2615', 14),
(15, '09981230015', 'Allan', 'Ramos', 'allanr@gmail.com', 'driver123', 'Active', 0, 0, 'Our Lady of Atonement Cathedral, Upper Session Road, Baguio City, Benguet 2600', 15);

-- --------------------------------------------------------

--
-- Table structure for table `driver_documents`
--

DROP TABLE IF EXISTS `driver_documents`;
CREATE TABLE IF NOT EXISTS `driver_documents` (
  `DocumentID` int NOT NULL AUTO_INCREMENT,
  `DriverID` int NOT NULL,
  `DocumentType` enum('License','VehicleRegistration','Insurance','Other') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `FileName` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `FilePath` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `FileSize` int NOT NULL,
  `MimeType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `UploadedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `Status` enum('Pending','Approved','Rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `RejectionReason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`DocumentID`),
  KEY `idx_driver` (`DriverID`),
  KEY `idx_status` (`Status`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `driver_documents`
--

INSERT INTO `driver_documents` (`DocumentID`, `DriverID`, `DocumentType`, `FileName`, `FilePath`, `FileSize`, `MimeType`, `UploadedAt`, `Status`, `RejectionReason`) VALUES
(1, 1, 'License', 'IMG_20250523_213717.jpg', 'uploads/driver_documents/driver_1_License_1765922364_ad454b9850ce1ae1.jpg', 65186, 'image/jpeg', '2025-12-16 21:59:24', 'Pending', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `driver_notifications`
--

DROP TABLE IF EXISTS `driver_notifications`;
CREATE TABLE IF NOT EXISTS `driver_notifications` (
  `NotificationID` int NOT NULL AUTO_INCREMENT,
  `DriverID` int NOT NULL,
  `Title` varchar(255) NOT NULL,
  `Message` text NOT NULL,
  `IsRead` tinyint(1) DEFAULT '0',
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`NotificationID`),
  KEY `DriverID` (`DriverID`)
) ENGINE=MyISAM AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `driver_notifications`
--

INSERT INTO `driver_notifications` (`NotificationID`, `DriverID`, `Title`, `Message`, `IsRead`, `CreatedAt`) VALUES
(1, 1, 'New Booking Request', 'You have a new booking request for your ride to Camp 7 on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 16:41:00'),
(2, 1, 'New Booking Request', 'You have a new booking request for your ride to burnham on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 16:42:45'),
(3, 1, 'New Booking Request', 'You have a new booking request for your ride to burnham on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 16:47:57'),
(4, 1, 'New Booking Request', 'You have a new booking request for your ride to burnham on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 16:49:38'),
(5, 1, 'New Booking Request', 'You have a new booking request for your ride to Baguio on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 16:58:24'),
(6, 17, 'New Booking Request', 'You have a new booking request for your ride to bataan on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 17:00:08'),
(7, 16, 'New Booking Request', 'You have a new booking request for your ride to camdas on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 17:07:56'),
(8, 1, 'New Booking Request', 'You have a new booking request for your ride to Slaughter House on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 17:14:41'),
(9, 17, 'New Booking Request', 'You have a new booking request for your ride to session road on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 17:23:21'),
(10, 16, 'New Booking Request', 'You have a new booking request for your ride to camdas on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 17:24:01'),
(11, 1, 'New Booking Request', 'You have a new booking request for your ride to Slaughter House on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 17:33:38'),
(15, 1, 'New Booking Request', 'You have a new booking request for your ride to min on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 21:10:54'),
(16, 1, 'Payment Received', 'Payment of ₱125.00 received for ride to min on Dec 16, 2025', 0, '2025-12-16 21:11:18'),
(18, 19, 'New Booking Request', 'You have a new booking request for your ride to bataan on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 22:42:40'),
(19, 19, 'Payment Received', 'Payment of ₱22.00 received for ride to bataan on Dec 16, 2025', 0, '2025-12-16 22:42:57'),
(20, 19, 'New Review Received', 'aj penaflor rated your ride 5 ⭐: \"thankyou for the wonderful bembang\"', 0, '2025-12-16 22:44:05'),
(21, 5, 'New Booking Request', 'You have a new booking request for your ride to City on Dec 16, 2025. 1 seat(s) requested.', 0, '2025-12-16 22:53:22'),
(22, 5, 'Payment Received', 'Payment of ₱15.00 received for ride to City on Dec 16, 2025', 0, '2025-12-16 22:53:47'),
(23, 5, 'New Review Received', 'John Cruz rated your ride 5 ⭐: \"Free Wi-Fi\"', 0, '2025-12-16 22:54:26');

-- --------------------------------------------------------

--
-- Table structure for table `driver_reviews`
--

DROP TABLE IF EXISTS `driver_reviews`;
CREATE TABLE IF NOT EXISTS `driver_reviews` (
  `ReviewID` int NOT NULL AUTO_INCREMENT,
  `BookingID` int NOT NULL,
  `UserID` int NOT NULL,
  `DriverID` int NOT NULL,
  `Rating` int NOT NULL,
  `Comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `ReviewDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReviewID`),
  UNIQUE KEY `unique_booking_review` (`BookingID`),
  KEY `idx_driver` (`DriverID`),
  KEY `idx_user` (`UserID`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `driver_reviews`
--

INSERT INTO `driver_reviews` (`ReviewID`, `BookingID`, `UserID`, `DriverID`, `Rating`, `Comment`, `ReviewDate`) VALUES
(3, 19, 1, 5, 5, 'Free Wi-Fi', '2025-12-16 22:54:26');

-- --------------------------------------------------------

--
-- Table structure for table `driver_rides`
--

DROP TABLE IF EXISTS `driver_rides`;
CREATE TABLE IF NOT EXISTS `driver_rides` (
  `RideID` int NOT NULL AUTO_INCREMENT,
  `DriverID` int NOT NULL,
  `FromLocation` varchar(255) NOT NULL,
  `Destination` varchar(255) NOT NULL,
  `DateTime` datetime NOT NULL,
  `TotalSeats` int NOT NULL,
  `AvailableSeats` int NOT NULL,
  `Fare` decimal(10,2) NOT NULL,
  `Status` enum('Upcoming','Completed','Cancelled') DEFAULT 'Upcoming',
  `Notes` text,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`RideID`),
  KEY `DriverID` (`DriverID`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `driver_rides`
--

INSERT INTO `driver_rides` (`RideID`, `DriverID`, `FromLocation`, `Destination`, `DateTime`, `TotalSeats`, `AvailableSeats`, `Fare`, `Status`, `Notes`, `CreatedAt`) VALUES
(1, 1, 'Maryheights', 'session road', '2025-12-16 22:02:00', 2, 2, 100.00, 'Cancelled', '\nCancellation Reason: asd', '2025-12-16 14:43:29'),
(3, 16, 'Maryheights', 'camdas', '2025-12-17 00:03:00', 5, 5, 50.00, 'Cancelled', '\nCancellation Reason: nah', '2025-12-16 15:03:47'),
(4, 16, 'Maryheights', 'bataan', '2025-12-16 14:25:00', 4, 4, 50.00, 'Cancelled', '\nCancellation Reason: ha', '2025-12-16 15:25:44');

-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
CREATE TABLE IF NOT EXISTS `payment` (
  `PaymentID` int NOT NULL AUTO_INCREMENT,
  `BookingID` int DEFAULT NULL,
  `Amount` decimal(10,2) DEFAULT NULL,
  `PaymentMethod` varchar(50) DEFAULT NULL,
  `PaymentDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `Status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`PaymentID`),
  KEY `BookingID` (`BookingID`)
) ENGINE=MyISAM AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `payment`
--

INSERT INTO `payment` (`PaymentID`, `BookingID`, `Amount`, `PaymentMethod`, `PaymentDate`, `Status`) VALUES
(1, 1, 120.00, 'GCash', '2025-10-21 21:50:38', 'Completed'),
(2, 2, 180.00, 'Cash', '2025-10-21 21:50:38', 'Completed'),
(3, 4, 200.00, 'GCash', '2025-10-21 21:50:38', 'Completed'),
(4, 5, 85.00, 'Maya', '2025-10-21 21:50:38', 'Completed'),
(5, 6, 140.00, 'GCash', '2025-10-21 21:50:38', 'Completed'),
(6, 7, 100.00, 'Cash', '2025-10-21 21:50:38', 'Completed'),
(7, 8, 230.00, 'GCash', '2025-10-21 21:50:38', 'Completed'),
(8, 10, 220.00, 'Maya', '2025-10-21 21:50:38', 'Completed'),
(9, 11, 135.00, 'Cash', '2025-10-21 21:50:38', 'Completed'),
(10, 12, 145.00, 'GCash', '2025-10-21 21:50:38', 'Completed'),
(11, 13, 320.00, 'Maya', '2025-10-21 21:50:38', 'Completed'),
(12, 14, 175.00, 'GCash', '2025-10-21 21:50:38', 'Completed'),
(13, 15, 155.00, 'Cash', '2025-10-21 21:50:38', 'Completed'),
(14, 1, 50.00, 'GCash', '2025-12-17 00:02:46', 'Completed'),
(15, 2, 25.00, 'GCash', '2025-12-17 00:06:16', 'Completed'),
(16, 3, 33.00, 'GCash', '2025-12-17 00:15:38', 'Completed'),
(17, 14, 25.00, 'PayMaya', '2025-12-17 01:34:43', 'Completed'),
(18, 15, 12.00, 'PayMaya', '2025-12-17 04:51:13', 'Completed'),
(19, 17, 125.00, 'GCash', '2025-12-17 05:11:18', 'Completed'),
(20, 18, 22.00, 'GCash', '2025-12-17 06:42:57', 'Completed'),
(21, 19, 15.00, 'GCash', '2025-12-17 06:53:47', 'Completed');

-- --------------------------------------------------------

--
-- Table structure for table `published_rides`
--

DROP TABLE IF EXISTS `published_rides`;
CREATE TABLE IF NOT EXISTS `published_rides` (
  `PublishedRideID` int NOT NULL AUTO_INCREMENT,
  `DriverID` int NOT NULL,
  `FromLocation` varchar(255) NOT NULL DEFAULT 'Maryheights',
  `Destination` varchar(255) NOT NULL,
  `RideDate` date NOT NULL,
  `RideTime` time NOT NULL,
  `AvailableSeats` int NOT NULL,
  `PricePerSeat` decimal(10,2) NOT NULL,
  `Status` enum('Available','Full','Completed','Cancelled') DEFAULT 'Available',
  `Notes` text,
  `CreatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`PublishedRideID`),
  KEY `DriverID` (`DriverID`),
  KEY `idx_date` (`RideDate`),
  KEY `idx_destination` (`Destination`(250)),
  KEY `idx_status` (`Status`)
) ENGINE=MyISAM AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `published_rides`
--

INSERT INTO `published_rides` (`PublishedRideID`, `DriverID`, `FromLocation`, `Destination`, `RideDate`, `RideTime`, `AvailableSeats`, `PricePerSeat`, `Status`, `Notes`, `CreatedAt`, `UpdatedAt`) VALUES
(1, 16, 'Maryheights', 'camdas', '2025-12-16', '14:30:00', 3, 50.00, 'Available', '', '2025-12-16 15:28:35', '2025-12-16 17:07:56'),
(2, 16, 'Maryheights', 'camdas', '2025-12-16', '13:31:00', 3, 21.00, 'Available', '', '2025-12-16 15:29:12', '2025-12-16 17:24:01'),
(3, 17, 'Maryheights', 'bataan', '2025-12-16', '13:35:00', 3, 50.00, 'Available', '', '2025-12-16 15:35:23', '2025-12-16 17:00:08'),
(4, 17, 'Maryheights', 'session road', '2025-12-16', '13:38:00', 1, 50.00, 'Available', '', '2025-12-16 15:36:50', '2025-12-16 17:23:21'),
(5, 1, 'Maryheights', 'Baguio', '2025-12-16', '15:43:00', 1, 25.00, 'Available', '', '2025-12-16 15:44:04', '2025-12-16 16:58:24'),
(6, 1, 'Maryheights', 'Slaughter House', '2025-12-16', '15:04:00', 0, 25.00, 'Full', '', '2025-12-16 16:05:57', '2025-12-16 17:33:38'),
(7, 1, 'Maryheights', 'Camp 7', '2025-12-16', '14:14:00', 0, 33.00, 'Full', '', '2025-12-16 16:14:43', '2025-12-16 16:41:00'),
(8, 1, 'Maryheights', 'burnham', '2025-12-16', '14:41:00', 0, 23.00, 'Full', '', '2025-12-16 16:42:11', '2025-12-16 16:49:38'),
(9, 4, 'Maryheights', 'BONG', '2025-12-18', '04:49:00', 3, 12.00, 'Available', '', '2025-12-16 20:48:44', '2025-12-16 20:55:47'),
(10, 4, 'Maryheights', 'Skate', '2025-12-19', '07:49:00', 4, 24.00, 'Available', '', '2025-12-16 20:50:00', '2025-12-16 20:50:00'),
(11, 4, 'Maryheights', 'TANGINa', '2025-12-16', '05:50:00', 0, 12.00, 'Full', '', '2025-12-16 20:50:27', '2025-12-16 20:50:49'),
(12, 1, 'Maryheights', 'min', '2025-12-16', '00:00:07', 3, 125.00, 'Completed', '', '2025-12-16 21:10:14', '2025-12-16 21:15:52'),
(13, 19, 'Maryheights', 'bataan', '2025-12-16', '00:00:12', 1, 22.00, 'Completed', '', '2025-12-16 22:42:12', '2025-12-16 22:43:17'),
(14, 5, 'Maryheights', 'City', '2025-12-16', '00:00:16', 2, 15.00, 'Completed', '', '2025-12-16 22:53:08', '2025-12-16 22:54:02');

-- --------------------------------------------------------

--
-- Table structure for table `review`
--

DROP TABLE IF EXISTS `review`;
CREATE TABLE IF NOT EXISTS `review` (
  `ReviewID` int NOT NULL AUTO_INCREMENT,
  `PaymentID` int DEFAULT NULL,
  `Rating` int DEFAULT NULL,
  `Comment` text,
  `ReviewDate` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ReviewID`),
  KEY `PaymentID` (`PaymentID`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `review`
--

INSERT INTO `review` (`ReviewID`, `PaymentID`, `Rating`, `Comment`, `ReviewDate`) VALUES
(1, 1, 5, 'Driver was on time and polite.', '2025-10-21 21:50:38'),
(2, 2, 4, 'Smooth ride, but a bit pricey.', '2025-10-21 21:50:38'),
(3, 4, 5, 'Great experience!', '2025-10-21 21:50:38'),
(4, 5, 5, 'Driver was friendly.', '2025-10-21 21:50:38'),
(5, 6, 4, 'Good service overall.', '2025-10-21 21:50:38'),
(6, 7, 5, 'Clean car, good driver.', '2025-10-21 21:50:38'),
(7, 8, 4, 'Nice but took a longer route.', '2025-10-21 21:50:38'),
(8, 10, 5, 'Excellent service.', '2025-10-21 21:50:38'),
(9, 11, 4, 'Comfortable ride.', '2025-10-21 21:50:38'),
(10, 12, 5, 'Prompt and safe.', '2025-10-21 21:50:38'),
(11, 13, 5, 'Highly recommended driver.', '2025-10-21 21:50:38'),
(12, 14, 5, 'Friendly driver and clean car.', '2025-10-21 21:50:38'),
(13, 15, 5, 'Overall perfect experience.', '2025-10-21 21:50:38');

-- --------------------------------------------------------

--
-- Table structure for table `ride`
--

DROP TABLE IF EXISTS `ride`;
CREATE TABLE IF NOT EXISTS `ride` (
  `RideID` int NOT NULL AUTO_INCREMENT,
  `DriverID` int DEFAULT NULL,
  `UserID` int DEFAULT NULL,
  `DateTime` datetime DEFAULT NULL,
  `Fare` decimal(10,2) DEFAULT NULL,
  `Status` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`RideID`),
  KEY `DriverID` (`DriverID`),
  KEY `UserID` (`UserID`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ride`
--

INSERT INTO `ride` (`RideID`, `DriverID`, `UserID`, `DateTime`, `Fare`, `Status`) VALUES
(1, 1, 1, '2025-10-10 08:30:00', 120.00, 'Completed'),
(2, 2, 2, '2025-10-10 09:00:00', 90.00, 'Completed'),
(3, 3, 3, '2025-10-11 07:45:00', 150.00, 'Cancelled'),
(4, 4, 4, '2025-10-11 08:20:00', 200.00, 'Completed'),
(5, 5, 5, '2025-10-12 10:00:00', 85.00, 'Completed'),
(6, 6, 6, '2025-10-12 11:15:00', 140.00, 'Completed'),
(7, 7, 7, '2025-10-12 12:30:00', 100.00, 'Completed'),
(8, 8, 8, '2025-10-13 09:50:00', 115.00, 'Completed'),
(9, 9, 9, '2025-10-13 14:30:00', 180.00, 'Cancelled'),
(10, 10, 10, '2025-10-14 15:00:00', 220.00, 'Completed'),
(11, 11, 11, '2025-10-14 16:45:00', 135.00, 'Completed'),
(12, 12, 12, '2025-10-15 17:10:00', 145.00, 'Completed'),
(13, 13, 13, '2025-10-16 10:00:00', 160.00, 'Completed'),
(14, 14, 14, '2025-10-17 18:00:00', 175.00, 'Completed'),
(15, 15, 15, '2025-10-18 19:30:00', 155.00, 'Completed');

-- --------------------------------------------------------

--
-- Table structure for table `ride_bookings`
--

DROP TABLE IF EXISTS `ride_bookings`;
CREATE TABLE IF NOT EXISTS `ride_bookings` (
  `BookingID` int NOT NULL AUTO_INCREMENT,
  `PublishedRideID` int NOT NULL,
  `UserID` int NOT NULL,
  `SeatsBooked` int NOT NULL,
  `TotalFare` decimal(10,2) NOT NULL,
  `BookingStatus` enum('Pending','Confirmed','Cancelled','Completed') DEFAULT 'Pending',
  `PaymentStatus` enum('Unpaid','Paid') DEFAULT 'Unpaid',
  `BookingDate` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`BookingID`),
  KEY `idx_user` (`UserID`),
  KEY `idx_ride` (`PublishedRideID`),
  KEY `idx_status` (`BookingStatus`)
) ENGINE=MyISAM AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `ride_bookings`
--

INSERT INTO `ride_bookings` (`BookingID`, `PublishedRideID`, `UserID`, `SeatsBooked`, `TotalFare`, `BookingStatus`, `PaymentStatus`, `BookingDate`) VALUES
(1, 4, 1, 1, 50.00, 'Confirmed', 'Paid', '2025-12-16 16:02:46'),
(2, 6, 1, 1, 25.00, 'Confirmed', 'Paid', '2025-12-16 16:06:16'),
(3, 7, 1, 1, 33.00, 'Confirmed', 'Paid', '2025-12-16 16:15:38'),
(4, 7, 1, 1, 33.00, 'Confirmed', 'Unpaid', '2025-12-16 16:41:00'),
(5, 8, 1, 1, 23.00, 'Confirmed', 'Unpaid', '2025-12-16 16:42:45'),
(6, 8, 1, 1, 23.00, 'Confirmed', 'Unpaid', '2025-12-16 16:47:57'),
(7, 8, 1, 1, 23.00, 'Pending', 'Unpaid', '2025-12-16 16:49:38'),
(8, 5, 1, 1, 25.00, 'Pending', 'Unpaid', '2025-12-16 16:58:24'),
(9, 3, 1, 1, 50.00, 'Pending', 'Unpaid', '2025-12-16 17:00:08'),
(10, 1, 1, 1, 50.00, 'Pending', 'Unpaid', '2025-12-16 17:07:56'),
(11, 6, 1, 1, 25.00, 'Confirmed', 'Unpaid', '2025-12-16 17:14:41'),
(12, 4, 1, 1, 50.00, 'Pending', 'Unpaid', '2025-12-16 17:23:21'),
(13, 2, 1, 1, 21.00, 'Pending', 'Unpaid', '2025-12-16 17:24:01'),
(14, 6, 8, 1, 25.00, 'Confirmed', 'Paid', '2025-12-16 17:33:38'),
(15, 11, 1, 1, 12.00, 'Confirmed', 'Paid', '2025-12-16 20:50:49'),
(16, 9, 1, 1, 12.00, 'Confirmed', 'Unpaid', '2025-12-16 20:55:47'),
(17, 12, 1, 1, 125.00, 'Completed', 'Paid', '2025-12-16 21:10:54'),
(18, 13, 17, 1, 22.00, 'Completed', 'Paid', '2025-12-16 22:42:40'),
(19, 14, 1, 1, 15.00, 'Completed', 'Paid', '2025-12-16 22:53:22');

-- --------------------------------------------------------

--
-- Table structure for table `transactionhistory`
--

DROP TABLE IF EXISTS `transactionhistory`;
CREATE TABLE IF NOT EXISTS `transactionhistory` (
  `TransactionID` int NOT NULL AUTO_INCREMENT,
  `PaymentID` int DEFAULT NULL,
  `TransactionDate` datetime DEFAULT CURRENT_TIMESTAMP,
  `TotalAmount` decimal(10,2) DEFAULT NULL,
  `TransactionType` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`TransactionID`),
  KEY `PaymentID` (`PaymentID`)
) ENGINE=MyISAM AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transactionhistory`
--

INSERT INTO `transactionhistory` (`TransactionID`, `PaymentID`, `TransactionDate`, `TotalAmount`, `TransactionType`) VALUES
(1, 1, '2025-10-21 21:50:38', 120.00, 'Ride Payment'),
(2, 2, '2025-10-21 21:50:38', 180.00, 'Ride Payment'),
(3, 4, '2025-10-21 21:50:38', 200.00, 'Ride Payment'),
(4, 5, '2025-10-21 21:50:38', 85.00, 'Ride Payment'),
(5, 6, '2025-10-21 21:50:38', 140.00, 'Ride Payment'),
(6, 7, '2025-10-21 21:50:38', 100.00, 'Ride Payment'),
(7, 8, '2025-10-21 21:50:38', 230.00, 'Ride Payment'),
(8, 10, '2025-10-21 21:50:38', 220.00, 'Ride Payment'),
(9, 11, '2025-10-21 21:50:38', 135.00, 'Ride Payment'),
(10, 12, '2025-10-21 21:50:38', 145.00, 'Ride Payment'),
(11, 13, '2025-10-21 21:50:38', 320.00, 'Ride Payment'),
(12, 14, '2025-10-21 21:50:38', 175.00, 'Ride Payment'),
(13, 15, '2025-10-21 21:50:38', 155.00, 'Ride Payment'),
(14, 14, '2025-12-17 00:02:46', 50.00, 'Ride Payment'),
(15, 15, '2025-12-17 00:06:16', 25.00, 'Ride Payment'),
(16, 16, '2025-12-17 00:15:38', 33.00, 'Ride Payment'),
(17, 18, '2025-12-17 04:51:13', 12.00, 'Ride Payment'),
(18, 19, '2025-12-17 05:11:18', 125.00, 'Ride Payment'),
(19, 20, '2025-12-17 06:42:57', 22.00, 'Ride Payment'),
(20, 21, '2025-12-17 06:53:47', 15.00, 'Ride Payment');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `UserID` int NOT NULL AUTO_INCREMENT,
  `Fname` varchar(50) DEFAULT NULL,
  `Lname` varchar(50) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `PhoneNumber` varchar(20) DEFAULT NULL,
  `PCount` int DEFAULT '0',
  PRIMARY KEY (`UserID`),
  UNIQUE KEY `PhoneNumber` (`PhoneNumber`)
) ENGINE=MyISAM AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`UserID`, `Fname`, `Lname`, `Email`, `Password`, `PhoneNumber`, `PCount`) VALUES
(1, 'John', 'Cruz', 'johncruz@gmail.com', 'pass123', '09171234501', 3),
(2, 'Maria', 'Santos', 'marias@gmail.com', 'pass123', '09181234502', 5),
(3, 'Kevin', 'Lopez', 'kevinlopez@gmail.com', 'pass123', '09191234503', 1),
(4, 'Andrea', 'Torres', 'andreat@gmail.com', 'pass123', '09201234504', 2),
(5, 'Lance', 'Rivera', 'lancer@gmail.com', 'pass123', '09211234505', 4),
(6, 'Ella', 'Domingo', 'ellad@gmail.com', 'pass123', '09221234506', 1),
(7, 'Gabriel', 'Reyes', 'gabrielr@gmail.com', 'pass123', '09231234507', 6),
(8, 'Nicole', 'Tan', 'nicolet@gmail.com', 'pass123', '09241234508', 2),
(9, 'Francis', 'De Leon', 'francisdl@gmail.com', 'pass123', '09251234509', 0),
(10, 'Rhea', 'Manalo', 'rheam@gmail.com', 'pass123', '09261234510', 3),
(11, 'Miguel', 'Santiago', 'miguels@gmail.com', 'pass123', '09271234511', 2),
(12, 'Cathy', 'Lim', 'cathyl@gmail.com', 'pass123', '09281234512', 5),
(13, 'Patrick', 'Velasquez', 'patrickv@gmail.com', 'pass123', '09291234513', 1),
(14, 'Tina', 'Ramos', 'tinar@gmail.com', 'pass123', '09301234514', 4);

-- --------------------------------------------------------

--
-- Table structure for table `vehicle`
--

DROP TABLE IF EXISTS `vehicle`;
CREATE TABLE IF NOT EXISTS `vehicle` (
  `VehicleID` int NOT NULL AUTO_INCREMENT,
  `PlateNumber` varchar(20) DEFAULT NULL,
  `Model` varchar(50) DEFAULT NULL,
  `Color` varchar(30) DEFAULT NULL,
  `Capacity` int DEFAULT NULL,
  PRIMARY KEY (`VehicleID`),
  UNIQUE KEY `PlateNumber` (`PlateNumber`)
) ENGINE=MyISAM AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vehicle`
--

INSERT INTO `vehicle` (`VehicleID`, `PlateNumber`, `Model`, `Color`, `Capacity`) VALUES
(1, 'ABC1234', 'Toyota Vios', 'Red', 4),
(2, 'XYZ5678', 'Honda City', 'Black', 4),
(3, 'JKL2345', 'Mitsubishi Mirage', 'White', 4),
(4, 'RTY4567', 'Hyundai Accent', 'Gray', 4),
(5, 'BNM6789', 'Suzuki Dzire', 'Silver', 4),
(6, 'PLK1234', 'Toyota Innova', 'Blue', 6),
(7, 'MNO3456', 'Honda BR-V', 'Gray', 6),
(8, 'QWE9876', 'Toyota Avanza', 'White', 6),
(9, 'ZXC6543', 'Ford EcoSport', 'Orange', 4),
(10, 'ASD3210', 'Nissan Almera', 'Black', 4),
(11, 'HJK1122', 'Honda Civic', 'Red', 4),
(12, 'VBN4455', 'Toyota Corolla', 'White', 4),
(13, 'TYU5566', 'Hyundai Tucson', 'Gray', 6),
(14, 'IOP6677', 'Suzuki Ertiga', 'Silver', 6),
(15, 'GHJ7788', 'Nissan Terra', 'Black', 7),
(16, 'BBB6969', 'byd seagull', 'pink', 4),
(17, '7aj212', 'Mirage G4', 'brown', 5),
(18, 'WHOA123', 'Toyota Supra', 'Green', 5);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `driver_documents`
--
ALTER TABLE `driver_documents`
  ADD CONSTRAINT `driver_documents_ibfk_1` FOREIGN KEY (`DriverID`) REFERENCES `driver` (`DriverID`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
