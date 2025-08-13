// 武器使用测试文件
console.log('🔫 武器使用测试开始');

// 获取系统信息
const systemInfo = tt.getSystemInfoSync();
console.log('系统信息:', systemInfo);

// 创建Canvas
const canvas = tt.createCanvas();
canvas.width = systemInfo.windowWidth;
canvas.height = systemInfo.windowHeight;
const ctx = canvas.getContext('2d');

console.log('Canvas尺寸:', canvas.width, 'x', canvas.height);

// 武器配置
const weapons = {
    pistol: { 
        name: '手枪', 
        damage: 20, 
        maxAmmo: 6,
        currentAmmo: 6,
        cooldown: 200
    },
    rifle: { 
        name: '步枪', 
        damage: 35, 
        maxAmmo: 10,
        currentAmmo: 10,
        cooldown: 100
    },
    grenade: { 
        name: '手雷', 
        damage: 80, 
        maxAmmo: 1,
        currentAmmo: 1,
        cooldown: 1000
    }
};

// 道具栏
const inventory = [
    { type: 'pistol', x: 50, y: canvas.height - 100, width: 60, height: 60 },
    { type: 'rifle', x: 130, y: canvas.height - 100, width: 60, height: 60 },
    { type: 'grenade', x: 210, y: canvas.height - 100, width: 60, height: 60 }
];

// 游戏状态
let currentWeapon = null;
let isAutoFiring = false;
let lastFireTime = 0;
let bullets = [];
let draggedItem = null;

console.log('武器配置:', weapons);
console.log('道具栏位置:', inventory);

// 碰撞检测函数
function isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
}

// 绘制游戏界面
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制操作提示
    ctx.fillStyle = '#2C3E50';
    ctx.font = '16px Arial';
    ctx.fillText('点击道具即可使用武器', 50, 30);
    
    // 绘制角色（固定位置）
    ctx.fillStyle = currentWeapon ? '#E74C3C' : '#2ECC71';
    ctx.fillRect(canvas.width / 2 - 20, canvas.height - 150, 40, 60);
    
    // 绘制道具栏背景
    ctx.fillStyle = 'rgba(52, 73, 94, 0.8)';
    ctx.fillRect(40, canvas.height - 120, 240, 80);
    
    // 绘制道具
    for (let item of inventory) {
        const weapon = weapons[item.type];
        
        // 根据子弹数量绘制不同颜色
        if (weapon.currentAmmo > 0) {
            ctx.fillStyle = '#34495E';
        } else {
            ctx.fillStyle = '#E74C3C';
        }
        
        ctx.fillRect(item.x, item.y, item.width, item.height);
        
        // 绘制边框
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(item.x, item.y, item.width, item.height);
        
        // 绘制文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(weapon.name, item.x + 5, item.y + 25);
        ctx.fillText(`${weapon.currentAmmo}/${weapon.maxAmmo}`, item.x + 5, item.y + 45);
    }
    
    // 绘制道具栏标题
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Arial';
    ctx.fillText('道具栏 - 武器测试', 50, canvas.height - 125);
    
    // 绘制当前状态
    ctx.fillStyle = '#2C3E50';
    ctx.font = '16px Arial';
    ctx.fillText('当前武器:', 50, 50);
    ctx.fillText(currentWeapon ? weapons[currentWeapon].name : '无', 50, 80);
    ctx.fillText('自动射击:', 50, 110);
    ctx.fillText(isAutoFiring ? '开启' : '关闭', 50, 140);
    ctx.fillText('子弹数量:', 50, 170);
    ctx.fillText(currentWeapon ? `${weapons[currentWeapon].currentAmmo}/${weapons[currentWeapon].maxAmmo}` : '0/0', 50, 200);
    
    // 绘制子弹
    for (let bullet of bullets) {
        ctx.fillStyle = '#F39C12';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    }
}

// 触摸事件处理
tt.onTouchStart((e) => {
    const touch = e.touches[0];
    console.log('触摸开始:', touch.clientX, touch.clientY);
    
    // 检查是否点击道具
    for (let item of inventory) {
        if (isPointInRect(touch.clientX, touch.clientY, item)) {
            // 直接使用道具，不需要拖拽
            currentWeapon = item.type;
            isAutoFiring = true;
            lastFireTime = 0;
            console.log('✅ 道具使用成功:', weapons[item.type].name);
            console.log('当前武器:', currentWeapon);
            console.log('自动射击状态:', isAutoFiring);
            break;
        }
    }
});

tt.onTouchMove((e) => {
    // 不需要拖拽，移除拖拽逻辑
});

tt.onTouchEnd((e) => {
    // 不需要拖拽，移除拖拽逻辑
});

// 自动射击逻辑
function autoFire() {
    if (!isAutoFiring || !currentWeapon) {
        return;
    }
    
    const weapon = weapons[currentWeapon];
    const now = Date.now();
    
    // 检查射击间隔
    if (now - lastFireTime < weapon.cooldown) {
        return;
    }
    
    // 检查弹夹子弹
    if (weapon.currentAmmo <= 0) {
        console.log('子弹用完，停止射击');
        isAutoFiring = false;
        currentWeapon = null;
        return;
    }
    
    // 发射子弹
    const bullet = {
        x: canvas.width / 2 - 2,
        y: canvas.height - 150 - 30,
        width: 4,
        height: 8,
        speed: 8
    };
    
    // 子弹垂直向上移动
    bullet.vy = -bullet.speed;
    
    bullets.push(bullet);
    weapon.currentAmmo--;
    lastFireTime = now;
    
    console.log('发射子弹，剩余子弹:', weapon.currentAmmo);
}

// 更新子弹位置
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.y += bullet.vy;
        
        // 移除超出屏幕的子弹
        if (bullet.y < -10) {
            bullets.splice(i, 1);
        }
    }
}

// 游戏循环
function gameLoop() {
    autoFire();
    updateBullets();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// 启动游戏循环
gameLoop();

console.log('🎮 武器测试游戏启动完成');
