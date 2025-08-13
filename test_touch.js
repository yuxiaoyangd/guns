// 触摸事件测试文件
console.log('🔍 触摸事件测试开始');

// 获取系统信息
const systemInfo = tt.getSystemInfoSync();
console.log('系统信息:', systemInfo);

// 创建Canvas
const canvas = tt.createCanvas();
canvas.width = systemInfo.windowWidth;
canvas.height = systemInfo.windowHeight;
const ctx = canvas.getContext('2d');

console.log('Canvas尺寸:', canvas.width, 'x', canvas.height);

// 测试道具栏
const inventory = [
    { type: 'pistol', x: 50, y: canvas.height - 100, width: 60, height: 60 },
    { type: 'rifle', x: 130, y: canvas.height - 100, width: 60, height: 60 },
    { type: 'grenade', x: 210, y: canvas.height - 100, width: 60, height: 60 }
];

console.log('道具栏位置:', inventory);

// 碰撞检测函数
function isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
}

// 绘制道具栏
function drawInventory() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制道具栏背景
    ctx.fillStyle = 'rgba(52, 73, 94, 0.8)';
    ctx.fillRect(40, canvas.height - 120, 240, 80);
    
    // 绘制道具
    for (let item of inventory) {
        ctx.fillStyle = '#34495E';
        ctx.fillRect(item.x, item.y, item.width, item.height);
        
        // 绘制边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x, item.y, item.width, item.height);
        
        // 绘制文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(item.type, item.x + 5, item.y + 25);
        ctx.fillText(`(${item.x}, ${item.y})`, item.x + 5, item.y + 45);
    }
    
    // 绘制道具栏标题
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.fillText('道具栏 - 触摸测试', 50, canvas.height - 125);
    
    // 绘制触摸提示
    ctx.fillStyle = '#2C3E50';
    ctx.font = '16px Arial';
    ctx.fillText('触摸道具栏测试点击检测', 50, 50);
    ctx.fillText('触摸坐标会显示在控制台', 50, 80);
}

// 触摸事件处理
let draggedItem = null;

tt.onTouchStart((e) => {
    const touch = e.touches[0];
    console.log('触摸开始:', touch.clientX, touch.clientY);
    
    // 检查是否点击道具
    for (let item of inventory) {
        if (isPointInRect(touch.clientX, touch.clientY, item)) {
            draggedItem = item;
            console.log('✅ 选中道具:', item.type);
            console.log('道具位置:', item.x, item.y);
            console.log('触摸位置:', touch.clientX, touch.clientY);
            break;
        } else {
            console.log('❌ 未选中道具:', item.type, '触摸位置:', touch.clientX, touch.clientY, '道具位置:', item.x, item.y);
        }
    }
    
    if (!draggedItem) {
        console.log('❌ 没有选中任何道具');
    }
});

tt.onTouchMove((e) => {
    if (draggedItem) {
        const touch = e.touches[0];
        draggedItem.x = touch.clientX - 30;
        draggedItem.y = touch.clientY - 30;
        console.log('拖拽道具:', draggedItem.type, '到位置:', draggedItem.x, draggedItem.y);
    }
});

tt.onTouchEnd((e) => {
    if (draggedItem) {
        const touch = e.changedTouches[0];
        console.log('触摸结束:', touch.clientX, touch.clientY);
        
        if (touch.clientY < canvas.height / 2) {
            console.log('✅ 道具放置成功:', draggedItem.type);
        } else {
            console.log('❌ 道具放置失败，不在上方区域');
        }
        
        // 重置道具位置
        draggedItem.x = inventory.find(item => item.type === draggedItem.type).x;
        draggedItem.y = inventory.find(item => item.type === draggedItem.type).y;
        draggedItem = null;
    }
});

// 游戏循环
function gameLoop() {
    drawInventory();
    requestAnimationFrame(gameLoop);
}

// 启动游戏循环
gameLoop();

console.log('🎮 触摸测试游戏启动完成');
