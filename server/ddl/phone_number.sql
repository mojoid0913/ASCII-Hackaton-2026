CREATE TABLE phone_number (
    phone_number VARCHAR(20) NOT NULL COMMENT '전화번호 (하이픈 포함, PK)',
    report_count INT UNSIGNED DEFAULT 0 COMMENT '누적 신고 건수',
    last_reported_at DATETIME COMMENT '마지막 신고 일자',
    external_report_count INT UNSIGNED DEFAULT 0 COMMENT '외부 사이트(더치트 등) 누적 신고 건수',
    PRIMARY KEY (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
