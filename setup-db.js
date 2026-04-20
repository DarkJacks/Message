const mysql = require('mysql2/promise');

async function setupDatabase() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '' // ваш пароль, если есть
    });

    try {
        // Создаем базу данных
        await connection.execute('DROP DATABASE IF EXISTS chat_db');
        await connection.execute('CREATE DATABASE chat_db');
        console.log('✅ Database created');

        await connection.changeUser({ database: 'chat_db' });

        // Создаем таблицы
        await connection.execute(`
            CREATE TABLE users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                avatar VARCHAR(255),
                status ENUM('online', 'offline', 'away') DEFAULT 'offline',
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created');

        await connection.execute(`
            CREATE TABLE chats (
                id INT PRIMARY KEY AUTO_INCREMENT,
                type ENUM('private', 'group') DEFAULT 'private',
                name VARCHAR(100),
                avatar VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Chats table created');

        await connection.execute(`
            CREATE TABLE chat_participants (
                chat_id INT NOT NULL,
                user_id INT NOT NULL,
                joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (chat_id, user_id),
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Chat participants table created');

        await connection.execute(`
            CREATE TABLE messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                chat_id INT NOT NULL,
                sender_id INT NOT NULL,
                text TEXT,
                file_url VARCHAR(255),
                file_type VARCHAR(50),
                file_name VARCHAR(255),
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_chat_id (chat_id),
                INDEX idx_created_at (created_at)
            )
        `);
        console.log('✅ Messages table created');

        await connection.execute(`
            CREATE TABLE deleted_chats (
                id INT PRIMARY KEY AUTO_INCREMENT,
                chat_id INT NOT NULL,
                user_id INT NOT NULL,
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_deleted (chat_id, user_id)
            )
        `);
        console.log('✅ Deleted chats table created');

        await connection.execute(`
            CREATE TABLE deleted_messages (
                id INT PRIMARY KEY AUTO_INCREMENT,
                chat_id INT NOT NULL,
                message_id INT NOT NULL,
                user_id INT NOT NULL,
                deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_deleted_message (chat_id, message_id, user_id)
            )
        `);
        console.log('✅ Deleted messages table created');

        // Добавляем тестовых пользователей (пароль: 123456)
        await connection.execute(`
            INSERT INTO users (username, email, password, status) VALUES 
            ('testuser', 'test@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'online'),
            ('demo', 'demo@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'offline'),
            ('alice', 'alice@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'online'),
            ('bob', 'bob@test.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'offline')
        `);
        console.log('✅ Test users created (password: 123456)');

        console.log('\n🎉 Database setup completed successfully!');
        console.log('Test users:');
        console.log('  - Username: testuser, Password: 123456');
        console.log('  - Username: demo, Password: 123456');
        console.log('  - Username: alice, Password: 123456');
        console.log('  - Username: bob, Password: 123456');

    } catch (error) {
        console.error('Error setting up database:', error);
    } finally {
        await connection.end();
    }
}

setupDatabase();