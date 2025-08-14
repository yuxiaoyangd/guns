// 优化版调试游戏 - 简化代码结构
console.log('🔧 优化版调试游戏启动中...');

// 禁用自动音效播放
if (typeof tt !== 'undefined') {
    try {
        tt.setInnerAudioOption({ obeyMuteSwitch: true, speakerOn: false });
        console.log('🔇 已禁用自动音频播放');
    } catch (error) {
        console.log('🔇 音频设置失败:', error);
    }
}

class DebugGame {
    constructor() {
        this.init();
    }
    
    init() {
        try {
            // 获取系统信息
            const systemInfo = tt.getSystemInfoSync();
            this.width = systemInfo.windowWidth;
            this.height = systemInfo.windowHeight;
            
            // 创建Canvas
            this.canvas = tt.createCanvas();
            this.ctx = this.canvas.getContext('2d');
            this.canvas.width = this.width;
            this.canvas.height = this.height;
            
            // 添加到页面
            this.addCanvasToPage();
            
            // 游戏状态
            this.gameState = 'home';
            this.score = 0;
            this.player = {
                x: this.width / 2 - 20,
                y: this.height - 150,
                width: 40,
                height: 60,
                health: 100
            };
            
            // 设置事件和启动游戏循环
            this.setupEvents();
            this.gameLoop();
            
            console.log('✅ 游戏初始化成功');
            
        } catch (error) {
            console.error('❌ 游戏初始化失败:', error);
        }
    }
    
    addCanvasToPage() {
        try {
            // 简化：直接创建Canvas元素
            const canvasElement = document.createElement('canvas');
            canvasElement.id = 'gameCanvas';
            canvasElement.width = this.width;
            canvasElement.height = this.height;
            canvasElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: ${this.width}px;
                height: ${this.height}px;
                z-index: 1000;
            `;
            
            if (document.body) {
                document.body.appendChild(canvasElement);
                this.canvas = canvasElement;
                this.ctx = this.canvas.getContext('2d');
            }
        } catch (error) {
            console.error('❌ Canvas添加失败:', error);
        }
    }
    
    setupEvents() {
        // 触摸事件
        tt.onTouchStart(this.onTouchStart.bind(this));
        
        // 备用：鼠标事件
        if (this.canvas) {
            this.canvas.addEventListener('mousedown', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.handleTouch(e.clientX - rect.left, e.clientY - rect.top);
            });
        }
    }
    
    onTouchStart(e) {
        const touch = e.touches[0];
        this.handleTouch(touch.clientX, touch.clientY);
    }
    
    handleTouch(x, y) {
        console.log('👆 触摸坐标:', x, y);
        
        if (this.gameState === 'home' && this.isInStartButton(x, y)) {
            this.startGame();
        }
    }
    
    isInStartButton(x, y) {
        const button = this.getStartButtonRect();
        return x >= button.x && x <= button.x + button.width &&
               y >= button.y && y <= button.y + button.height;
    }
    
    getStartButtonRect() {
        return {
            x: this.width / 2 - 100,
            y: this.height / 2 - 30,
            width: 200,
            height: 60
        };
    }
    
    startGame() {
        console.log('🎮 开始游戏');
        this.gameState = 'playing';
        this.score = 0;
        this.player.health = 100;
    }
    
    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    render() {
        if (!this.ctx) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制背景
        this.drawBackground();
        
        // 绘制UI
        if (this.gameState === 'home') {
            this.drawHomeUI();
        } else {
            this.drawGameUI();
        }
        
        // 绘制调试信息
        this.drawDebugInfo();
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawHomeUI() {
        // 标题
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🚀 射击冒险', this.width / 2, 100);
        
        // 开始按钮
        const button = this.getStartButtonRect();
        this.ctx.fillStyle = '#27AE60';
        this.ctx.fillRect(button.x, button.y, button.width, button.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('开始游戏', this.width / 2, button.y + 40);
        
        // 按钮边框（调试用）
        this.ctx.strokeStyle = '#E74C3C';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(button.x, button.y, button.width, button.height);
    }
    
    drawGameUI() {
        // 玩家
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // 分数和生命值
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`分数: ${this.score}`, 20, 40);
        this.ctx.fillText(`生命: ${this.player.health}`, 20, 70);
    }
    
    drawDebugInfo() {
        this.ctx.fillStyle = '#E67E22';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        
        const y = this.height - 20;
        let line = 0;
        
        this.ctx.fillText(`Canvas: ${this.width} x ${this.height}`, 20, y - line * 20);
        line++;
        this.ctx.fillText(`状态: ${this.gameState}`, 20, y - line * 20);
        line++;
        
        const button = this.getStartButtonRect();
        this.ctx.fillText(`按钮: (${button.x}, ${button.y}) ${button.width}x${button.height}`, 20, y - line * 20);
    }
}

// 启动游戏
console.log('🚀 启动优化版调试游戏');
new DebugGame();
