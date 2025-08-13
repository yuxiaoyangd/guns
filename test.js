// 游戏测试版本
console.log('🎮 开始测试游戏');

// 获取系统信息
const systemInfo = tt.getSystemInfoSync();
console.log('系统信息:', systemInfo);

// 创建canvas
const canvas = tt.createCanvas();
const ctx = canvas.getContext('2d');

// 设置canvas尺寸
canvas.width = systemInfo.windowWidth;
canvas.height = systemInfo.windowHeight;

console.log('Canvas尺寸:', canvas.width, 'x', canvas.height);

// 简单的测试绘制
function testDraw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制测试文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏测试', canvas.width / 2, canvas.height / 2);
    
    // 绘制一个简单的角色
    ctx.fillStyle = '#4ECDC4';
    ctx.fillRect(canvas.width / 2 - 20, canvas.height / 2 + 20, 40, 60);
    
    // 绘制角色头部
    ctx.fillStyle = '#FFEAA7';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2 + 10, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制道具栏
    ctx.fillStyle = '#34495E';
    ctx.fillRect(50, canvas.height - 80, 60, 60);
    ctx.fillRect(130, canvas.height - 80, 60, 60);
    ctx.fillRect(210, canvas.height - 80, 60, 60);
    
    // 绘制道具文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.fillText('手枪', 65, canvas.height - 45);
    ctx.fillText('步枪', 145, canvas.height - 45);
    ctx.fillText('手雷', 225, canvas.height - 45);
    
    console.log('测试绘制完成');
}

// 启动测试
console.log('🚀 启动测试绘制');
testDraw();

// 持续绘制
setInterval(() => {
    testDraw();
}, 1000 / 60); // 60FPS

console.log('✅ 测试版本启动完成');
