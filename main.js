// 主要游戏启动文件
console.log('🎮 射击冒险游戏启动中...');

// 等待抖音小游戏环境准备完成
function waitForTT() {
    if (typeof tt !== 'undefined') {
        console.log('✅ 抖音小游戏环境已就绪');
        startGame();
    } else {
        console.log('⏳ 等待抖音小游戏环境...');
        setTimeout(waitForTT, 100);
    }
}

// 启动游戏
function startGame() {
    try {
        // 获取系统信息
        const systemInfo = tt.getSystemInfoSync();
        console.log('📱 系统信息:', systemInfo);
        
        // 创建canvas
        const canvas = tt.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        canvas.width = systemInfo.windowWidth;
        canvas.height = systemInfo.windowHeight;
        
        console.log('🎨 Canvas尺寸:', canvas.width, 'x', canvas.height);
        
        // 游戏状态
        let gameState = 'playing';
        let score = 0;
        let coins = 0;
        
        // 角色位置
        let playerX = canvas.width / 2;
        let playerY = canvas.height - 150;
        
        // 游戏循环
        function gameLoop() {
            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 绘制背景
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E0F6FF');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 绘制角色
            ctx.fillStyle = '#4ECDC4';
            ctx.fillRect(playerX - 20, playerY, 40, 60);
            
            // 绘制角色头部
            ctx.fillStyle = '#FFEAA7';
            ctx.beginPath();
            ctx.arc(playerX, playerY - 10, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制角色眼睛
            ctx.fillStyle = '#2D3436';
            ctx.beginPath();
            ctx.arc(playerX - 5, playerY - 12, 3, 0, Math.PI * 2);
            ctx.arc(playerX + 5, playerY - 12, 3, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制道具栏
            ctx.fillStyle = '#34495E';
            ctx.fillRect(50, canvas.height - 80, 60, 60);
            ctx.fillRect(130, canvas.height - 80, 60, 60);
            ctx.fillRect(210, canvas.height - 80, 60, 60);
            
            // 绘制道具文字
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '14px Arial';
            ctx.fillText('手枪', 60, canvas.height - 45);
            ctx.fillText('步枪', 140, canvas.height - 45);
            ctx.fillText('手雷', 220, canvas.height - 45);
            
            // 绘制UI
            ctx.fillStyle = '#2C3E50';
            ctx.font = '20px Arial';
            ctx.fillText(`分数: ${score}`, 20, 40);
            ctx.fillText(`💰 ${coins}`, 20, 70);
            ctx.fillText(`生命: 100`, 20, 100);
            
            // 绘制游戏标题
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('射击冒险', canvas.width / 2, 50);
            
            // 继续游戏循环
            requestAnimationFrame(gameLoop);
        }
        
        // 启动游戏循环
        console.log('🚀 启动游戏循环');
        gameLoop();
        
        // 设置触摸事件
        tt.onTouchStart((e) => {
            console.log('👆 触摸开始:', e);
            const touch = e.touches[0];
            
            // 检查是否点击道具
            if (touch.clientY > canvas.height - 80 && touch.clientY < canvas.height - 20) {
                if (touch.clientX > 50 && touch.clientX < 110) {
                    console.log('🔫 选择手枪');
                    score += 10;
                } else if (touch.clientX > 130 && touch.clientX < 190) {
                    console.log('🔫 选择步枪');
                    score += 20;
                } else if (touch.clientX > 210 && touch.clientX < 270) {
                    console.log('💣 选择手雷');
                    score += 30;
                }
            }
        });
        
        console.log('✅ 游戏启动成功！');
        
    } catch (error) {
        console.error('❌ 游戏启动失败:', error);
    }
}

// 开始等待环境
waitForTT();

// 备用启动方式
setTimeout(() => {
    if (typeof tt !== 'undefined') {
        console.log('⏰ 备用启动方式');
        startGame();
    }
}, 2000);
