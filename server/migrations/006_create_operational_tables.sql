CREATE TABLE wedding_announcements (
  wedding_id CHAR(36) PRIMARY KEY,
  message TEXT,
  updated_by CHAR(36) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_announcements_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  CONSTRAINT fk_announcements_updated_by FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE budget_lines (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  category VARCHAR(100) NOT NULL,
  estimated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_budget_lines_wedding_category (wedding_id, category),
  CONSTRAINT fk_budget_lines_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE vendors (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  handled_by VARCHAR(255),
  phone VARCHAR(50),
  alternate_phone VARCHAR(50),
  address TEXT,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  advance_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_vendors_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_vendors_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE expenses (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  expense_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  vendor_id CHAR(36) NULL,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_by VARCHAR(255),
  payment_mode VARCHAR(50),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_expenses_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  CONSTRAINT fk_expenses_vendor FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL,
  INDEX idx_expenses_wedding (wedding_id),
  INDEX idx_expenses_wedding_category (wedding_id, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE guests (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  family_name VARCHAR(255) NOT NULL,
  village_city VARCHAR(255),
  phone VARCHAR(50),
  whatsapp VARCHAR(50),
  total_members INT NOT NULL DEFAULT 1,
  invitation_status VARCHAR(20) NOT NULL DEFAULT 'No',
  attending_engagement TINYINT(1) NOT NULL DEFAULT 0,
  attending_haldi TINYINT(1) NOT NULL DEFAULT 0,
  attending_wedding TINYINT(1) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_guests_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_guests_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE shopping_items (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  item VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  responsible_person VARCHAR(255),
  actual_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Not Started',
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_shopping_items_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_shopping_items_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inventory_items (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  item VARCHAR(255) NOT NULL,
  required_qty DECIMAL(10,2),
  available_qty DECIMAL(10,2),
  responsible_person VARCHAR(255),
  status VARCHAR(50),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_inventory_items_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_inventory_items_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE stay_arrangements (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  guest_id CHAR(36) NULL,
  guest_name_freeform VARCHAR(255),
  villa VARCHAR(255),
  address TEXT,
  responsible_person VARCHAR(255),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_stay_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  CONSTRAINT fk_stay_guest FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE SET NULL,
  INDEX idx_stay_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tasks (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  task VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  assigned_to VARCHAR(255),
  priority VARCHAR(20),
  start_date DATE,
  due_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'Not Started',
  comments TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_tasks_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_tasks_wedding (wedding_id),
  INDEX idx_tasks_wedding_due (wedding_id, due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE timeline_events (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  event_date DATE,
  event_time TIME,
  venue VARCHAR(255),
  responsible_person VARCHAR(255),
  checklist TEXT,
  status VARCHAR(50),
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_timeline_events_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_timeline_events_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE contacts (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  phone VARCHAR(50),
  alternate_phone VARCHAR(50),
  notes TEXT,
  source ENUM('manual','auto_family','auto_vendor') NOT NULL DEFAULT 'manual',
  source_ref_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contacts_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  INDEX idx_contacts_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE documents (
  id CHAR(36) PRIMARY KEY,
  wedding_id CHAR(36) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  related_to VARCHAR(255),
  storage_path VARCHAR(1024),
  uploaded_by CHAR(36) NULL,
  date_added DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_documents_wedding FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE,
  CONSTRAINT fk_documents_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_documents_wedding (wedding_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
