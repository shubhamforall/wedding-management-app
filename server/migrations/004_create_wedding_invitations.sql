CREATE TABLE wedding_invitations (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  wedding_name VARCHAR(255),
  email VARCHAR(255) NOT NULL COLLATE utf8mb4_general_ci,
  role ENUM('owner','member','viewer') NOT NULL,
  token CHAR(36) NOT NULL,
  status ENUM('pending','accepted','revoked','expired') NOT NULL DEFAULT 'pending',
  invited_by CHAR(36) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_invitations_token (token),
  CONSTRAINT fk_invitations_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  CONSTRAINT fk_invitations_invited_by FOREIGN KEY (invited_by) REFERENCES users(id),
  -- MySQL has no partial unique index (Postgres enforced "one PENDING invite
  -- per wedding+email" this way) — this plain index only speeds up the
  -- lookup; the actual uniqueness-while-pending rule is enforced in
  -- invitationService.create() with a SELECT-before-INSERT check.
  INDEX idx_invitations_wedding_email_status (wedding_id, email, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
