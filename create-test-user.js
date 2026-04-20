
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Подключено к MongoDB');
        
        const User = require('./server/models/User');
        
        // Проверяем существование тестового пользователя
        const testUser = await User.findOne({ email: 'test@test.com' });
        
        if (!testUser) {
            const lastUser = await User.findOne().sort({ uId: -1 });
            const nextId = (lastUser?.uId || 0) + 1;
            
            const user = new User({
                uId: nextId,
                username: 'TestUser',
                email: 'test@test.com',
                password: await bcrypt.hash('test123', 10),
                role: 'user',
                isActive: true
            });
            
            await user.save();
            console.log('✅ Тестовый пользователь создан:');
            console.log('   Email: test@test.com');
            console.log('   Пароль: test123');
        } else {
            console.log('✅ Тестовый пользователь уже существует');
            console.log('   Email: test@test.com');
            console.log('   Пароль: test123');
        }
        
        await mongoose.disconnect();
        console.log('✅ Готово');
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
    }
}

createTestUser();