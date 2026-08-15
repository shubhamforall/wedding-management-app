CREATE TABLE weddings (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bride_name VARCHAR(255) NOT NULL,
  groom_name VARCHAR(255) NOT NULL,
  wedding_date DATE NULL,
  reception_date DATE NULL,
  venue VARCHAR(255),
  address TEXT,
  wedding_side ENUM('groom','bride','both') NOT NULL DEFAULT 'both',
  owner_id CHAR(36) NOT NULL,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_weddings_owner FOREIGN KEY (owner_id) REFERENCES users(id),
  INDEX idx_weddings_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
