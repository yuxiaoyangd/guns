// 游戏入口文件
import './config.js';
import './audio.js';
import './game.js';

// 游戏启动配置
const GameLauncher = {
    // 游戏实例
    gameInstance: null,
    
    // 初始化游戏
    init() {
        console.log('🎮 射击冒险游戏启动中...');
        
        try {
            // 检查抖音小游戏环境
            if (typeof tt === 'undefined') {
                throw new Error('请在抖音小游戏环境中运行');
            }
            
            // 创建游戏实例
            this.gameInstance = new GunsGame();
            
            // 启动成功
            console.log('✅ 游戏启动成功！');
            
            // 显示游戏信息
            this.showGameInfo();
            
        } catch (error) {
            console.error('❌ 游戏启动失败:', error);
            this.showError(error.message);
        }
    },
    
    // 显示游戏信息
    showGameInfo() {
        const info = `
🎯 射击冒险 v1.0.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 游戏玩法：
   • 角色自动向上移动
   • 拖拽武器到角色身上使用
   • 击败怪物获得分数和金币
   
🎯 武器系统：
   • 手枪：基础武器，伤害20
   • 步枪：进阶武器，伤害35，射速快
   • 手雷：范围武器，伤害80
   
💡 操作提示：
   • 触摸并拖拽武器到角色身上
   • 使用武器时角色会暂停移动
   • 注意保持生命值
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;
        
        console.log(info);
    },
    
    // 显示错误信息
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4757;
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            font-family: Arial, sans-serif;
            z-index: 9999;
        `;
        errorDiv.innerHTML = `
            <h3>❌ 游戏启动失败</h3>
            <p>${message}</p>
            <p>请检查游戏环境配置</p>
        `;
        
        if (document.body) {
            document.body.appendChild(errorDiv);
        }
    },
    
    // 重启游戏
    restart() {
        if (this.gameInstance) {
            // 清理当前游戏实例
            this.gameInstance = null;
        }
        
        // 重新初始化
        setTimeout(() => {
            this.init();
        }, 100);
    },
    
    // 暂停游戏
    pause() {
        if (this.gameInstance && this.gameInstance.gameState === 'playing') {
            this.gameInstance.gameState = 'paused';
            console.log('⏸️ 游戏已暂停');
        }
    },
    
    // 恢复游戏
    resume() {
        if (this.gameInstance && this.gameInstance.gameState === 'paused') {
            this.gameInstance.gameState = 'playing';
            console.log('▶️ 游戏已恢复');
        }
    }
};

// 抖音小游戏生命周期事件
tt.onShow(() => {
    console.log('📱 小游戏显示');
    GameLauncher.init();
});

tt.onHide(() => {
    console.log('📱 小游戏隐藏');
    if (GameLauncher.gameInstance) {
        GameLauncher.pause();
    }
});

tt.onError((error) => {
    console.error('❌ 小游戏错误:', error);
});

// 全局错误处理
window.addEventListener('error', (event) => {
    console.error('🌐 全局错误:', event.error);
});

// 导出游戏启动器（用于调试）
if (typeof window !== 'undefined') {
    window.GameLauncher = GameLauncher;
}

// 开发环境下的热重载支持
if (process.env.NODE_ENV === 'development') {
    // 监听文件变化，自动重启游戏
    if (module.hot) {
        module.hot.accept('./game.js', () => {
            console.log('🔄 游戏代码已更新，正在重启...');
            GameLauncher.restart();
        });
    }
}
