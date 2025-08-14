// 简单测试文件 - 验证游戏基本功能
console.log('🧪 开始简单测试...');

// 检查抖音小游戏环境
if (typeof tt === 'undefined') {
    console.error('❌ 抖音小游戏环境未就绪');
} else {
    console.log('✅ 抖音小游戏环境已就绪');
    
    // 获取系统信息
    try {
        const systemInfo = tt.getSystemInfoSync();
        console.log('📱 系统信息:', systemInfo);
        
        // 创建canvas
        const canvas = tt.createCanvas();
        const ctx = canvas.getContext('2d');
        
        // 设置canvas尺寸
        canvas.width = systemInfo.windowWidth;
        canvas.height = systemInfo.windowHeight;
        
        console.log('🎨 Canvas尺寸:', canvas.width, 'x', canvas.height);
        
        // 简单的渲染测试
        function testRender() {
            // 清空画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 绘制背景
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#E0F6FF');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 绘制测试文字
            ctx.fillStyle = '#2C3E50';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🧪 游戏测试中...', canvas.width / 2, canvas.height / 2);
            
            // 绘制状态信息
            ctx.fillStyle = '#34495E';
            ctx.font = '16px Arial';
            ctx.fillText(`Canvas: ${canvas.width} x ${canvas.height}`, canvas.width / 2, canvas.height / 2 + 40);
            ctx.fillText(`时间: ${new Date().toLocaleTimeString()}`, canvas.width / 2, canvas.height / 2 + 70);
            
            // 绘制一个简单的矩形
            ctx.fillStyle = '#E74C3C';
            ctx.fillRect(canvas.width / 2 - 25, canvas.height / 2 + 100, 50, 50);
            
            console.log('✅ 测试渲染完成');
        }
        
        // 执行测试渲染
        testRender();
        
        // 设置定时器，每秒更新一次
        setInterval(() => {
            testRender();
        }, 1000);
        
    } catch (error) {
        console.error('❌ 测试失败:', error);
    }
}

console.log('🧪 简单测试设置完成');
