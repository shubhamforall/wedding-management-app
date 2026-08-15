CREATE TABLE emergency_contacts (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  relation VARCHAR(100),
  phone VARCHAR(50),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_emergency_contacts_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_emergency_contacts_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE important_numbers (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  label VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_important_numbers_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_important_numbers_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
