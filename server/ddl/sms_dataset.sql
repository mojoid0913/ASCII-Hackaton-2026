CREATE TABLE sms_dataset (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '데이터 고유 번호',
    content TEXT NOT NULL COMMENT '문자 내용 (매우 긴 문자열)',
    label TINYINT NOT NULL COMMENT '분류 클래스 (1:normal, 2:fishing)',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '데이터 생성일'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
