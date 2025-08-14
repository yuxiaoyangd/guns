// 调试版本游戏 - 简化代码避免冲突
console.log('🔧 调试版游戏启动中...');

// 禁用自动音效播放
if (typeof tt !== 'undefined') {
    try {
        // 在抖音小游戏中禁用自动音频播放
        tt.setInnerAudioOption({
            obeyMuteSwitch: true,
            speakerOn: false
        });
        console.log('🔇 已禁用自动音频播放');
    } catch (error) {
        console.log('🔇 音频设置失败:', error);
    }
}

// 禁用页面中的任何自动播放音频
if (typeof document !== 'undefined') {
    try {
        // 阻止所有音频元素的自动播放
        const audioElements = document.querySelectorAll('audio');
        audioElements.forEach(audio => {
            audio.autoplay = false;
            audio.muted = true;
            audio.pause();
        });
        console.log('🔇 已禁用页面音频自动播放');
    } catch (error) {
        console.log('🔇 页面音频设置失败:', error);
    }
}

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
            
            // 重要：将Canvas添加到页面中！
            this.addCanvasToPage();
            
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
    
    // 新增：将Canvas添加到页面中
    addCanvasToPage() {
        try {
            // 在抖音小游戏中，Canvas需要被添加到页面
            if (typeof tt !== 'undefined' && tt.createSelectorQuery) {
                // 使用抖音小游戏的API将Canvas添加到页面
                const query = tt.createSelectorQuery();
                query.select('#gameCanvas').boundingClientRect((rect) => {
                    if (rect) {
                        // 如果页面中已有Canvas元素，使用它
                        this.canvas = tt.createCanvas();
                        this.ctx = this.canvas.getContext('2d');
                        this.canvas.width = this.width;
                        this.canvas.height = this.height;
                        console.log('✅ 使用页面中的Canvas元素');
                    } else {
                        // 否则创建新的Canvas并添加到页面
                        this.createCanvasElement();
                    }
                }).exec();
            } else {
                // 备用方案：直接创建Canvas元素
                this.createCanvasElement();
            }
        } catch (error) {
            console.error('❌ Canvas添加到页面失败:', error);
            // 使用备用方案
            this.createCanvasElement();
        }
    }
    
    // 备用方案：创建Canvas元素
    createCanvasElement() {
        try {
            // 创建Canvas元素并添加到页面
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
                pointer-events: auto;
            `;
            
            // 添加到页面
            if (document.body) {
                document.body.appendChild(canvasElement);
                console.log('✅ Canvas元素已添加到页面');
            } else {
                // 如果document.body不存在，等待DOM加载完成
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.appendChild(canvasElement);
                    console.log('✅ Canvas元素已添加到页面（延迟）');
                });
            }
            
            // 使用新创建的Canvas元素
            this.canvas = canvasElement;
            this.ctx = this.canvas.getContext('2d');
            
        } catch (error) {
            console.error('❌ 创建Canvas元素失败:', error);
        }
    }
    
    init() {
        try {
            console.log('🔧 开始初始化游戏...');
            
            // 设置触摸事件
            this.setupTouchEvents();
            console.log('✅ 触摸事件设置成功');
            
            // 开始游戏循环
            this.gameLoop();
            console.log('✅ 游戏循环启动成功');
            
        } catch (error) {
            console.error('❌ 初始化失败:', error);
            this.showError('初始化失败: ' + error.message);
        }
    }
    
    // 设置触摸事件
    setupTouchEvents() {
        try {
            // 使用抖音小游戏的触摸事件
            if (typeof tt !== 'undefined') {
                tt.onTouchStart(this.onTouchStart.bind(this));
                console.log('✅ 抖音触摸事件设置成功');
            } else {
                // 备用方案：使用标准触摸事件
                this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
                this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
                console.log('✅ 标准触摸事件设置成功');
            }
        } catch (error) {
            console.error('❌ 触摸事件设置失败:', error);
        }
    }
    
    // 鼠标事件处理（备用方案）
    onMouseDown(e) {
        try {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            console.log('🖱️ 鼠标点击:', x, y);
            
            // 转换为触摸事件格式
            const touch = {
                clientX: x,
                clientY: y
            };
            
            this.handleTouch(touch);
            
        } catch (error) {
            console.error('❌ 鼠标事件处理失败:', error);
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
            // 确保Canvas和上下文存在
            if (!this.canvas || !this.ctx) {
                console.error('❌ Canvas或上下文不存在');
                return;
            }
            
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
            
            // 绘制调试信息
            this.drawDebugInfo();
            
        } catch (error) {
            console.error('❌ 首页UI绘制失败:', error);
        }
    }
    
    // 新增：绘制调试信息
    drawDebugInfo() {
        try {
            this.ctx.fillStyle = '#E67E22';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Canvas尺寸: ${this.width} x ${this.height}`, 20, this.height - 60);
            this.ctx.fillText(`游戏状态: ${this.gameState}`, 20, this.height - 40);
            
            // 显示触摸坐标
            if (this.lastTouchX !== undefined && this.lastTouchY !== undefined) {
                this.ctx.fillText(`触摸坐标: ${this.lastTouchX}, ${this.lastTouchY}`, 20, this.height - 20);
            } else {
                this.ctx.fillText(`触摸坐标: 等待触摸...`, 20, this.height - 20);
            }
            
            // 显示按钮位置信息
            if (this.startButton) {
                this.ctx.fillStyle = '#9B59B6';
                this.ctx.fillText(`开始按钮: (${this.startButton.x}, ${this.startButton.y}) ${this.startButton.width}x${this.startButton.height}`, 20, this.height - 80);
            }
            
        } catch (error) {
            console.error('❌ 调试信息绘制失败:', error);
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
            let touch;
            
            if (e.touches && e.touches[0]) {
                // 抖音小游戏触摸事件
                touch = e.touches[0];
            } else if (e.clientX !== undefined) {
                // 标准触摸事件
                touch = e;
            } else {
                console.error('❌ 未知的触摸事件格式:', e);
                return;
            }
            
            console.log('👆 触摸事件:', touch.clientX, touch.clientY);
            
            // 更新调试信息
            this.lastTouchX = touch.clientX;
            this.lastTouchY = touch.clientY;
            
            this.handleTouch(touch);
            
        } catch (error) {
            console.error('❌ 触摸处理失败:', error);
        }
    }
    
    // 统一的触摸处理
    handleTouch(touch) {
        try {
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
        } else {
            console.log('👆 触摸位置不在按钮上:', touch.clientX, touch.clientY);
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
            if (this.ctx) {
                this.ctx.fillStyle = '#E74C3C';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('错误: ' + message, this.width / 2, this.height / 2);
            }
        } catch (error) {
            console.error('❌ 无法显示错误信息:', error);
        }
    }
    
    showRenderError(message) {
        try {
            if (this.ctx) {
                this.ctx.fillStyle = '#E74C3C';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('渲染错误: ' + message, this.width / 2, 50);
            }
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
