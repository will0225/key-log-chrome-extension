-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 21, 2025 at 12:02 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `key_log`
--

-- --------------------------------------------------------

--
-- Table structure for table `logs`
--

CREATE TABLE `logs` (
  `site` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `log` text CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `date` date NOT NULL DEFAULT current_timestamp(),
  `time` varchar(255) DEFAULT NULL,
  `id` int(255) NOT NULL,
  `device` varchar(255) DEFAULT NULL,
  `update_date` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `logs`
--

INSERT INTO `logs` (`site`, `log`, `date`, `time`, `id`, `device`, `update_date`) VALUES
('https://www.tackker.com', '0 hhhhh hhhhh%$% ^% 02/18/2025 - 03/20/2025 ^% 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 safd 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 02/18/2025 - 03/20/2025 safd 02/18/2025 - 03/20/2025 safd', '2025-03-20', '1742464420407', 342, NULL, '2025-03-20 20:08:56.963000'),
('https://www.google.com', 'amazon account amazon account', '2025-03-20', '1742474026761', 343, NULL, '2025-03-20 16:33:48.740000'),
('https://tackker.com', '^% ~~ ~~ ~~ ~~ ~~ +++fff +++fff +++fff +++fff +++fff', '2025-03-20', '1742474312360', 344, NULL, '2025-03-21 01:30:21.152000'),
('https://github.com', 'cccccc cccccc cccccc cccccc ccccccsfddsf', '2025-03-20', '1742506487100', 345, NULL, '2025-03-21 01:38:00.353000'),
('https://www.paypal.com', 'dfdff 4333', '2025-03-20', '1742506650946', 346, NULL, '2025-03-21 01:37:46.892000'),
('http://localhost:3000', '%%%123 %%%123 f d g f g f g f g d f', '2025-03-20', '1742506746363', 347, NULL, '2025-03-21 01:53:16.888000'),
('https://www.writephponline.com', 'f s g f d s g g echo \'Hello World!\';fsgfdsgg\n\n', '2025-03-20', '1742507580840', 348, NULL, '2025-03-21 01:53:02.059000');

-- --------------------------------------------------------

--
-- Table structure for table `screenshots`
--

CREATE TABLE `screenshots` (
  `id` int(255) NOT NULL,
  `screenshot` longtext DEFAULT NULL,
  `date` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `site` varchar(254) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`) VALUES
(1, 'will2019421@outlook.com', '$2b$10$bIEq9//3YXvWuSDk9NL6TOyd2Ia9auWQAxwmDDE3wRsqL1HCZUB5m'),
(2, 'maxim.popov.dev63@gmail.com', '$2b$10$fk/oXZ5IRDFq8.QzqY6KJODDJdCF0ypsSfQq1LmjksYgC01jI8V3m');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `screenshots`
--
ALTER TABLE `screenshots`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=349;

--
-- AUTO_INCREMENT for table `screenshots`
--
ALTER TABLE `screenshots`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=859;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
