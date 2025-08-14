// 调试版本游戏 - 简化代码避免冲突
console.log('🔧 调试版游戏启动中...');

class DebugGame {
    constructor() {
        try {
            // 获取系统信息
            this.systemInfo = tt.getSystemInfoSync();
            console.log('✅ 系统信息获取成功:', this.systemInfo);
            
            // 创建canvas并设置尺寸
            this.canvas = tt.createCanvas();
            this.ctx = this.canvas.getContext('2d');
            
            // 设置canvas尺寸为屏幕尺寸
            this.canvas.width = this.systemInfo.windowWidth;
            this.canvas.height = this.systemInfo.windowHeight;
            
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            
            console.log('✅ Canvas创建成功，尺寸:', this.width, 'x', this.height);
            
            // 游戏状态
            this.gameState = 'home';
            this.score = 0;
            this.coins = 0;
            this.playerLevel = 1;
            
            // 角色
            this.player = {
                x: this.width / 2 - 20,
                y: this.height - 150,
                width: 40,
                height: 60,
                health: 100
            };
            
            // 启动游戏
            this.init();
            
        } catch (error) {
            console.error('❌ 游戏初始化失败:', error);
            this.showError('游戏初始化失败: ' + error.message);
        }
    }
    
    init() {
        try {
            console.log('🔧 开始初始化游戏...');
            
            // 设置触摸事件
            tt.onTouchStart(this.onTouchStart.bind(this));
            console.log('✅ 触摸事件设置成功');
            
            // 开始游戏循环
            this.gameLoop();
            console.log('✅ 游戏循环启动成功');
            
        } catch (error) {
            console.error('❌ 初始化失败:', error);
            this.showError('初始化失败: ' + error.message);
        }
    }
    
    gameLoop() {
        try {
            this.update();
            this.render();
            requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('❌ 游戏循环错误:', error);
            // 继续游戏循环，不要因为错误而停止
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    update() {
        // 简单的更新逻辑
        if (this.gameState !== 'playing') return;
        
        // 这里可以添加游戏逻辑
    }
    
    render() {
        try {
            // 清空画布
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            // 绘制背景
            this.drawBackground();
            
            if (this.gameState === 'home') {
                this.drawHomeUI();
            } else if (this.gameState === 'playing') {
                this.drawGameUI();
            }
            
        } catch (error) {
            console.error('❌ 渲染错误:', error);
            // 显示错误信息
            this.showRenderError(error.message);
        }
    }
    
    drawBackground() {
        try {
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E0F6FF');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
        } catch (error) {
            console.error('❌ 背景绘制失败:', error);
            // 使用简单颜色作为备用
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }
    
    drawHomeUI() {
        try {
            // 绘制标题
            this.ctx.fillStyle = '#2C3E50';
            this.ctx.font = 'bold 36px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🚀 射击冒险', this.width / 2, 100);
            
            // 绘制开始按钮
            const buttonX = this.width / 2 - 100;
            const buttonY = this.height / 2;
            const buttonWidth = 200;
            const buttonHeight = 60;
            
            this.ctx.fillStyle = '#27AE60';
            this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText('开始游戏', this.width / 2, buttonY + 40);
            
            // 保存按钮位置用于触摸检测
            this.startButton = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
            
        } catch (error) {
            console.error('❌ 首页UI绘制失败:', error);
        }
    }
    
    drawGameUI() {
        try {
            // 绘制玩家
            this.ctx.fillStyle = '#4ECDC4';
            this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
            
            // 绘制分数
            this.ctx.fillStyle = '#2C3E50';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`分数: ${this.score}`, 20, 40);
            
            // 绘制生命值
            this.ctx.fillStyle = '#E74C3C';
            this.ctx.fillText(`生命: ${this.player.health}`, 20, 70);
            
        } catch (error) {
            console.error('❌ 游戏UI绘制失败:', error);
        }
    }
    
    onTouchStart(e) {
        try {
            const touch = e.touches[0];
            console.log('👆 触摸事件:', touch.clientX, touch.clientY);
            
            if (this.gameState === 'home') {
                this.handleHomeTouch(touch);
            } else if (this.gameState === 'playing') {
                this.handleGameTouch(touch);
            }
            
        } catch (error) {
            console.error('❌ 触摸处理失败:', error);
        }
    }
    
    handleHomeTouch(touch) {
        if (this.startButton && this.isPointInRect(touch.clientX, touch.clientY, this.startButton)) {
            console.log('🎮 开始游戏按钮被点击');
            this.startGame();
        }
    }
    
    handleGameTouch(touch) {
        // 游戏中的触摸处理
        console.log('🎯 游戏触摸:', touch.clientX, touch.clientY);
    }
    
    startGame() {
        try {
            console.log('🚀 开始游戏');
            this.gameState = 'playing';
            this.score = 0;
            this.player.health = 100;
        } catch (error) {
            console.error('❌ 开始游戏失败:', error);
        }
    }
    
    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
    
    showError(message) {
        try {
            console.error('❌ 错误:', message);
            // 在画布上显示错误信息
            this.ctx.fillStyle = '#E74C3C';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('错误: ' + message, this.width / 2, this.height / 2);
        } catch (error) {
            console.error('❌ 无法显示错误信息:', error);
        }
    }
    
    showRenderError(message) {
        try {
            this.ctx.fillStyle = '#E74C3C';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('渲染错误: ' + message, this.width / 2, 50);
        } catch (error) {
            console.error('❌ 无法显示渲染错误:', error);
        }
    }
}

// 启动游戏
console.log('🚀 启动调试版游戏');
try {
    new DebugGame();
} catch (error) {
    console.error('❌ 游戏启动失败:', error);
}
