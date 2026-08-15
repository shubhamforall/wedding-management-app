CREATE TABLE wedding_members (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner','member','viewer') NOT NULL,
  status ENUM('active','removed') NOT NULL DEFAULT 'active',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_wedding_members_wedding_user (wedding_id, user_id),
  CONSTRAINT fk_members_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_members_wedding (wedding_id),
  INDEX idx_members_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
