// 优化版极简调试游戏
console.log('🔧 优化版极简调试游戏启动...');

class SimpleDebug {
    constructor() {
        this.init();
    }
    
    init() {
        // 创建Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
        `;
        
        // 添加到页面
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // 设置事件
        this.setupEvents();
        
        // 开始渲染
        this.render();
        
        console.log('✅ 极简调试版初始化成功');
    }
    
    setupEvents() {
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleTouch(touch.clientX, touch.clientY);
        });
        
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => {
            this.handleTouch(e.clientX, e.clientY);
        });
        
        // 鼠标移动
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }
    
    handleTouch(x, y) {
        console.log('👆 触摸坐标:', x, y);
        this.touchX = x;
        this.touchY = y;
        
        if (this.isInStartButton(x, y)) {
            console.log('🎮 开始按钮被点击！');
            this.gameStarted = true;
        }
    }
    
    isInStartButton(x, y) {
        const button = this.getStartButtonRect();
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }
    
    getStartButtonRect() {
        return {
            x: this.canvas.width / 2 - 100,
            y: this.canvas.height / 2 - 30,
            width: 200,
            height: 60
        };
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制UI
        if (!this.gameStarted) {
            this.drawHomeScreen();
        } else {
            this.drawGameScreen();
        }
        
        // 绘制调试信息
        this.drawDebugInfo();
        
        // 继续渲染
        requestAnimationFrame(() => this.render());
    }
    
    drawHomeScreen() {
        // 标题
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🚀 射击冒险', this.canvas.width / 2, 100);
        
        // 开始按钮
        const button = this.getStartButtonRect();
        this.ctx.fillStyle = '#27AE60';
        this.ctx.fillRect(button.x, button.y, button.width, button.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('开始游戏', this.canvas.width / 2, button.y + 40);
        
        // 按钮边框
        this.ctx.strokeStyle = '#E74C3C';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(button.x, button.y, button.width, button.height);
    }
    
    drawGameScreen() {
        // 玩家
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillRect(this.canvas.width / 2 - 20, this.canvas.height - 150, 40, 60);
        
        // 分数
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('分数: 0', 20, 40);
    }
    
    drawDebugInfo() {
        this.ctx.fillStyle = '#E67E22';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        const y = this.canvas.height - 20;
        let line = 0;
        
        // 基本信息
        this.ctx.fillText(`Canvas: ${this.canvas.width} x ${this.canvas.height}`, 20, y - line * 20);
        line++;
        
        // 触摸坐标
        if (this.touchX !== undefined) {
            this.ctx.fillText(`触摸: ${this.touchX}, ${this.touchY}`, 20, y - line * 20);
            line++;
        }
        
        // 鼠标坐标
        if (this.mouseX !== undefined) {
            this.ctx.fillText(`鼠标: ${this.mouseX}, ${this.mouseY}`, 20, y - line * 20);
            line++;
        }
        
        // 游戏状态
        this.ctx.fillText(`状态: ${this.gameStarted ? '游戏中' : '首页'}`, 20, y - line * 20);
        line++;
        
        // 按钮位置
        const button = this.getStartButtonRect();
        this.ctx.fillText(`按钮: (${button.x}, ${button.y}) ${button.width}x${button.height}`, 20, y - line * 20);
    }
}

// 启动游戏
console.log('🚀 启动优化版极简调试游戏');
new SimpleDebug();
