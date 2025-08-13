console.log('使用抖音开发者工具开发过程中可以参考以下文档:');
console.log(
  'https://developer.open-douyin.com/docs/resource/zh-CN/mini-game/guide/minigame/introduction',
);

// 游戏主类
class GunsGame {
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
        this.gameState = 'home'; // home, playing, gameOver, victory
        this.score = 0;
        this.coins = 0;
        
        // 角色 - 固定在屏幕下方，不移动
        this.player = {
            x: this.width / 2 - 20, // 居中显示
            y: this.height - 150, // 固定Y位置
            width: 40,
            height: 60,
            speed: 0, // 不移动
            health: 100,
            currentWeapon: null,
            isUsingWeapon: false,
            canMove: false // 不能移动
        };
        
        // 武器系统 - 连发子弹，用完撤下
        this.weapons = {
            pistol: { 
                name: '手枪', 
                damage: 20, 
                range: 200, 
                cooldown: 100, // 连发间隔
                maxAmmo: 6, // 弹夹容量
                currentAmmo: 6, // 当前弹夹子弹数
                fireRate: 6 // 每秒发射子弹数
            },
            rifle: { 
                name: '步枪', 
                damage: 35, 
                range: 300, 
                cooldown: 80, // 连发间隔
                maxAmmo: 10, // 弹夹容量
                currentAmmo: 10, // 当前弹夹子弹数
                fireRate: 10 // 每秒发射子弹数
            },
            grenade: { 
                name: '手雷', 
                damage: 80, 
                range: 150, 
                cooldown: 1000,
                maxAmmo: 1, // 弹夹容量
                currentAmmo: 1, // 当前弹夹子弹数
                fireRate: 1 // 每秒发射数量
            }
        };
        
        // 怪物波次系统
        this.waveNumber = 1;
        this.monstersPerWave = 5;
        this.waveDelay = 3000; // 3秒后生成下一波
        this.lastWaveTime = 0;
        
        // 道具补充系统
        this.lastReloadTime = 0;
        this.reloadInterval = 1500; // 1.5秒补充一次
        
        // 道具栏 - 居中显示，优化间距
        this.inventory = [
            { type: 'pistol', x: this.width / 2 - 80, y: this.height - 100, width: 60, height: 60 },
            { type: 'rifle', x: this.width / 2 - 20, y: this.height - 100, width: 60, height: 60 },
            { type: 'grenade', x: this.width / 2 + 40, y: this.height - 100, width: 60, height: 60 }
        ];
        
        // 游戏对象
        this.bullets = [];
        this.monsters = [];
        this.explosions = [];
        
        // 触摸事件
        this.draggedItem = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // 首页升级系统
        this.playerLevel = 1;
        this.weaponLevels = {
            pistol: 1,
            rifle: 1,
            grenade: 1
        };
        this.upgradeCosts = {
            pistol: 100,
            rifle: 200,
            grenade: 300
        };
        
        // 自动瞄准系统
        this.currentTarget = null; // 当前瞄准的怪物
        this.isAutoFiring = false; // 是否正在自动射击
        this.lastFireTime = 0; // 上次射击时间
        
        // 自动瞄准系统
        this.currentTarget = 0; // 当前瞄准的怪物索引
        this.isAutoFiring = false; // 是否正在自动射击
        this.lastFireTime = 0; // 上次射击时间
        
        // 怪物初始位置（屏幕上方）
        this.monsterPositions = [
            { x: this.width * 0.2, y: 100 },
            { x: this.width * 0.5, y: 80 },
            { x: this.width * 0.8, y: 120 },
            { x: this.width * 0.3, y: 150 },
            { x: this.width * 0.7, y: 180 }
        ];
        
        console.log('游戏初始化完成，开始游戏循环');
        this.init();
    }
    
    init() {
        // 设置触摸事件
        tt.onTouchStart(this.onTouchStart.bind(this));
        tt.onTouchMove(this.onTouchMove.bind(this));
        tt.onTouchEnd(this.onTouchEnd.bind(this));
        
        // 开始游戏循环
        this.gameLoop();
    }
    
    // 生成移动的怪物
    spawnFixedMonsters() {
        this.monsterPositions.forEach((pos, index) => {
            const monster = {
                x: pos.x,
                y: pos.y,
                width: 40,
                height: 40,
                speed: 1, // 怪物移动速度
                health: 50 + Math.random() * 50,
                maxHealth: 50 + Math.random() * 50,
                isAlive: true
            };
            this.monsters.push(monster);
        });
        
        // 自动选择第一个目标
        this.selectNextTarget();
    }
    
    // 生成新一波怪物
    spawnNewWave() {
        if (Date.now() - this.lastWaveTime < this.waveDelay) {
            return;
        }
        
        // 清空当前怪物
        this.monsters = [];
        
        // 生成新一波怪物，位置随机
        for (let i = 0; i < this.monstersPerWave; i++) {
            const x = 50 + Math.random() * (this.width - 100);
            const y = 80 + i * 60;
            
            const monster = {
                x: x,
                y: y,
                width: 40,
                height: 40,
                speed: 1 + this.waveNumber * 0.05, // 每波速度增加
                health: 50 + this.waveNumber * 10 + Math.random() * 20, // 每波血量增加
                maxHealth: 50 + this.waveNumber * 10 + Math.random() * 50,
                isAlive: true
            };
            this.monsters.push(monster);
        }
        
        this.waveNumber++;
        this.lastWaveTime = Date.now();
        this.selectNextTarget();
        
        console.log(`第${this.waveNumber}波怪物生成完成`);
    }
    
    // 选择下一个目标
    selectNextTarget() {
        const aliveMonsters = this.monsters.filter(m => m.isAlive);
        if (aliveMonsters.length > 0) {
            this.currentTarget = aliveMonsters[0];
        } else {
            this.currentTarget = null;
        }
    }
    
    onTouchStart(e) {
        const touch = e.touches[0];
        
        console.log('触摸开始:', touch.clientX, touch.clientY);
        
        if (this.gameState === 'home') {
            this.handleHomeTouch(touch);
        } else if (this.gameState === 'playing') {
            this.handleGameTouch(touch);
        } else if (this.gameState === 'gameOver') {
            this.handleGameOverTouch(touch);
        }
    }
    
    // 处理首页触摸
    handleHomeTouch(touch) {
        // 开始游戏按钮
        const startButton = {
            x: this.width / 2 - 80,
            y: this.height / 2 + 50,
            width: 160,
            height: 50
        };
        
        if (this.isPointInRect(touch.clientX, touch.clientY, startButton)) {
            this.startGame();
            return;
        }
        
        // 升级按钮
        const upgradeButtons = [
            { type: 'pistol', x: this.width / 2 - 100, y: this.height / 2 - 100, width: 80, height: 40 },
            { type: 'rifle', x: this.width / 2 - 100, y: this.height / 2 - 40, width: 80, height: 40 },
            { type: 'grenade', x: this.width / 2 - 100, y: this.height / 2 + 20, width: 80, height: 40 }
        ];
        
        for (let button of upgradeButtons) {
            if (this.isPointInRect(touch.clientX, touch.clientY, button)) {
                this.upgradeWeapon(button.type);
                return;
            }
        }
    }
    
    // 处理游戏中的触摸
    handleGameTouch(touch) {
        // 检查是否点击道具
        for (let item of this.inventory) {
            if (this.isPointInRect(touch.clientX, touch.clientY, item)) {
                // 直接使用道具，不需要拖拽
                this.player.currentWeapon = item.type;
                console.log('道具使用成功:', this.weapons[item.type].name);
                console.log('角色当前武器:', this.player.currentWeapon);
                
                this.startAutoFire(); // 开始自动射击
                return;
            }
        }
        
        // 检查是否点击怪物
        for (let monster of this.monsters) {
            if (monster.isAlive && this.isPointInRect(touch.clientX, touch.clientY, monster)) {
                this.shootAtMonster(monster);
                return;
            }
        }
        
        // 如果点击空白位置，切换目标
        if (!this.isPointInRect(touch.clientX, touch.clientY, this.player)) {
            this.switchTarget();
        }
    }
    
    // 处理游戏结束触摸
    handleGameOverTouch(touch) {
        const returnButton = {
            x: this.width / 2 - 60,
            y: this.height / 2 + 120,
            width: 120,
            height: 40
        };
        
        if (this.isPointInRect(touch.clientX, touch.clientY, returnButton)) {
            this.returnToHome();
        }
    }
    
    onTouchMove(e) {
        // 不需要拖拽，移除拖拽逻辑
    }
    
    onTouchEnd(e) {
        // 不需要拖拽，移除拖拽逻辑
    }
    
    // 开始自动射击
    startAutoFire() {
        this.isAutoFiring = true;
        this.player.isUsingWeapon = true;
        this.player.canMove = false;
        console.log('开始自动射击:', this.weapons[this.player.currentWeapon].name);
        console.log('当前目标:', this.currentTarget);
        console.log('自动射击状态:', this.isAutoFiring);
    }
    
    // 点击怪物射击
    shootAtMonster(monster) {
        if (!this.player.currentWeapon) {
            console.log('没有装备武器');
            return;
        }
        
        const weapon = this.weapons[this.player.currentWeapon];
        if (weapon.currentAmmo <= 0) {
            console.log('子弹不足');
            return;
        }
        
        // 发射子弹瞄准怪物
        const bullet = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y - 30,
            width: 4,
            height: 8,
            speed: 8,
            damage: weapon.damage,
            targetMonster: monster
        };
        
        // 计算子弹到怪物的方向
        const targetX = monster.x + monster.width / 2;
        const targetY = monster.y + monster.height / 2;
        const dx = targetX - bullet.x;
        const dy = targetY - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            bullet.vx = (dx / distance) * bullet.speed;
            bullet.vy = (dy / distance) * bullet.speed;
        } else {
            bullet.vx = 0;
            bullet.vy = -bullet.speed;
        }
        
        this.bullets.push(bullet);
        weapon.currentAmmo--;
        console.log('点击射击，剩余子弹:', weapon.currentAmmo);
    }
    
    // 开始游戏
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.player.health = 100;
        this.spawnFixedMonsters();
        console.log('游戏开始');
    }
    
    // 返回首页
    returnToHome() {
        this.gameState = 'home';
        this.monsters = [];
        this.bullets = [];
        this.explosions = [];
        this.player.currentWeapon = null;
        this.isAutoFiring = false;
        console.log('返回首页');
    }
    
    // 升级武器
    upgradeWeapon(weaponType) {
        const cost = this.upgradeCosts[weaponType];
        if (this.coins >= cost) {
            this.coins -= cost;
            this.weaponLevels[weaponType]++;
            
            // 提升武器属性
            const weapon = this.weapons[weaponType];
            weapon.damage += 10;
            weapon.maxAmmo += 2;
            weapon.currentAmmo = weapon.maxAmmo;
            
            // 提升升级成本
            this.upgradeCosts[weaponType] = Math.floor(cost * 1.5);
            
            console.log(`${weapon.name}升级成功，当前等级: ${this.weaponLevels[weaponType]}`);
        } else {
            console.log('金币不足，无法升级');
        }
    }
    
    // 停止自动射击
    stopAutoFire() {
        this.isAutoFiring = false;
        this.player.isUsingWeapon = false;
        this.player.canMove = true;
        console.log('停止自动射击');
    }
    
    // 重新开始游戏
    restartGame() {
        console.log('重新开始游戏');
        this.gameState = 'playing';
        this.score = 0;
        this.coins = 0;
        this.waveNumber = 1;
        this.player.health = 100;
        this.player.currentWeapon = null;
        this.player.canMove = true;
        this.isAutoFiring = false;
        this.currentTarget = null;
        this.bullets = [];
        this.monsters = [];
        this.explosions = [];
        
        // 重置武器子弹
        this.weapons.pistol.currentAmmo = this.weapons.pistol.maxAmmo;
        this.weapons.rifle.currentAmmo = this.weapons.rifle.maxAmmo;
        this.weapons.grenade.currentAmmo = this.weapons.grenade.maxAmmo;
        
        // 重置补充时间
        this.lastReloadTime = 0;
        
        // 生成第一波怪物
        this.spawnFixedMonsters();
    }
    
    // 切换目标
    switchTarget() {
        const aliveMonsters = this.monsters.filter(m => m.isAlive);
        if (aliveMonsters.length > 0) {
            // 找到当前目标的下一个
            if (this.currentTarget) {
                const currentIndex = aliveMonsters.indexOf(this.currentTarget);
                const nextIndex = (currentIndex + 1) % aliveMonsters.length;
                this.currentTarget = aliveMonsters[nextIndex];
            } else {
                this.currentTarget = aliveMonsters[0];
            }
            console.log('切换到目标:', this.currentTarget);
        }
    }
    
    // 自动射击逻辑
    autoFire() {
        if (!this.isAutoFiring || !this.player.currentWeapon) {
            return;
        }
        
        // 如果没有目标，尝试选择目标
        if (!this.currentTarget) {
            this.selectNextTarget();
            if (!this.currentTarget) {
                console.log('没有可用的目标，等待怪物生成');
                return;
            }
        }
        
        const weapon = this.weapons[this.player.currentWeapon];
        const now = Date.now();
        
        // 检查射击间隔
        if (now - this.lastFireTime < weapon.cooldown) {
            return;
        }
        
        // 检查弹夹子弹
        if (weapon.currentAmmo <= 0) {
            // 弹夹空了，撤下武器
            this.removeWeapon();
            return;
        }
        
        // 发射子弹
        this.fireBullet();
        this.lastFireTime = now;
    }
    
    // 发射子弹
    fireBullet() {
        const weapon = this.weapons[this.player.currentWeapon];
        
        if (this.player.currentWeapon === 'grenade') {
            // 手雷直接爆炸
            this.createExplosion(this.currentTarget.x, this.currentTarget.y);
            this.damageMonstersInRange(this.currentTarget.x, this.currentTarget.y, weapon.range, weapon.damage);
            weapon.currentAmmo = 0; // 手雷用完
        } else {
            // 发射子弹 - 自动瞄准怪物
            const bullet = {
                x: this.player.x + this.player.width / 2,
                y: this.player.y - 30,
                width: 4,
                height: 8,
                speed: 8,
                damage: weapon.damage
            };
            
            if (this.currentTarget) {
                // 计算子弹到目标的方向
                const targetX = this.currentTarget.x + this.currentTarget.width / 2;
                const targetY = this.currentTarget.y + this.currentTarget.height / 2;
                const dx = targetX - bullet.x;
                const dy = targetY - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    // 设置子弹速度向量，瞄准目标
                    bullet.vx = (dx / distance) * bullet.speed;
                    bullet.vy = (dy / distance) * bullet.speed;
                } else {
                    // 如果目标就在角色位置，向上发射
                    bullet.vx = 0;
                    bullet.vy = -bullet.speed;
                }
            } else {
                // 没有目标时向上发射
                bullet.vx = 0;
                bullet.vy = -bullet.speed;
            }
            
            this.bullets.push(bullet);
        }
        
        // 减少子弹数量
        weapon.currentAmmo--;
    }
    
    // 子弹用完，撤下武器
    removeWeapon() {
        console.log('子弹用完，撤下武器:', this.weapons[this.player.currentWeapon].name);
        this.player.currentWeapon = null;
        this.stopAutoFire();
    }
    
    // 自动补充道具
    autoReloadWeapons() {
        const now = Date.now();
        if (now - this.lastReloadTime >= this.reloadInterval) {
            // 补充手枪子弹
            if (this.weapons.pistol.currentAmmo < this.weapons.pistol.maxAmmo) {
                this.weapons.pistol.currentAmmo = this.weapons.pistol.maxAmmo;
                console.log('手枪子弹补充完成');
            }
            
            // 补充步枪子弹
            if (this.weapons.rifle.currentAmmo < this.weapons.rifle.maxAmmo) {
                this.weapons.rifle.currentAmmo = this.weapons.rifle.maxAmmo;
                console.log('步枪子弹补充完成');
            }
            
            // 补充手雷
            if (this.weapons.grenade.currentAmmo < this.weapons.grenade.maxAmmo) {
                this.weapons.grenade.currentAmmo = this.weapons.grenade.maxAmmo;
                console.log('手雷补充完成');
            }
            
            this.lastReloadTime = now;
        }
    }
    
    // 人物不移动，移除自动对准功能
    autoAimAtMonster() {
        // 角色固定位置，不需要自动对准
    }
    
    createExplosion(x, y) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 50,
            alpha: 1,
            duration: 30
        });
    }
    
    damageMonstersInRange(x, y, range, damage) {
        for (let monster of this.monsters) {
            if (!monster.isAlive) continue;
            
            const distance = Math.sqrt((monster.x - x) ** 2 + (monster.y - y) ** 2);
            if (distance <= range) {
                monster.health -= damage;
                if (monster.health <= 0) {
                    this.killMonster(monster);
                }
            }
        }
    }
    
    killMonster(monster) {
        monster.isAlive = false;
        this.score += 100;
        this.coins += Math.floor(Math.random() * 5) + 1;
        
        // 如果当前目标死亡，自动切换目标
        if (this.currentTarget === monster) {
            this.selectNextTarget();
            
            // 如果还有目标，继续射击
            if (this.currentTarget) {
                console.log('目标死亡，切换到新目标');
            } else {
                // 没有更多目标，停止射击
                this.stopAutoFire();
            }
        }
    }
    
    resetInventoryPositions() {
        this.inventory[0].x = this.width / 2 - 80;
        this.inventory[0].y = this.height - 100;
        this.inventory[1].x = this.width / 2 - 20;
        this.inventory[1].y = this.height - 100;
        this.inventory[2].x = this.width / 2 + 40;
        this.inventory[2].y = this.height - 100;
    }
    
    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }
    
    update() {
        if (this.gameState !== 'playing') return;
        
        // 角色不自动向上移动，保持在固定Y位置
        
        // 自动射击逻辑
        if (this.isAutoFiring && this.player.currentWeapon) {
            console.log('更新中 - 自动射击状态:', this.isAutoFiring, '武器:', this.player.currentWeapon, '目标:', this.currentTarget);
        }
        this.autoFire();
        
        // 自动补充道具
        this.autoReloadWeapons();
        
        // 人物不移动，移除自动对准功能
        
        // 更新怪物位置 - 朝角色移动
        for (let monster of this.monsters) {
            if (!monster.isAlive) continue;
            
            // 计算怪物到角色的方向
            const dx = this.player.x + this.player.width / 2 - (monster.x + monster.width / 2);
            const dy = this.player.y + this.player.height / 2 - (monster.y + monster.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // 怪物朝角色移动
                monster.x += (dx / distance) * monster.speed;
                monster.y += (dy / distance) * monster.speed;
            }
            
            // 检查怪物是否到达角色位置
            if (distance < 50) {
                this.player.health -= 5; // 怪物接触角色造成5点伤害
                monster.isAlive = false; // 怪物消失
                console.log('怪物接触角色，造成5点伤害，怪物消失');
                
                // 检查游戏是否结束
                if (this.player.health <= 0) {
                    this.gameState = 'gameOver';
                }
            }
        }
        
        // 更新子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 如果子弹有速度向量，使用向量移动
            if (bullet.vx !== undefined && bullet.vy !== undefined) {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
            } else {
                // 兼容旧子弹（向上移动）
                bullet.y -= bullet.speed;
            }
            
            // 检查子弹与怪物的碰撞
            for (let j = this.monsters.length - 1; j >= 0; j--) {
                const monster = this.monsters[j];
                if (!monster.isAlive) continue;
                
                if (this.checkCollision(bullet, monster)) {
                    monster.health -= bullet.damage;
                    this.bullets.splice(i, 1);
                    
                    if (monster.health <= 0) {
                        this.killMonster(monster);
                    }
                    break;
                }
            }
            
            // 检查子弹是否超出射程
            if (bullet.targetMonster && !bullet.targetMonster.isAlive) {
                this.bullets.splice(i, 1);
            }
            
            // 移除超出屏幕的子弹
            if (bullet.x < -10 || bullet.x > this.width + 10 || 
                bullet.y < -10 || bullet.y > this.height + 10) {
                this.bullets.splice(i, 1);
            }
        }
        
        // 更新爆炸效果
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.radius += 2;
            explosion.alpha -= 0.03;
            explosion.duration--;
            
            if (explosion.duration <= 0) {
                this.explosions.splice(i, 1);
            }
        }
        
        // 检查游戏结束条件
        if (this.player.health <= 0) {
            this.gameState = 'gameOver';
        }
        
        // 检查是否所有怪物都被消灭
        const aliveMonsters = this.monsters.filter(m => m.isAlive);
        if (aliveMonsters.length === 0) {
            // 生成新一波怪物
            this.spawnNewWave();
        }
    }
    
    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawBackground();
        
        if (this.gameState === 'playing') {
            this.drawPlayer();
            this.drawMonsters();
            this.drawBullets();
            this.drawExplosions();
            this.drawInventory();
        }
        
        this.drawUI();
    }
    
    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#E0F6FF');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawPlayer() {
        // 根据状态绘制角色
        if (this.player.isUsingWeapon) {
            this.ctx.fillStyle = '#FF6B6B'; // 使用武器时变红
        } else if (!this.player.canMove) {
            this.ctx.fillStyle = '#FFA500'; // 不能移动时变橙
        } else {
            this.ctx.fillStyle = '#4ECDC4'; // 正常状态
        }
        
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        
        // 绘制角色头部
        this.ctx.fillStyle = '#FFEAA7';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2, this.player.y - 10, 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制角色眼睛
        this.ctx.fillStyle = '#2D3436';
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2 - 5, this.player.y - 12, 3, 0, Math.PI * 2);
        this.ctx.arc(this.player.x + this.player.width / 2 + 5, this.player.y - 12, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 绘制当前武器信息
        if (this.player.currentWeapon) {
            const weapon = this.weapons[this.player.currentWeapon];
            this.ctx.fillStyle = '#FFA500';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${weapon.name}: ${weapon.currentAmmo}/${weapon.maxAmmo}`, 
                            this.player.x - 10, this.player.y - 20);
        }
        
        // 绘制当前目标指示器
        if (this.currentTarget && this.currentTarget.isAlive) {
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(this.currentTarget.x + this.currentTarget.width / 2, 
                         this.currentTarget.y + this.currentTarget.height / 2, 25, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawMonsters() {
        for (let monster of this.monsters) {
            if (!monster.isAlive) continue;
            
            // 根据血量绘制不同颜色
            const healthPercent = monster.health / monster.maxHealth;
            if (healthPercent > 0.6) {
                this.ctx.fillStyle = '#9B59B6'; // 健康
            } else if (healthPercent > 0.3) {
                this.ctx.fillStyle = '#E67E22'; // 受伤
            } else {
                this.ctx.fillStyle = '#E74C3C'; // 重伤
            }
            
            this.ctx.fillRect(monster.x, monster.y, monster.width, monster.height);
            
            // 绘制血条
            this.drawHealthBar(monster.x, monster.y - 10, monster.width, monster.health, monster.maxHealth);
        }
    }
    
    drawBullets() {
        this.ctx.fillStyle = '#FFD700';
        for (let bullet of this.bullets) {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
    }
    
    drawExplosions() {
        for (let explosion of this.explosions) {
            this.ctx.globalAlpha = explosion.alpha;
            this.ctx.fillStyle = '#FF6B6B';
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawInventory() {
        // 计算道具栏居中位置
        const inventoryWidth = 200; // 调整宽度以匹配道具间距
        const inventoryX = this.width / 2 - inventoryWidth / 2;
        
        // 绘制道具栏背景 - 渐变效果
        const inventoryGradient = this.ctx.createLinearGradient(0, this.height - 120, 0, this.height - 40);
        inventoryGradient.addColorStop(0, 'rgba(52, 73, 94, 0.9)');
        inventoryGradient.addColorStop(1, 'rgba(44, 62, 80, 0.9)');
        this.ctx.fillStyle = inventoryGradient;
        this.ctx.fillRect(inventoryX, this.height - 120, inventoryWidth, 80);
        
        // 绘制道具栏边框
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(inventoryX, this.height - 120, inventoryWidth, 80);
        
        // 绘制道具栏标题
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText('🎒 道具栏', inventoryX + 10, this.height - 125);
        
        // 调试信息 - 显示道具栏位置
        if (this.gameState === 'playing') {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`道具栏X: ${inventoryX}, 宽度: ${inventoryWidth}`, inventoryX + 10, this.height - 110);
        }
        
        for (let item of this.inventory) {
            const weapon = this.weapons[item.type];
            
            // 绘制道具背景 - 圆角矩形效果
            if (weapon.currentAmmo > 0) {
                // 有子弹 - 渐变背景
                const itemGradient = this.ctx.createLinearGradient(item.x, item.y, item.x, item.y + item.height);
                itemGradient.addColorStop(0, '#3498db');
                itemGradient.addColorStop(1, '#2980b9');
                this.ctx.fillStyle = itemGradient;
            } else {
                // 无子弹 - 灰色背景
                this.ctx.fillStyle = '#95a5a6';
            }
            
            // 绘制圆角矩形（模拟）
            this.ctx.fillRect(item.x, item.y, item.width, item.height);
            
            // 绘制高光效果
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.fillRect(item.x, item.y, item.width, item.height / 3);
            
            // 绘制边框
            this.ctx.strokeStyle = weapon.currentAmmo > 0 ? '#FFFFFF' : '#bdc3c7';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(item.x, item.y, item.width, item.height);
            
            // 绘制武器图标
            const weaponIcons = { 'pistol': '🔫', 'rifle': '🎯', 'grenade': '💣' };
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(weaponIcons[item.type], item.x + item.width / 2, item.y + 20);
            
            // 绘制武器名称
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(weapon.name, item.x + item.width / 2, item.y + 35);
            
            // 绘制子弹数量
            this.ctx.fillStyle = weapon.currentAmmo > 0 ? '#f1c40f' : '#e74c3c';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`${weapon.currentAmmo}/${weapon.maxAmmo}`, item.x + item.width / 2, item.y + 50);
            
            // 绘制选中状态指示器
            if (this.player.currentWeapon === item.type) {
                this.ctx.strokeStyle = '#f39c12';
                this.ctx.lineWidth = 3;
                this.ctx.strokeRect(item.x - 2, item.y - 2, item.width + 4, item.height + 4);
            }
            
            // 调试信息 - 显示道具位置
            if (this.gameState === 'playing') {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(`${item.type}: (${item.x}, ${item.y})`, item.x, item.y + 65);
            }
        }
        
        this.ctx.textAlign = 'left';
    }
    
    drawHealthBar(x, y, width, current, max) {
        const barHeight = 4;
        const healthPercent = current / max;
        
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.fillRect(x, y, width, barHeight);
        
        this.ctx.fillStyle = '#2ECC71';
        this.ctx.fillRect(x, y, width * healthPercent, barHeight);
    }
    
    drawUI() {
        if (this.gameState === 'home') {
            this.drawHomeUI();
        } else if (this.gameState === 'playing') {
            this.drawGameUI();
        } else if (this.gameState === 'gameOver') {
            this.drawGameOverUI();
        }
    }
    
    // 绘制首页UI
    drawHomeUI() {
        // 绘制渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制装饰性圆形
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(this.width * 0.8, 100, 80, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(this.width * 0.2, this.height * 0.7, 60, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 标题区域
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(this.width / 2 - 120, 60, 240, 80);
        
        // 标题
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎮 射击冒险', this.width / 2, 100);
        
        // 玩家信息卡片
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(this.width / 2 - 100, 160, 200, 80);
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`👑 等级: ${this.playerLevel}`, this.width / 2 - 80, 185);
        this.ctx.fillText(`💰 金币: ${this.coins}`, this.width / 2 - 80, 210);
        
        // 武器升级区域
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(this.width / 2 - 120, 260, 240, 200);
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔫 武器升级', this.width / 2, 285);
        
        const weapons = ['pistol', 'rifle', 'grenade'];
        const weaponNames = ['手枪', '步枪', '手雷'];
        const weaponIcons = ['🔫', '🎯', '💣'];
        
        for (let i = 0; i < weapons.length; i++) {
            const weaponType = weapons[i];
            const weapon = this.weapons[weaponType];
            const level = this.weaponLevels[weaponType];
            const cost = this.upgradeCosts[weaponType];
            
            // 武器信息卡片
            this.ctx.fillStyle = 'rgba(52, 73, 94, 0.1)';
            this.ctx.fillRect(this.width / 2 - 100, 300 + i * 50, 200, 40);
            
            // 武器图标和名称
            this.ctx.fillStyle = '#2C3E50';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${weaponIcons[i]} ${weaponNames[i]} Lv.${level}`, this.width / 2 - 90, 320 + i * 50);
            
            // 伤害信息
            this.ctx.fillStyle = '#E74C3C';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`伤害: ${weapon.damage}`, this.width / 2 - 90, 335 + i * 50);
            
            // 升级按钮
            const button = {
                x: this.width / 2 + 20,
                y: 305 + i * 50,
                width: 70,
                height: 30
            };
            
            // 按钮背景
            if (this.coins >= cost) {
                this.ctx.fillStyle = '#4ECDC4';
            } else {
                this.ctx.fillStyle = '#95A5A6';
            }
            this.ctx.fillRect(button.x, button.y, button.width, button.height);
            
            // 按钮文字
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('升级', button.x + 35, button.y + 20);
            
            // 升级费用
            this.ctx.fillStyle = '#F39C12';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${cost}💰`, button.x + 35, button.y + 40);
        }
        
        // 开始游戏按钮
        const startButton = {
            x: this.width / 2 - 100,
            y: this.height / 2 + 30,
            width: 200,
            height: 60
        };
        
        // 按钮渐变
        const buttonGradient = this.ctx.createLinearGradient(startButton.x, startButton.y, startButton.x, startButton.y + startButton.height);
        buttonGradient.addColorStop(0, '#2ECC71');
        buttonGradient.addColorStop(1, '#27AE60');
        this.ctx.fillStyle = buttonGradient;
        this.ctx.fillRect(startButton.x, startButton.y, startButton.width, startButton.height);
        
        // 按钮阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 5;
        
        // 按钮文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('🚀 开始游戏', startButton.x + 100, startButton.y + 38);
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        this.ctx.textAlign = 'left';
    }
    
    // 绘制游戏UI
    drawGameUI() {
        // 绘制UI背景卡片
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(15, 15, 220, 200);
        
        // 绘制UI边框
        this.ctx.strokeStyle = 'rgba(52, 73, 94, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(15, 15, 220, 200);
        
        // 分数显示
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillText(`🏆 分数: ${this.score}`, 25, 45);
        
        // 金币显示
        this.ctx.fillStyle = '#f39c12';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`💰 ${this.coins}`, 25, 75);
        
        // 生命值条
        this.drawHealthBar(25, 95, 200, this.player.health, 100);
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`❤️ 生命: ${this.player.health}`, 25, 115);
        
        // 波次显示
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText(`🌊 波次: ${this.waveNumber}`, 25, 140);
        
        // 绘制操作提示
        this.ctx.fillStyle = '#34495e';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('🎯 点击道具即可使用武器', 25, 165);
        this.ctx.fillText('🎯 点击怪物进行射击', 25, 185);
        this.ctx.fillText('🎯 点击空白处切换目标', 25, 205);
    }
    
    // 绘制游戏结束UI
    drawGameOverUI() {
        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 主卡片背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.fillRect(this.width / 2 - 150, this.height / 2 - 120, 300, 240);
        
        // 卡片边框
        this.ctx.strokeStyle = 'rgba(52, 73, 94, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(this.width / 2 - 150, this.height / 2 - 120, 300, 240);
        
        // 游戏结束标题
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('💀 游戏结束', this.width / 2, this.height / 2 - 80);
        
        // 结果信息
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`🏆 最终分数: ${this.score}`, this.width / 2, this.height / 2 - 40);
        this.ctx.fillText(`💰 获得金币: ${this.coins}`, this.width / 2, this.height / 2 - 10);
        this.ctx.fillText(`🌊 波次: ${this.waveNumber}`, this.width / 2, this.height / 2 + 20);
        
        // 返回按钮
        const returnButton = {
            x: this.width / 2 - 80,
            y: this.height / 2 + 50,
            width: 160,
            height: 50
        };
        
        // 按钮渐变
        const buttonGradient = this.ctx.createLinearGradient(returnButton.x, returnButton.y, returnButton.x, returnButton.y + returnButton.height);
        buttonGradient.addColorStop(0, '#4ECDC4');
        buttonGradient.addColorStop(1, '#44A08D');
        this.ctx.fillStyle = buttonGradient;
        this.ctx.fillRect(returnButton.x, returnButton.y, returnButton.width, returnButton.height);
        
        // 按钮阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 4;
        
        // 按钮文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText('🏠 返回主菜单', returnButton.x + 80, returnButton.y + 32);
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        this.ctx.textAlign = 'left';
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 游戏启动
console.log('🎮 射击冒险游戏代码加载完成');

// 使用多种方式确保游戏启动
tt.onShow(() => {
    console.log('📱 小游戏显示，启动游戏');
    new GunsGame();
});

// 如果onShow没有触发，直接启动游戏
setTimeout(() => {
    console.log('⏰ 延迟启动游戏');
    new GunsGame();
}, 1000);

// 立即启动游戏（用于测试）
console.log('🚀 立即启动游戏');
new GunsGame();
