// 简化版游戏 - 用于测试基本功能
console.log('🎮 简化版游戏启动中...');

class SimpleGame {
    constructor() {
        // 获取系统信息
        this.systemInfo = tt.getSystemInfoSync();
        
        // 创建canvas并设置尺寸
        this.canvas = tt.createCanvas();
        this.ctx = this.canvas.getContext('2d');
        
        // 设置canvas尺寸为屏幕尺寸
        this.canvas.width = this.systemInfo.windowWidth;
        this.canvas.height = this.systemInfo.windowHeight;
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        console.log('Canvas尺寸:', this.width, 'x', this.height);
        
        // 游戏状态
        this.gameState = 'playing';
        this.score = 0;
        this.coins = 0;
        
        // 角色
        this.player = {
            x: this.width / 2 - 20,
            y: this.height - 150,
            width: 40,
            height: 60,
            health: 100
        };
        
        // 怪物
        this.monsters = [
            { x: this.width * 0.2, y: 100, width: 40, height: 40, isAlive: true },
            { x: this.width * 0.5, y: 80, width: 40, height: 40, isAlive: true },
            { x: this.width * 0.8, y: 120, width: 40, height: 40, isAlive: true }
        ];
        
        // 道具栏
        this.inventory = [
            { type: 'pistol', x: 50, y: this.height - 80, width: 60, height: 60 },
            { type: 'rifle', x: 130, y: this.height - 80, width: 60, height: 60 },
            { type: 'grenade', x: 210, y: this.height - 80, width: 60, height: 60 }
        ];
        
        // 启动游戏
        this.init();
    }
    
    init() {
        console.log('游戏初始化完成，开始游戏循环');
        this.gameLoop();
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 简单的更新逻辑
        if (this.gameState !== 'playing') return;
        
        // 更新怪物位置 - 向玩家移动
        for (let monster of this.monsters) {
            if (!monster.isAlive) continue;
            
            const dx = this.player.x - monster.x;
            const dy = this.player.y - monster.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                monster.x += (dx / distance) * 1;
                monster.y += (dy / distance) * 1;
            }
            
            // 检查是否到达玩家位置
            if (distance < 50) {
                monster.isAlive = false;
                this.player.health -= 10;
                this.score += 10;
                
                if (this.player.health <= 0) {
                    this.gameState = 'gameOver';
                }
            }
        }
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制背景
        this.drawBackground();
        
        if (this.gameState === 'playing') {
            this.drawPlayer();
            this.drawMonsters();
            this.drawInventory();
            this.drawUI();
        } else if (this.gameState === 'gameOver') {
            this.drawGameOver();
        }
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawPlayer() {
        // 绘制玩家
        this.ctx.fillStyle = '#4ECDC4';
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // 绘制玩家头部
        this.ctx.fillStyle = '#FFEAA7';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2, this.player.y - 10, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制玩家眼睛
        this.ctx.fillStyle = '#2D3436';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2 - 5, this.player.y - 12, 3, 0, Math.PI * 2);
        this.ctx.arc(this.player.x + this.player.width / 2 + 5, this.player.y - 12, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawMonsters() {
        for (let monster of this.monsters) {
            if (!monster.isAlive) continue;
            
            // 绘制怪物
            this.ctx.fillStyle = '#9B59B6';
            this.ctx.fillRect(monster.x, monster.y, monster.width, monster.height);
            
            // 绘制怪物图标
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👹', monster.x + monster.width / 2, monster.y + monster.height / 2 + 8);
        }
        this.ctx.textAlign = 'left';
    }
    
    drawInventory() {
        for (let item of this.inventory) {
            // 绘制道具背景
            this.ctx.fillStyle = '#34495E';
            this.ctx.fillRect(item.x, item.y, item.width, item.height);
            
            // 绘制道具图标
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            
            let icon = '🔫';
            if (item.type === 'rifle') icon = '🔫';
            if (item.type === 'grenade') icon = '💣';
            
            this.ctx.fillText(icon, item.x + item.width / 2, item.y + item.height / 2 + 6);
            
            // 绘制道具文字
            this.ctx.font = '10px Arial';
            this.ctx.fillText(item.type, item.x + item.width / 2, item.y + item.height + 15);
        }
        this.ctx.textAlign = 'left';
    }
    
    drawUI() {
        // 绘制分数
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`分数: ${this.score}`, 20, 40);
        
        // 绘制金币
        this.ctx.fillStyle = '#F39C12';
        this.ctx.fillText(`💰 ${this.coins}`, 20, 70);
        
        // 绘制生命值
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.fillText(`❤️ ${this.player.health}`, 20, 100);
        
        // 绘制游戏标题
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('射击冒险', this.width / 2, 50);
        this.ctx.textAlign = 'left';
    }
    
    drawGameOver() {
        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 游戏结束文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💀 游戏结束', this.width / 2, this.height / 2);
        this.ctx.fillText(`🏆 最终分数: ${this.score}`, this.width / 2, this.height / 2 + 50);
        this.ctx.textAlign = 'left';
    }
}

// 启动游戏
console.log('🚀 启动简化版游戏');
new SimpleGame();
