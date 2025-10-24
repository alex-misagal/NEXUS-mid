-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Oct 21, 2025 at 02:07 PM
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
(1, 1, 'Confirmed', 'Paid', 1, 120.00),
(2, 2, 'Confirmed', 'Paid', 2, 180.00),
(3, 3, 'Cancelled', 'Unpaid', 1, 150.00),
(4, 4, 'Completed', 'Paid', 1, 200.00),
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
  `Status` varchar(20) DEFAULT NULL,
  `Destination` varchar(255) DEFAULT NULL,
  `VehicleID` int DEFAULT NULL,
  PRIMARY KEY (`DriverID`),
  UNIQUE KEY `PhoneNumber` (`PhoneNumber`),
  KEY `VehicleID` (`VehicleID`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `driver`
--

INSERT INTO `driver` (`DriverID`, `PhoneNumber`, `Fname`, `Lname`, `Email`, `Password`, `Status`, `Destination`, `VehicleID`) VALUES
(1, '09981230001', 'Carlos', 'Mendoza', 'carlosm@gmail.com', 'driver123', 'Active', 'Session Road, Barangay Kabayanihan, Baguio City, Benguet 2600', 1),
(2, '09981230002', 'Jayson', 'Reyes', 'jaysonr@gmail.com', 'driver123', 'Active', 'La Trinidad Public Market, Km 5, Barangay Poblacion, La Trinidad, Benguet 2601', 2),
(3, '09981230003', 'Arthur', 'Lim', 'arthurl@gmail.com', 'driver123', 'Suspended', 'Tuba Town Proper, Barangay Poblacion, Tuba, Benguet 2603', 3),
(4, '09981230004', 'Leo', 'Tan', 'leotan@gmail.com', 'driver123', 'Active', 'Itogon Central Barangay Hall, Poblacion, Itogon, Benguet 2604', 4),
(5, '09981230005', 'Mark', 'Santos', 'marks@gmail.com', 'driver123', 'Active', 'Sablan Municipal Hall, Poblacion, Sablan, Benguet 2614', 5),
(6, '09981230006', 'Joshua', 'Cruz', 'joshuac@gmail.com', 'driver123', 'Active', 'Burnham Park, Jose Abad Santos Drive, Baguio City, Benguet 2600', 6),
(7, '09981230007', 'Nathan', 'Rivera', 'nathanr@gmail.com', 'driver123', 'Active', 'Tublay Trading Post, Poblacion, Tublay, Benguet 2615', 7),
(8, '09981230008', 'Patrick', 'Tan', 'patrickt@gmail.com', 'driver123', 'Active', 'Benguet State University, Km 6, La Trinidad, Benguet 2601', 8),
(9, '09981230009', 'Rico', 'Delos Reyes', 'ricodr@gmail.com', 'driver123', 'Suspended', 'SM Baguio Terminal, Upper Session Road, Baguio City, Benguet 2600', 9),
(10, '09981230010', 'Dennis', 'Villanueva', 'dennisv@gmail.com', 'driver123', 'Active', 'Mines View Park, Outlook Drive, Baguio City, Benguet 2600', 10),
(11, '09981230011', 'Ken', 'Morales', 'kenm@gmail.com', 'driver123', 'Active', 'Ambuklao Dam, Barangay Ambuklao, Bokod, Benguet 2605', 11),
(12, '09981230012', 'Oscar', 'Lopez', 'oscarl@gmail.com', 'driver123', 'Active', 'Northern Barangay Hall, Poblacion, Atok, Benguet 2602', 12),
(13, '09981230013', 'Sam', 'Flores', 'samf@gmail.com', 'driver123', 'Active', 'Sablan Viewdeck, Sitio Banangan, Sablan, Benguet 2614', 13),
(14, '09981230014', 'Gino', 'Santiago', 'ginos@gmail.com', 'driver123', 'Active', 'Tublay Municipal Hall, Barangay Ambongdolan, Tublay, Benguet 2615', 14),
(15, '09981230015', 'Allan', 'Ramos', 'allanr@gmail.com', 'driver123', 'Active', 'Our Lady of Atonement Cathedral, Upper Session Road, Baguio City, Benguet 2600', 15);

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
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(13, 15, 155.00, 'Cash', '2025-10-21 21:50:38', 'Completed');

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
) ENGINE=MyISAM AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(13, 15, '2025-10-21 21:50:38', 155.00, 'Ride Payment');

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
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(14, 'Tina', 'Ramos', 'tinar@gmail.com', 'pass123', '09301234514', 4),
(15, 'Ron', 'Garcia', 'rong@gmail.com', 'pass123', '09311234515', 2);

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
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(15, 'GHJ7788', 'Nissan Terra', 'Black', 7);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
