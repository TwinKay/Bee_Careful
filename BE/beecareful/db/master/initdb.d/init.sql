CREATE TABLE `members`
(
    `member_id`   bigint       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `member_name` varchar(255) NOT NULL,
    `phone`       varchar(255) NOT NULL,
    `created_at`  timestamp    NOT NULL,
    `updated_at`  timestamp    NOT NULL,
    `deleted_at`  timestamp NULL
);

CREATE TABLE `auth_members`
(
    `auth_member_id`  bigint       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `member_id`       bigint       NOT NULL,
    `member_login_id` varchar(100) NOT NULL,
    `password`        varchar(100) NOT NULL
);

CREATE TABLE `member_roles`
(
    `member_role_id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `member_id`      bigint NOT NULL,
    `name`           enum('ADMIN', 'USER', 'GUEST') NULL
);

CREATE TABLE `apiaries`
(
    `apiary_id` bigint       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `member_id` bigint       NOT NULL
);

CREATE TABLE `member_device` (
    `member_device_id`	bigint	NOT NULL,
    `member_id`	bigint	NOT NULL,
    `fcm_token`	varchar(255)	NOT NULL
);

CREATE TABLE `beehives`
(
    `beehive_id`         bigint       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `apiary_id`          bigint       NOT NULL,
    `nickname`           varchar(100) NOT NULL,
    `created_at`         timestamp    NOT NULL,
    `updated_at`         timestamp    NOT NULL,
    `hornet_appeared_at` timestamp NULL,
    `deleted_at`         timestamp NULL,
    `x_direction`        bigint       NOT NULL,
    `y_direction`        bigint       NOT NULL,
    `is_infected`        boolean       NOT NULL
);

CREATE TABLE `turrets`
(
    `turret_id`  bigint       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `beehive_id` bigint       NOT NULL,
    `serial`     varchar(100) NOT NULL
);

CREATE TABLE `diagnoses`
(
    `diagnosis_id` bigint    NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `beehive_id`   bigint    NOT NULL,
    `created_at`   timestamp NOT NULL
);

CREATE TABLE `original_photos`
(
    `original_photo_id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `diagnosis_id`      bigint NOT NULL,
    `s3_file_metadata_id`  bigint NOT NULL,
    `status`            enum('UNRECIEVED', 'FAIL', 'SUCCESS', 'ANALYZING', 'WAITING') NULL
);

CREATE TABLE `analyzed_photos`
(
    `analyzed_photo_id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `original_photo_id` bigint NOT NULL,
    `s3_file_metadata_id`  bigint NOT NULL,
    `diagnosis_id`      bigint NOT NULL,
    `imago_count`       bigint NOT NULL,
    `larva_count`       bigint NOT NULL
);

CREATE TABLE `analyzed_photo_diseases`
(
    `analyzed_photo_disease_id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `analyzed_photo_id`         bigint NOT NULL,
    `disease_id`                bigint NOT NULL,
    `count`                     bigint NOT NULL
);

CREATE TABLE `diseases`
(
    `disease_id` bigint       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `name`       enum('VARROA', 'FOULBROOD', 'CHALKBROOD', 'DWV') NOT NULL,
    `stage`      enum('IMAGO', 'LARVA') NOT NULL
);

CREATE TABLE `s3_file_metadatas`
(
    `s3_file_metadata_id`  bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `original_filename` varchar(255) NULL,
    `s3_key`            varchar(255) NULL,
    `size`              bigint NULL,
    `content_type`      varchar(100) NULL,
    `status`            enum('PENDING','STORED','FAILED','DELETED') NULL,
    `created_at`        timestamp NULL,
    `deleted_at`        timestamp NULL,
    `url`               varchar(255) NULL
);