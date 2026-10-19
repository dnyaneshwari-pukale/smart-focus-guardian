-- ====================================================================
-- Smart Focus Guardian - Database Schema
-- College IoT Project: NodeMCU ESP8266 + PIR + LDR + Study Lamp + Pomodoro
-- Database: MySQL 8.0+ / MariaDB 10.4+
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `smart_focus_guardian`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `smart_focus_guardian`;

-- --------------------------------------------------------------------
-- 1. Devices Table
-- Tracks physical and simulated NodeMCU ESP8266 lamp devices
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `devices` (
  `device_id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `device_type` VARCHAR(50) NOT NULL DEFAULT 'NodeMCU ESP8266',
  `connection_status` ENUM('online', 'offline', 'demo') NOT NULL DEFAULT 'offline',
  `last_seen` DATETIME NULL,
  `firmware_version` VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  `is_demo` TINYINT(1) NOT NULL DEFAULT 0,
  `device_token` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 2. Sensor Readings Table
-- Stores periodic readings sent by ESP8266 (PIR + LDR).
-- Note: PIR is binary motion state; LDR is relative index (0-100 or 0-1023).
-- Note: NO distance sensor column (PIR does not measure distance).
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sensor_readings` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `device_id` VARCHAR(50) NOT NULL,
  `pir_motion` TINYINT(1) NOT NULL COMMENT '1 = Motion Detected, 0 = No Motion',
  `ldr_value` INT NOT NULL COMMENT 'Relative LDR value (0-100). Not calibrated lux.',
  `lighting_category` VARCHAR(20) NOT NULL DEFAULT 'ADEQUATE' COMMENT 'DIM, ADEQUATE, BRIGHT',
  `lamp_state` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Reported White LED state (0 = OFF, 1 = ON)',
  `source` VARCHAR(20) NOT NULL DEFAULT 'HARDWARE' COMMENT 'HARDWARE or DEMO',
  `diagnostics` VARCHAR(255) NULL,
  `recorded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sensor_device_time` (`device_id`, `recorded_at`),
  CONSTRAINT `fk_sensor_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`device_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 3. Motion Events Table
-- Captures motion trigger events with deduplication / state changes.
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `motion_events` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `device_id` VARCHAR(50) NOT NULL,
  `event_type` VARCHAR(50) NOT NULL DEFAULT 'MOTION_DETECTED' COMMENT 'MOTION_DETECTED, MOTION_STOPPED',
  `source` VARCHAR(20) NOT NULL DEFAULT 'HARDWARE' COMMENT 'HARDWARE or DEMO',
  `occurred_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_events_device_time` (`device_id`, `occurred_at`),
  CONSTRAINT `fk_events_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`device_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 4. Lamp Commands Table
-- Implements decoupled command dispatch with status tracking:
-- PENDING -> ACKNOWLEDGED / FAILED / EXPIRED
-- Distinguishes user requested state from device confirmed state.
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lamp_commands` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `command_id` VARCHAR(64) NOT NULL UNIQUE,
  `device_id` VARCHAR(50) NOT NULL,
  `requested_state` TINYINT(1) NOT NULL COMMENT '1 = ON, 0 = OFF',
  `brightness` INT NOT NULL DEFAULT 70 COMMENT '0 - 100 PWM brightness',
  `auto_mode` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Auto compensation enabled',
  `status` ENUM('PENDING', 'ACKNOWLEDGED', 'FAILED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `acknowledged_at` DATETIME NULL,
  `failure_reason` VARCHAR(255) NULL,
  INDEX `idx_commands_device_status` (`device_id`, `status`),
  CONSTRAINT `fk_commands_device` FOREIGN KEY (`device_id`) REFERENCES `devices` (`device_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 5. Study Sessions Table
-- Stores completed and tracked Pomodoro / focus study blocks.
-- Unique session_id prevents duplicate insertions on refreshes.
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `study_sessions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `session_id` VARCHAR(64) NOT NULL UNIQUE,
  `session_type` ENUM('focus', 'shortBreak', 'longBreak') NOT NULL DEFAULT 'focus',
  `planned_duration_min` INT NOT NULL DEFAULT 25,
  `actual_duration_min` INT NOT NULL DEFAULT 25,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `completion_status` ENUM('COMPLETED', 'INTERRUPTED', 'ABORTED') NOT NULL DEFAULT 'COMPLETED',
  `motion_events_count` INT NOT NULL DEFAULT 0,
  `source` VARCHAR(20) NOT NULL DEFAULT 'LOCAL' COMMENT 'HARDWARE, DEMO, or LOCAL',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_sessions_start_time` (`start_time`),
  INDEX `idx_sessions_source` (`source`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- 6. Settings Table
-- Key-value store for user preferences and threshold configuration.
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `setting_value` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------
-- Default Seed Data
-- --------------------------------------------------------------------
INSERT INTO `devices` (`device_id`, `name`, `device_type`, `connection_status`, `firmware_version`, `is_demo`, `device_token`)
VALUES
  ('LAMP_001', 'Smart Focus Lamp', 'NodeMCU ESP8266', 'offline', '1.0.0', 0, 'sfg_device_secret_2026')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
  ('focus_duration', '25'),
  ('short_break', '5'),
  ('long_break', '15'),
  ('sessions_before_long_break', '4'),
  ('auto_start', '0'),
  ('sound_enabled', '1'),
  ('notifications_enabled', '0'),
  ('auto_lamp', '1'),
  ('ldr_threshold', '35'),
  ('theme', 'light'),
  ('system_mode', 'demo')
ON DUPLICATE KEY UPDATE `setting_key` = `setting_key`;
