const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'teacherhub.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'teacher',
      profile_picture TEXT,
      is_verified INTEGER DEFAULT 0,
      verification_code TEXT,
      reset_token TEXT,
      reset_token_expires TEXT,
      subscription_tier TEXT DEFAULT 'free',
      subscription_status TEXT DEFAULT 'trial',
      trial_start TEXT,
      trial_end TEXT,
      subscription_start TEXT,
      subscription_end TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      grade_level TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      class_id INTEGER NOT NULL,
      student_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      assessment_name TEXT NOT NULL,
      assessment_type TEXT NOT NULL,
      marks REAL NOT NULL,
      total_marks REAL NOT NULL,
      date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS study_guides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      class_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      subject TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT NOT NULL,
      class_id INTEGER,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      sender_name TEXT NOT NULL,
      channel TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Backward compatibility: add columns if they don't exist
    db.run(`ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: is_verified column may already exist');
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN verification_code TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: verification_code column may already exist');
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN reset_token TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: reset_token column may already exist');
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN reset_token_expires TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: reset_token_expires column may already exist');
      }
    });
    // Backward compatibility: add profile_picture column if missing
    db.run(`ALTER TABLE users ADD COLUMN profile_picture TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: profile_picture column may already exist');
      }
    });
    // Backward compatibility: add subscription columns if missing
    db.run(`ALTER TABLE users ADD COLUMN subscription_tier TEXT DEFAULT 'free'`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: subscription_tier column may already exist');
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN subscription_status TEXT DEFAULT 'trial'`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: subscription_status column may already exist');
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN trial_start TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: trial_start column may already exist');
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN trial_end TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: trial_end column may already exist');
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN subscription_start TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: subscription_start column may already exist');
      }
    });
    db.run(`ALTER TABLE users ADD COLUMN subscription_end TEXT`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: subscription_end column may already exist');
      }
    });

    // Backward compatibility: add user_id to existing tables if missing
    db.run(`ALTER TABLE classes ADD COLUMN user_id INTEGER`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: classes user_id may already exist');
      }
    });
    db.run(`ALTER TABLE students ADD COLUMN user_id INTEGER`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: students user_id may already exist');
      }
    });
    db.run(`ALTER TABLE marks ADD COLUMN user_id INTEGER`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: marks user_id may already exist');
      }
    });
    db.run(`ALTER TABLE study_guides ADD COLUMN user_id INTEGER`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: study_guides user_id may already exist');
      }
    });
    db.run(`ALTER TABLE tasks ADD COLUMN user_id INTEGER`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: tasks user_id may already exist');
      }
    });
    db.run(`ALTER TABLE attendance ADD COLUMN user_id INTEGER`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: attendance user_id may already exist');
      }
    });
    db.run(`ALTER TABLE messages ADD COLUMN user_id INTEGER`, function(err) {
      if (err && !err.message.includes('duplicate column name')) {
        console.log('Note: messages user_id may already exist');
      }
    });

    console.log('Database tables initialized.');
  });
}

module.exports = db;
