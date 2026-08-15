CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  wedding_id CHAR(36) NULL,
  type ENUM('success','warning','error','info') NOT NULL,
  title VARCHAR(500) NOT NULL,
  message VARCHAR(500),
  link VARCHAR(1024),
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_created (user_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
