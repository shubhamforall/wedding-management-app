CREATE TABLE list_options (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  list_type VARCHAR(50) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_list_options_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_list_options_wedding_type (wedding_id, list_type),
  UNIQUE KEY uq_list_options_value (wedding_id, list_type, value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
