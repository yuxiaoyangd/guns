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
        
        // 武器系统 - 无限子弹
        this.weapons = {
            pistol: { 
                name: '手枪', 
                damage: 20, 
                range: 200, 
                cooldown: 300, // 连发间隔
                fireRate: 6, // 每秒发射子弹数
                bulletColor: '#FFD700' // 金色子弹
            },
            rifle: { 
                name: '步枪', 
                damage: 35, 
                range: 300, 
                cooldown: 150, // 更快的射速
                fireRate: 12, // 更高的射速
                bulletColor: '#00FFFF' // 青色子弹
            },
            grenade: { 
                name: '手雷', 
                damage: 80, 
                range: 150, 
                cooldown: 1500, // 手雷冷却时间更长
                fireRate: 1, // 每秒发射数量
                bulletColor: '#FF0000' // 红色（虽然手雷不用）
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
        
        // 道具栏 - 完全居中显示，增加间距
        const itemSize = 65; // 增大道具尺寸
        const spacing = 25; // 增加间距
        const totalWidth = itemSize * 4 + spacing * 3; // 计算总宽度
        const startX = this.width / 2 - totalWidth / 2; // 计算起始X位置
        
        this.inventory = [
            { type: 'pistol', x: startX, y: this.height - 120, width: itemSize, height: itemSize },
            { type: 'rifle', x: startX + (itemSize + spacing), y: this.height - 120, width: itemSize, height: itemSize },
            { type: 'ultimate1', x: startX + (itemSize + spacing) * 2, y: this.height - 120, width: itemSize, height: itemSize },
            { type: 'ultimate2', x: startX + (itemSize + spacing) * 3, y: this.height - 120, width: itemSize, height: itemSize }
        ];
        
        // 游戏对象
        this.bullets = [];
        this.monsters = [];
        this.explosions = [];
        this.powerUps = []; // 掉落的增强道具
        this.particles = []; // 粒子系统
        // 震屏效果已移除
        
        // 连击系统
        this.combo = {
            count: 0,
            multiplier: 1,
            timer: 0,
            maxTimer: 180, // 3秒连击时间窗口
            lastKillTime: 0
        };
        
        // 音效系统
        this.audioEnabled = true;
        this.audioContext = null;
        this.sounds = {};
        this.initAudioSystem();
        
        // 图片资源系统
        this.images = {};
        this.imagesLoaded = false;
        this.loadImages();
        
        // 能量系统
        this.energy = 0;
        this.maxEnergy = 5; // 需要5个能量使用终极道具
        
        // 终极道具系统
        this.ultimateSkills = {
            ultimate1: {
                name: '核弹轰炸',
                icon: '☢️',
                description: '清除屏幕上所有怪物',
                color: '#FF4500'
            },
            ultimate2: {
                name: '时间冻结',
                icon: '❄️',
                description: '冻结所有怪物10秒',
                color: '#00BFFF'
            }
        };
        
        // 增强效果系统
        this.activeEffects = {
            doubleShot: { active: false, duration: 0 }, // 双发子弹
            rapidFire: { active: false, duration: 0 },  // 快速射击
            shield: { active: false, duration: 0 },     // 护盾保护
            healthRegen: { active: false, duration: 0 }, // 生命恢复
            explosiveAmmo: { active: false, duration: 0 }, // 爆炸子弹
            timeSlowdown: { active: false, duration: 0 },   // 时间慢放
            timeFreeze: { active: false, duration: 0 }     // 时间冻结
        };
        
        // 触摸事件
        this.draggedItem = null;
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // 首页升级系统 - 从本地存储加载或使用默认值
        this.loadPlayerData();
        
        // 经验值系统
        this.experience = 0;
        this.experienceToNext = 100; // 升级所需经验
        this.experienceGainModifier = 1.0; // 经验获得倍率
        
        this.upgradeCosts = {
            pistol: 100,
            rifle: 200,
            grenade: 300
        };
        
        // 自动瞄准系统
        this.currentTarget = null; // 当前瞄准的怪物
        this.isAutoFiring = false; // 是否正在自动射击
        this.lastFireTime = 0; // 上次射击时间
        
        // 移除重复定义，避免将当前目标置为数字0
        
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
    
    // 本地存储功能
    loadPlayerData() {
        try {
            // 尝试从本地存储读取数据
            const savedData = tt.getStorageSync('gunsGamePlayerData');
            if (savedData) {
                console.log('加载玩家数据:', savedData);
                this.playerLevel = savedData.playerLevel || 1;
                this.coins = savedData.coins || 0;
                this.experience = savedData.experience || 0;
                this.experienceToNext = savedData.experienceToNext || this.calculateExpToNext(this.playerLevel);
                this.weaponLevels = savedData.weaponLevels || {
                    pistol: 1,
                    rifle: 1,
                    grenade: 1
                };
                
                // 更新武器伤害基于等级
                this.updateWeaponStats();
            } else {
                // 首次游戏，使用默认值
                this.playerLevel = 1;
                this.coins = 0;
                this.experience = 0;
                this.experienceToNext = this.calculateExpToNext(1);
                this.weaponLevels = {
                    pistol: 1,
                    rifle: 1,
                    grenade: 1
                };
                console.log('首次游戏，使用默认数据');
            }
        } catch (error) {
            console.error('加载玩家数据失败:', error);
            // 出错时使用默认值
            this.playerLevel = 1;
            this.coins = 0;
            this.experience = 0;
            this.experienceToNext = this.calculateExpToNext(1);
            this.weaponLevels = {
                pistol: 1,
                rifle: 1,
                grenade: 1
            };
        }
    }
    
    savePlayerData() {
        try {
            const dataToSave = {
                playerLevel: this.playerLevel,
                coins: this.coins,
                experience: this.experience,
                experienceToNext: this.experienceToNext,
                weaponLevels: this.weaponLevels,
                lastSaved: Date.now()
            };
            
            tt.setStorageSync('gunsGamePlayerData', dataToSave);
            console.log('玩家数据已保存:', dataToSave);
        } catch (error) {
            console.error('保存玩家数据失败:', error);
        }
    }
    
    // 根据武器等级更新武器属性
    updateWeaponStats() {
        const baseDamage = {
            pistol: 20,
            rifle: 35,
            grenade: 80
        };
        
        for (let weaponType in this.weaponLevels) {
            if (this.weapons[weaponType]) {
                const level = this.weaponLevels[weaponType];
                this.weapons[weaponType].damage = baseDamage[weaponType] + (level - 1) * 10;
            }
        }
        
        console.log('武器属性已更新:', this.weapons);
    }
    
    // 计算升级所需经验值
    calculateExpToNext(level) {
        // 经验需求递增公式：100 * level * 1.2^(level-1)
        return Math.floor(100 * level * Math.pow(1.2, level - 1));
    }
    
    // 获得经验值
    gainExperience(amount) {
        if (amount <= 0) return;
        
        const adjustedAmount = Math.floor(amount * this.experienceGainModifier);
        this.experience += adjustedAmount;
        
        console.log(`获得经验: ${adjustedAmount} (当前: ${this.experience}/${this.experienceToNext})`);
        
        // 检查是否升级
        this.checkLevelUp();
        
        // 显示经验获得通知
        this.showExperienceNotification(adjustedAmount);
    }
    
    // 检查升级
    checkLevelUp() {
        while (this.experience >= this.experienceToNext) {
            this.experience -= this.experienceToNext;
            this.playerLevel++;
            
            // 重新计算下一级所需经验
            this.experienceToNext = this.calculateExpToNext(this.playerLevel);
            
            // 升级奖励
            this.handleLevelUp();
            
            console.log(`升级！当前等级: ${this.playerLevel}`);
        }
    }
    
    // 处理升级奖励
    handleLevelUp() {
        // 升级奖励金币
        const coinReward = this.playerLevel * 50;
        this.coins += coinReward;
        
        // 升级奖励生命值
        this.player.health = Math.min(100, this.player.health + 20);
        
        // 特殊等级奖励
        if (this.playerLevel % 5 === 0) {
            // 每5级增加一点能量上限
            this.maxEnergy = Math.min(10, this.maxEnergy + 1);
            console.log(`能量上限提升！新上限: ${this.maxEnergy}`);
        }
        
        if (this.playerLevel % 10 === 0) {
            // 每10级提升经验获得倍率
            this.experienceGainModifier += 0.1;
            console.log(`经验倍率提升！新倍率: ${this.experienceGainModifier.toFixed(1)}x`);
        }
        
        // 显示升级通知
        this.showLevelUpNotification();
        
        // 播放升级音效
        this.playSound('powerup');
        
        // 升级特效
        this.createParticles(this.player.x + this.player.width / 2, 
                            this.player.y + this.player.height / 2, 
                            30, '#FFD700', 'powerup');
    }
    
    // 显示经验获得通知
    showExperienceNotification(amount) {
        if (!this.notifications) {
            this.notifications = [];
        }
        
        this.notifications.push({
            text: `+${amount} EXP`,
            x: this.width / 2 + Math.random() * 100 - 50,
            y: this.height / 2 + Math.random() * 100 - 50,
            life: 90,
            color: '#00FF88',
            size: 14
        });
    }
    
    // 显示升级通知
    showLevelUpNotification() {
        if (!this.notifications) {
            this.notifications = [];
        }
        
        this.notifications.push({
            text: `等级提升！Lv.${this.playerLevel}`,
            x: this.width / 2,
            y: this.height / 2 - 50,
            life: 180,
            color: '#FFD700',
            size: 24
        });
        
        this.notifications.push({
            text: `获得 ${this.playerLevel * 50} 金币！`,
            x: this.width / 2,
            y: this.height / 2 - 20,
            life: 150,
            color: '#F39C12',
            size: 16
        });
    }
    
    // 图片加载系统
    loadImages() {
        const imageList = {
            // 玩家图片
            'player': 'assets/images/player.png',
            
            // 怪物图片
            'monster_basic': 'assets/images/monsters/basic_monster.png',
            'monster_boss': 'assets/images/monsters/boss_monster.png',
            'monster_tank': 'assets/images/monsters/tank_monster.png',
            'monster_fast': 'assets/images/monsters/fast_monster.png',
            'monster_flying': 'assets/images/monsters/flying_monster.png',
            'monster_shielded': 'assets/images/monsters/shielded_monster.png',
            
            // 武器图片
            'weapon_pistol': 'assets/images/weapons/pistol.png',
            'weapon_rifle': 'assets/images/weapons/rifle.png',
            'weapon_grenade': 'assets/images/weapons/grenade.png',
            'weapon_nuclear': 'assets/images/weapons/nuclear_bomb.png',
            'weapon_timefreeze': 'assets/images/weapons/time_freeze.png',
            
            // 特效图片
            'effect_explosion': 'assets/images/effects/explosion.png',
            'effect_bullet': 'assets/images/effects/bullet.png',
            'effect_particle': 'assets/images/effects/particle.png',
            
            // 增强道具图片
            'powerup_doubleshot': 'assets/images/powerups/double_shot.png',
            'powerup_rapidfire': 'assets/images/powerups/rapid_fire.png',
            'powerup_shield': 'assets/images/powerups/shield.png',
            'powerup_healthregen': 'assets/images/powerups/health_regen.png',
            
            // UI图片
            'ui_coin': 'assets/images/ui/coin.png',
            'ui_healthbar': 'assets/images/ui/health_bar.png',
            'ui_button': 'assets/images/ui/button.png'
        };
        
        let loadedCount = 0;
        const totalCount = Object.keys(imageList).length;
        
        // 预加载所有图片
        for (let key in imageList) {
            this.images[key] = tt.createImage();
            this.images[key].onload = () => {
                loadedCount++;
                console.log(`图片加载进度: ${loadedCount}/${totalCount} - ${key}`);
                
                if (loadedCount === totalCount) {
                    this.imagesLoaded = true;
                    console.log('所有图片加载完成！');
                }
            };
            
            this.images[key].onerror = () => {
                loadedCount++;
                console.warn(`图片加载失败: ${imageList[key]}`);
                
                if (loadedCount === totalCount) {
                    this.imagesLoaded = true;
                    console.log('图片加载完成（部分失败）！');
                }
            };
            
            this.images[key].src = imageList[key];
        }
    }
    
    // 绘制图片的辅助方法
    drawImage(imageKey, x, y, width, height, rotation = 0) {
        if (!this.imagesLoaded || !this.images[imageKey]) {
            // 如果图片未加载，绘制占位符
            this.ctx.fillStyle = '#CCCCCC';
            this.ctx.fillRect(x, y, width, height);
            this.ctx.fillStyle = '#666666';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('?', x + width/2, y + height/2 + 4);
            return;
        }
        
        this.ctx.save();
        
        if (rotation !== 0) {
            this.ctx.translate(x + width/2, y + height/2);
            this.ctx.rotate(rotation);
            this.ctx.drawImage(this.images[imageKey], -width/2, -height/2, width, height);
        } else {
            this.ctx.drawImage(this.images[imageKey], x, y, width, height);
        }
        
        this.ctx.restore();
    }
    
    init() {
        // 设置触摸事件
        tt.onTouchStart(this.onTouchStart.bind(this));
        tt.onTouchMove(this.onTouchMove.bind(this));
        tt.onTouchEnd(this.onTouchEnd.bind(this));
        
        // 游戏从home状态开始，显示开始页面
        this.gameState = 'home';
        
        // 开始游戏循环
        this.gameLoop();
        
        console.log('游戏已启动，状态:', this.gameState);
    }
    
    // 生成移动的怪物
    spawnFixedMonsters() {
        this.monsterPositions.forEach((pos, index) => {
            // 第一波都是普通怪物
            const monster = this.createMonster(pos.x, pos.y, 'normal');
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
            
            // 随机生成不同类型的怪物
            const monsterTypes = ['normal', 'fast', 'tank', 'flying', 'shielded'];
            let monsterType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
            
            // Boss怪物在第5波及以后每5波出现一次
            if (this.waveNumber >= 5 && this.waveNumber % 5 === 0 && i === 0) {
                monsterType = 'boss';
            }
            
            const monster = this.createMonster(x, y, monsterType);
            this.monsters.push(monster);
        }
        
        this.waveNumber++;
        this.lastWaveTime = Date.now();
        this.selectNextTarget();
        
        // 每5波自动保存一次数据
        if (this.waveNumber % 5 === 0) {
            this.savePlayerData();
            console.log(`第${this.waveNumber}波完成，数据已保存`);
        }
        
        console.log(`第${this.waveNumber}波怪物生成完成`);
    }
    
    // 创建不同类型的怪物
    createMonster(x, y, type) {
        const baseHealth = 50 + this.waveNumber * 10;
        const baseSpeed = 1 + this.waveNumber * 0.05;
        
        let monster = {
            x: x,
            y: y,
            width: 40,
            height: 40,
            speed: baseSpeed,
            health: baseHealth,
            maxHealth: baseHealth,
            isAlive: true,
            type: type,
            specialAbilities: {}
        };
        
        switch (type) {
            case 'normal':
                monster.color = '#9B59B6';
                monster.icon = '👹';
                break;
                
            case 'fast':
                monster.speed = baseSpeed * 2;
                monster.health = baseHealth * 0.6;
                monster.maxHealth = monster.health;
                monster.color = '#E74C3C';
                monster.icon = '⚡';
                break;
                
            case 'tank':
                monster.speed = baseSpeed * 0.5;
                monster.health = baseHealth * 2.5;
                monster.maxHealth = monster.health;
                monster.width = 50;
                monster.height = 50;
                monster.color = '#34495E';
                monster.icon = '🛡️';
                break;
                
            case 'flying':
                monster.speed = baseSpeed * 1.5;
                monster.health = baseHealth * 0.8;
                monster.maxHealth = monster.health;
                monster.color = '#3498DB';
                monster.icon = '🦅';
                monster.specialAbilities.flying = true;
                monster.flyPattern = Math.random() * Math.PI * 2; // 飞行模式
                break;
                
            case 'shielded':
                monster.health = baseHealth * 1.2;
                monster.maxHealth = monster.health;
                monster.color = '#F39C12';
                monster.icon = '🛡️';
                monster.specialAbilities.shield = 3; // 需要3次攻击破盾
                monster.shieldActive = true;
                break;
                
            case 'boss':
                monster.speed = baseSpeed * 0.7;
                monster.health = baseHealth * 5;
                monster.maxHealth = monster.health;
                monster.width = 80;
                monster.height = 80;
                monster.color = '#8E44AD';
                monster.icon = '👑';
                monster.specialAbilities.boss = true;
                monster.lastAttackTime = 0;
                monster.attackCooldown = 3000; // 3秒攻击间隔
                break;
                
            default:
                monster.color = '#9B59B6';
                monster.icon = '👹';
        }
        
        return monster;
    }
    
    // 选择下一个目标 - 优先选择最近的怪物
    selectNextTarget() {
        const aliveMonsters = this.monsters.filter(m => m.isAlive);
        if (aliveMonsters.length > 0) {
            // 计算到角色的距离，选择最近的怪物
            let nearestMonster = aliveMonsters[0];
            let nearestDistance = this.getDistance(this.player, nearestMonster);
            
            for (let monster of aliveMonsters) {
                const distance = this.getDistance(this.player, monster);
                if (distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestMonster = monster;
                }
            }
            
            this.currentTarget = nearestMonster;
            console.log('自动选择最近目标');
        } else {
            this.currentTarget = null;
        }
    }
    
    // 计算两个对象之间的距离
    getDistance(obj1, obj2) {
        const dx = (obj1.x + obj1.width / 2) - (obj2.x + obj2.width / 2);
        const dy = (obj1.y + obj1.height / 2) - (obj2.y + obj2.height / 2);
        return Math.sqrt(dx * dx + dy * dy);
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
        // 计算与绘制完全一致的布局参数
        const titleHeight = 90;
        const playerInfoHeight = 120;
        const weaponAreaHeight = 230;
        const buttonHeight = 65;
        const spacing = 25;
        
        const totalContentHeight = titleHeight + playerInfoHeight + weaponAreaHeight + buttonHeight + spacing * 3;
        const startY = (this.height - totalContentHeight) / 2;
        const playerInfoY = startY + titleHeight + spacing;
        const weaponAreaY = playerInfoY + playerInfoHeight + spacing;
        const startButtonY = weaponAreaY + weaponAreaHeight + spacing;
        
        // 开始游戏按钮（与绘制位置完全对应）
        const startButton = {
            x: this.width / 2 - 110,
            y: startButtonY,
            width: 220,
            height: buttonHeight
        };
        
        if (this.isPointInRect(touch.clientX, touch.clientY, startButton)) {
            this.playSound('button');
            this.startGame();
            return;
        }
        
        // 升级按钮（与绘制位置完全对应）
        const weapons = ['pistol', 'rifle', 'grenade'];
        const upgradeButtons = [];
        
        for (let i = 0; i < weapons.length; i++) {
            const weaponCardY = weaponAreaY + 50 + i * 55;
            upgradeButtons.push({
                type: weapons[i],
                x: this.width / 2 + 25,
                y: weaponCardY + 5,
                width: 75,
                height: 40
            });
        }
        
        for (let button of upgradeButtons) {
            if (this.isPointInRect(touch.clientX, touch.clientY, button)) {
                this.playSound('button');
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
                if (item.type === 'ultimate1' || item.type === 'ultimate2') {
                    // 终极道具
                    if (this.energy >= this.maxEnergy) {
                        this.useUltimateSkill(item.type);
                    } else {
                        console.log(`能量不足！需要 ${this.maxEnergy} 能量，当前 ${this.energy}`);
                    }
                } else {
                    // 普通武器
                this.player.currentWeapon = item.type;
                console.log('道具使用成功:', this.weapons[item.type].name);
                console.log('角色当前武器:', this.player.currentWeapon);
                
                this.startAutoFire(); // 开始自动射击
                }
                return;
            }
        }
        
        // 检查是否点击增强道具
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.isPointInRect(touch.clientX, touch.clientY, powerUp)) {
                this.applyPowerUp(powerUp);
                this.powerUps.splice(i, 1);
                return;
            }
        }
        
        // 检查是否点击怪物
        for (let monster of this.monsters) {
            if (monster.isAlive && this.isPointInRect(touch.clientX, touch.clientY, monster)) {
                // 切换目标到用户点击的怪物
                this.currentTarget = monster;
                console.log('用户选择目标:', monster.type);
                
                // 如果没有在射击，开始射击
                if (!this.isAutoFiring && this.player.currentWeapon) {
                    this.startAutoFire();
                }
                return;
            }
        }
        
        // 如果点击空白位置，切换目标
        if (!this.isPointInRect(touch.clientX, touch.clientY, this.player)) {
            this.switchTarget();
            this.playSound('button'); // 添加切换目标音效
        }
    }
    
    // 处理游戏结束触摸
    handleGameOverTouch(touch) {
        const returnButton = {
            x: this.width / 2 - 80,
            y: this.height / 2 + 50,
            width: 160,
            height: 50
        };
        
        if (this.isPointInRect(touch.clientX, touch.clientY, returnButton)) {
            this.playSound('button');
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
        // 如果没有目标，先选择一个
        if (!this.currentTarget) {
            this.selectNextTarget();
        }
        
        this.isAutoFiring = true;
        this.player.isUsingWeapon = true;
        this.player.canMove = false;
        console.log('开始自动射击:', this.weapons[this.player.currentWeapon].name);
        console.log('当前目标:', this.currentTarget ? this.currentTarget.type : '无目标');
    }
    
    // 点击怪物射击
    shootAtMonster(monster) {
        if (!this.player.currentWeapon) {
            console.log('没有装备武器');
            return;
        }
        
        const weapon = this.weapons[this.player.currentWeapon];
        
        // 发射子弹瞄准怪物
        const bullet = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y - 30,
            width: 4,
            height: 8,
            speed: 8,
            damage: weapon.damage,
            targetMonster: monster,
            weaponType: this.player.currentWeapon,
            color: weapon.bulletColor
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
        this.playSound('shoot');
        console.log('点击射击');
    }
    
    // 开始游戏
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.player.health = 100;
        this.energy = 0; // 重置能量
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
        
        // 保存玩家数据
        this.savePlayerData();
        
        console.log('返回首页并保存数据');
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
            // 移除弹药相关属性，因为现在是无限子弹
            
            // 提升升级成本
            this.upgradeCosts[weaponType] = Math.floor(cost * 1.5);
            
            // 立即保存数据
            this.savePlayerData();
            
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
        this.energy = 0; // 重置能量
        
        // 无限子弹，移除重置武器子弹逻辑
        
        // 重置补充时间
        this.lastReloadTime = 0;
        
        // 生成第一波怪物
        this.spawnFixedMonsters();
    }
    
    // 切换目标 - 循环切换到下一个怪物
    switchTarget() {
        const aliveMonsters = this.monsters.filter(m => m.isAlive);
        if (aliveMonsters.length > 0) {
            // 找到当前目标的下一个
            if (this.currentTarget && aliveMonsters.includes(this.currentTarget)) {
                const currentIndex = aliveMonsters.indexOf(this.currentTarget);
                const nextIndex = (currentIndex + 1) % aliveMonsters.length;
                this.currentTarget = aliveMonsters[nextIndex];
                console.log('手动切换到目标:', this.currentTarget.type);
            } else {
                // 如果当前目标不存在，选择最近的
                this.selectNextTarget();
            }
            
            // 如果有武器但没在射击，开始射击
            if (this.player.currentWeapon && !this.isAutoFiring) {
                this.startAutoFire();
            }
        }
    }
    
    // 自动射击逻辑
    autoFire() {
        // 如果没有武器，不射击
        if (!this.player.currentWeapon) {
            return;
        }
        
        // 检查是否有活着的怪物
        const aliveMonsters = this.monsters.filter(m => m.isAlive);
        if (aliveMonsters.length === 0) {
            // 没有怪物时停止射击
            this.isAutoFiring = false;
            return;
        }
        
        // 如果有怪物但没有在射击，开始射击
        if (!this.isAutoFiring) {
            this.isAutoFiring = true;
        }
        
        // 如果没有目标或目标已死，选择新目标
        if (!this.currentTarget || !this.currentTarget.isAlive) {
            this.selectNextTarget();
            if (!this.currentTarget) {
                return;
            }
        }
        
        const weapon = this.weapons[this.player.currentWeapon];
        const now = Date.now();
        
        // 检查射击间隔
        if (now - this.lastFireTime < weapon.cooldown) {
            return;
        }
        
        // 发射子弹
        this.fireBullet();
        this.playSound('shoot');
        this.lastFireTime = now;
    }
    
    // 发射子弹
    fireBullet() {
        const weapon = this.weapons[this.player.currentWeapon];
        
        if (this.player.currentWeapon === 'grenade') {
            // 手雷直接爆炸
            this.createExplosion(this.currentTarget.x, this.currentTarget.y);
            this.damageMonstersInRange(this.currentTarget.x, this.currentTarget.y, weapon.range, weapon.damage);
        } else {
            // 创建子弹函数
            const createBullet = (offsetX = 0, offsetY = 0) => {
            const bullet = {
                    x: this.player.x + this.player.width / 2 + offsetX,
                    y: this.player.y - 30 + offsetY,
                width: 4,
                height: 8,
                speed: 8,
                    damage: weapon.damage,
                    isExplosive: this.activeEffects.explosiveAmmo.active,
                    weaponType: this.player.currentWeapon,
                    color: weapon.bulletColor
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
            
                return bullet;
            };
            
            // 发射主子弹
            this.bullets.push(createBullet());
            
            // 如果有双发效果，发射第二颗子弹
            if (this.activeEffects.doubleShot.active) {
                this.bullets.push(createBullet(-15, 0)); // 左侧偏移
                this.bullets.push(createBullet(15, 0));  // 右侧偏移
            }
        }
        
        // 无限子弹，移除子弹数量减少
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
        
        // 创建爆炸粒子
        this.createParticles(x, y, 15, '#FF6B6B', 'explosion');
        
        // 震屏效果已移除，只在核弹轰炸时震动
        
        // 播放爆炸音效
        this.playSound('explosion');
        
        // 添加命中音效
        this.playSound('hit');
    }
    
    // 创建粒子效果
    createParticles(x, y, count, color, type = 'default') {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 4;
            
            const particle = {
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 60,
                maxLife: 60,
                size: 2 + Math.random() * 3,
                color: color,
                type: type,
                alpha: 1
            };
            
            // 不同类型的粒子有不同的行为
            switch (type) {
                case 'explosion':
                    particle.gravity = 0.1;
                    particle.friction = 0.95;
                    break;
                case 'hit':
                    particle.life = 30;
                    particle.maxLife = 30;
                    particle.size = 1 + Math.random() * 2;
                    particle.gravity = 0.05;
                    break;
                case 'powerup':
                    particle.life = 90;
                    particle.maxLife = 90;
                    particle.floatPattern = Math.random() * Math.PI * 2;
                    break;
                default:
                    particle.gravity = 0.05;
                    particle.friction = 0.98;
            }
            
            this.particles.push(particle);
        }
    }
    
    // 震屏效果已移除
    
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
        
        // 根据怪物类型给予不同分数和经验值
        let scoreBonus = 100;
        let expBonus = 10;
        if (monster.type === 'boss') {
            scoreBonus = 500;
            expBonus = 50;
        } else if (monster.type === 'tank') {
            scoreBonus = 200;
            expBonus = 20;
        } else if (monster.type === 'fast') {
            scoreBonus = 150;
            expBonus = 15;
        } else if (monster.type === 'flying') {
            scoreBonus = 180;
            expBonus = 18;
        } else if (monster.type === 'shielded') {
            scoreBonus = 160;
            expBonus = 16;
        }
        
        // 更新连击系统
        const now = Date.now();
        if (now - this.combo.lastKillTime < 3000) { // 3秒内连击
            this.combo.count++;
            this.combo.timer = this.combo.maxTimer;
        } else {
            this.combo.count = 1; // 重置连击
            this.combo.timer = this.combo.maxTimer;
        }
        this.combo.lastKillTime = now;
        
        // 计算连击倍数
        if (this.combo.count >= 20) this.combo.multiplier = 5;
        else if (this.combo.count >= 15) this.combo.multiplier = 4;
        else if (this.combo.count >= 10) this.combo.multiplier = 3;
        else if (this.combo.count >= 5) this.combo.multiplier = 2;
        else this.combo.multiplier = 1;
        
        // 应用连击倍数
        const finalScore = Math.floor(scoreBonus * this.combo.multiplier);
        const finalCoins = Math.floor((Math.floor(Math.random() * 5) + 1) * this.combo.multiplier);
        const finalExp = Math.floor(expBonus * this.combo.multiplier);
        
        this.score += finalScore;
        this.coins += finalCoins;
        
        // 获得经验值
        this.gainExperience(finalExp);
        
        // 增加能量
        if (this.energy < this.maxEnergy) {
            this.energy++;
            console.log(`获得能量！当前能量: ${this.energy}/${this.maxEnergy}`);
            
            // 能量满时的特效
            if (this.energy >= this.maxEnergy) {
                this.createParticles(this.width / 2, 100, 20, '#FFD700', 'powerup');
                console.log('终极道具已充能完成！');
                
                // 播放能量满音效
                if (this.energy === this.maxEnergy) { // 只在刚满时播放
                    this.playSound('powerup');
                }
            }
        }
        
        // 显示连击奖励
        if (this.combo.count > 1) {
            this.showComboNotification(this.combo.count, this.combo.multiplier, finalScore);
        }
        
        // 创建击杀粒子效果
        this.createParticles(monster.x + monster.width / 2, 
                           monster.y + monster.height / 2, 
                           8, monster.color, 'hit');
        
        // 播放击中音效
        this.playSound('hit');
        
        // Boss死亡特殊效果
        if (monster.type === 'boss') {
            this.createParticles(monster.x + monster.width / 2, 
                               monster.y + monster.height / 2, 
                               25, '#FFD700', 'explosion');
            // Boss死亡震屏已移除
        }
        
        // 根据怪物类型调整道具掉落概率
        let dropChance = 0.2;
        if (monster.type === 'boss') dropChance = 0.8;
        else if (monster.type === 'tank') dropChance = 0.4;
        
        if (Math.random() < dropChance) {
            this.spawnPowerUp(monster.x, monster.y);
        }
        
        // 如果当前目标死亡，自动切换目标
        if (this.currentTarget === monster) {
            this.selectNextTarget();
            console.log('目标死亡，自动选择新目标');
            // 不停止射击，让autoFire函数自动处理
        }
        
        // 播放击杀音效
        this.playSound('hit');
    }
    
    // 生成增强道具
    spawnPowerUp(x, y) {
        const powerUpTypes = [
            { type: 'doubleShot', name: '双发', icon: '⚡', color: '#FFD700', duration: 10000 },
            { type: 'rapidFire', name: '急速', icon: '🔥', color: '#FF4500', duration: 8000 },
            { type: 'shield', name: '护盾', icon: '🛡️', color: '#4169E1', duration: 15000 },
            { type: 'healthRegen', name: '治疗', icon: '💊', color: '#32CD32', duration: 0 },
            { type: 'explosiveAmmo', name: '爆弹', icon: '💥', color: '#DC143C', duration: 12000 },
            { type: 'timeSlowdown', name: '慢放', icon: '⏰', color: '#9370DB', duration: 6000 }
        ];
        
        const powerUpType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
        
        const powerUp = {
            x: x,
            y: y,
            width: 30,
            height: 30,
            type: powerUpType.type,
            name: powerUpType.name,
            icon: powerUpType.icon,
            color: powerUpType.color,
            duration: powerUpType.duration,
            lifeTime: 300, // 5秒后消失
            pulse: 0 // 用于脉冲动画
        };
        
        this.powerUps.push(powerUp);
        console.log(`掉落增强道具: ${powerUp.name}`);
    }
    
    // 应用增强效果
    applyPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'doubleShot':
                this.activeEffects.doubleShot.active = true;
                this.activeEffects.doubleShot.duration = powerUp.duration;
                console.log('激活双发射击！');
                break;
                
            case 'rapidFire':
                this.activeEffects.rapidFire.active = true;
                this.activeEffects.rapidFire.duration = powerUp.duration;
                // 临时减少所有武器冷却时间
                Object.values(this.weapons).forEach(weapon => {
                    weapon.originalCooldown = weapon.originalCooldown || weapon.cooldown;
                    weapon.cooldown = weapon.originalCooldown * 0.3;
                });
                console.log('激活急速射击！');
                break;
                
            case 'shield':
                this.activeEffects.shield.active = true;
                this.activeEffects.shield.duration = powerUp.duration;
                console.log('激活护盾保护！');
                break;
                
            case 'healthRegen':
                this.player.health = Math.min(100, this.player.health + 30);
                console.log('生命值恢复！');
                break;
                
            case 'explosiveAmmo':
                this.activeEffects.explosiveAmmo.active = true;
                this.activeEffects.explosiveAmmo.duration = powerUp.duration;
                console.log('激活爆炸子弹！');
                break;
                
            case 'timeSlowdown':
                this.activeEffects.timeSlowdown.active = true;
                this.activeEffects.timeSlowdown.duration = powerUp.duration;
                console.log('激活时间慢放！');
                break;
        }
        
        // 显示获得道具的提示
        this.showPowerUpNotification(powerUp);
        
        // 播放道具音效
        this.playSound('powerup');
    }
    
    // 显示连击通知
    showComboNotification(comboCount, multiplier, score) {
        if (!this.notifications) {
            this.notifications = [];
        }
        
        let comboText = '';
        let comboColor = '#FFD700';
        
        if (comboCount >= 20) {
            comboText = `🔥 LEGENDARY ${comboCount}x COMBO! 🔥`;
            comboColor = '#FF1493';
        } else if (comboCount >= 15) {
            comboText = `⚡ EPIC ${comboCount}x COMBO! ⚡`;
            comboColor = '#9370DB';
        } else if (comboCount >= 10) {
            comboText = `💥 MEGA ${comboCount}x COMBO! 💥`;
            comboColor = '#FF4500';
        } else if (comboCount >= 5) {
            comboText = `🎯 SUPER ${comboCount}x COMBO! 🎯`;
            comboColor = '#32CD32';
        } else {
            comboText = `${comboCount}x COMBO!`;
            comboColor = '#FFD700';
        }
        
        this.notifications.push({
            text: comboText,
            x: this.width / 2,
            y: 200,
            life: 90,
            alpha: 1,
            color: comboColor,
            size: 20 + Math.min(comboCount, 10) // 连击越高字体越大
        });
        
        // 显示分数奖励
        this.notifications.push({
            text: `+${score} 分数！`,
            x: this.width / 2,
            y: 230,
            life: 60,
            alpha: 1,
            color: '#FFFFFF',
            size: 16
        });
        
        // 播放连击音效
        this.playSound('combo');
    }
    
    // 使用终极道具
    useUltimateSkill(skillType) {
        if (this.energy < this.maxEnergy) return;
        
        const skill = this.ultimateSkills[skillType];
        console.log(`使用终极道具: ${skill.name}`);
        
        // 消耗能量
        this.energy = 0;
        
        switch (skillType) {
            case 'ultimate1':
                // 核弹轰炸 - 清除所有怪物
                this.nuclearStrike();
                break;
                
            case 'ultimate2':
                // 时间冻结 - 冻结所有怪物
                this.timeFreeze();
                break;
        }
        
        // 播放终极道具音效
        this.playSound('explosion');
        
        // 显示使用通知
        this.showUltimateNotification(skill);
        
        // 播放终极技能音效
        this.playSound('powerup');
    }
    
    // 核弹轰炸
    nuclearStrike() {
        // 先收集所有活着的怪物
        const aliveMonsters = this.monsters.filter(m => m.isAlive);
        
        // 为每个怪物创建爆炸效果
        for (let monster of aliveMonsters) {
            this.createExplosion(monster.x + monster.width / 2, monster.y + monster.height / 2);
            this.createParticles(monster.x + monster.width / 2, monster.y + monster.height / 2, 15, '#FF4500', 'explosion');
            
            // 直接设置为死亡，不调用killMonster避免能量增加
            monster.isAlive = false;
            
            // 手动计算分数和金币
            let scoreBonus = 100;
            if (monster.type === 'boss') scoreBonus = 500;
            else if (monster.type === 'tank') scoreBonus = 200;
            else if (monster.type === 'fast') scoreBonus = 150;
            else if (monster.type === 'flying') scoreBonus = 180;
            else if (monster.type === 'shielded') scoreBonus = 160;
            
            this.score += scoreBonus;
            this.coins += Math.floor(Math.random() * 5) + 1;
        }
        
        // 核弹震屏效果 - 保持震撼效果
        // 震屏效果已移除
        
        console.log('核弹轰炸！所有怪物被消灭！');
    }
    
    // 时间冻结
    timeFreeze() {
        this.activeEffects.timeFreeze.active = true;
        this.activeEffects.timeFreeze.duration = 600; // 10秒
        
        // 创建冻结特效
        this.createParticles(this.width / 2, this.height / 2, 30, '#00BFFF', 'powerup');
        
        console.log('时间冻结！所有怪物被冻结10秒！');
    }
    
    // 显示终极道具使用通知
    showUltimateNotification(skill) {
        if (!this.notifications) {
            this.notifications = [];
        }
        
        this.notifications.push({
            text: `${skill.icon} ${skill.name}！`,
            x: this.width / 2,
            y: 120,
            life: 150, // 2.5秒
            alpha: 1,
            color: skill.color,
            size: 28 // 大字体
        });
    }
    
    // 显示道具获得通知
    showPowerUpNotification(powerUp) {
        // 创建通知对象
        if (!this.notifications) {
            this.notifications = [];
        }
        
        this.notifications.push({
            text: `获得 ${powerUp.icon} ${powerUp.name}！`,
            x: this.width / 2,
            y: 150,
            life: 120, // 2秒
            alpha: 1,
            color: powerUp.color
        });
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
        
        // 时间效果
        let timeMultiplier = 1.0;
        if (this.activeEffects.timeFreeze.active) {
            timeMultiplier = 0.0; // 完全冻结
        } else if (this.activeEffects.timeSlowdown.active) {
            timeMultiplier = 0.3; // 慢放
        }
        
        // 角色不自动向上移动，保持在固定Y位置
        
        // 自动射击逻辑 - 只要有武器就尝试射击
        if (this.player.currentWeapon) {
            this.autoFire();
        }
        
        // 无限子弹，移除自动补充道具逻辑
        
        // 更新增强效果
        this.updatePowerUpEffects();
        
        // 更新增强道具
        this.updatePowerUps();
        
        // 更新通知
        this.updateNotifications();
        
        // 更新粒子系统
        this.updateParticles();
        
        // 震屏效果已移除
        
        // 更新连击系统
        this.updateComboSystem();
        
        // 生命恢复效果
        if (this.activeEffects.healthRegen.active) {
            this.player.health = Math.min(100, this.player.health + 0.1);
        }
        
        // 人物不移动，移除自动对准功能
        
        // 更新怪物位置 - 朝角色移动
        for (let monster of this.monsters) {
            if (!monster.isAlive) continue;
            
            // 根据怪物类型更新位置
            const distance = this.updateMonsterMovement(monster, timeMultiplier);
            
            // Boss怪物特殊攻击
            if (monster.type === 'boss') {
                this.updateBossAttack(monster);
            }
            
            // 检查怪物是否到达角色位置
            if (distance < 50) {
                // 如果有护盾，不受伤害
                if (!this.activeEffects.shield.active) {
                this.player.health -= 5; // 怪物接触角色造成5点伤害
                    console.log('怪物攻击角色，造成5点伤害，怪物消失');
                    
                    // 创建伤害粒子效果
                    this.createParticles(this.player.x + this.player.width / 2, 
                                       this.player.y + this.player.height / 2, 
                                       5, '#FF0000', 'hit');
                } else {
                    console.log('护盾保护！无伤害，怪物消失');
                }
                
                // 怪物攻击后立即消失
                monster.isAlive = false;
                
                // 检查游戏是否结束
                if (this.player.health <= 0) {
                    this.gameState = 'gameOver';
                    // 停止背景音乐并播放游戏结束音效
                    this.stopBackgroundMusic();
                    this.playSound('gameover');
                    // 游戏结束时保存数据
                    this.savePlayerData();
                    console.log('游戏结束，数据已保存');
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
            
            // 检查能量球与角色的碰撞
            if (bullet.isEnergyBall && this.checkCollision(bullet, this.player)) {
                // 如果有护盾，不受伤害
                if (!this.activeEffects.shield.active) {
                    this.player.health -= bullet.damage;
                    console.log('能量球击中角色！');
                } else {
                    console.log('护盾阻挡了能量球！');
                }
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 检查玩家子弹与敌方子弹的碰撞
            if (!bullet.isEnergyBall) {
                for (let j = this.bullets.length - 1; j >= 0; j--) {
                    if (j === i) continue; // 跳过自己
                    const otherBullet = this.bullets[j];
                    
                    // 玩家子弹与敌方能量球碰撞
                    if (otherBullet.isEnergyBall && this.checkCollision(bullet, otherBullet)) {
                        // 创建碰撞粒子效果
                        this.createParticles(bullet.x, bullet.y, 6, '#FFFF00', 'hit');
                        
                        // 移除两颗子弹
                        this.bullets.splice(Math.max(i, j), 1);
                        this.bullets.splice(Math.min(i, j), 1);
                        
                        console.log('子弹相撞！');
                        this.playSound('hit');
                        
                        // 调整索引
                        i = Math.min(i, j) - 1;
                        break;
                    }
                }
            }
            
            // 检查子弹与怪物的碰撞（只有玩家子弹）
            if (!bullet.isEnergyBall) {
            for (let j = this.monsters.length - 1; j >= 0; j--) {
                const monster = this.monsters[j];
                if (!monster.isAlive) continue;
                
                if (this.checkCollision(bullet, monster)) {
                        let damage = bullet.damage;
                        
                        // 处理护盾怪物
                        if (monster.shieldActive && monster.specialAbilities.shield > 0) {
                            monster.specialAbilities.shield--;
                            damage *= 0.2; // 护盾减少80%伤害
                            
                            if (monster.specialAbilities.shield <= 0) {
                                monster.shieldActive = false;
                                console.log('护盾被击破！');
                            }
                        }
                        
                        monster.health -= damage;
                        
                        // 如果是爆炸子弹，造成范围伤害
                        if (bullet.isExplosive) {
                            this.createExplosion(bullet.x, bullet.y);
                            this.damageMonstersInRange(bullet.x, bullet.y, 60, bullet.damage * 0.5);
                        }
                        
                    this.bullets.splice(i, 1);
                    
                    if (monster.health <= 0) {
                        this.killMonster(monster);
                    }
                    break;
                    }
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
            // 停止背景音乐并播放游戏结束音效
            this.stopBackgroundMusic();
            this.playSound('gameover');
            // 游戏结束时保存数据
            this.savePlayerData();
            console.log('游戏结束，数据已保存');
        }
        
        // 检查是否所有怪物都被消灭
        const aliveMonsters = this.monsters.filter(m => m.isAlive);
        if (aliveMonsters.length === 0) {
            // 生成新一波怪物
            this.spawnNewWave();
        }
    }
    
    // 更新增强效果
    updatePowerUpEffects() {
        for (let effect in this.activeEffects) {
            if (this.activeEffects[effect].active) {
                this.activeEffects[effect].duration -= 16; // 假设60FPS
                
                if (this.activeEffects[effect].duration <= 0) {
                    this.activeEffects[effect].active = false;
                    this.activeEffects[effect].duration = 0;
                    
                    // 移除效果
                    if (effect === 'rapidFire') {
                        // 恢复武器原始冷却时间
                        Object.values(this.weapons).forEach(weapon => {
                            if (weapon.originalCooldown) {
                                weapon.cooldown = weapon.originalCooldown;
                            }
                        });
                        console.log('急速射击效果结束');
                    } else if (effect === 'timeFreeze') {
                        console.log('时间冻结效果结束');
                    } else {
                        console.log(`${effect}效果结束`);
                    }
                }
            }
        }
    }
    
    // 更新增强道具
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            powerUp.lifeTime--;
            powerUp.pulse += 0.1;
            
            // 道具消失
            if (powerUp.lifeTime <= 0) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    // 更新通知
    updateNotifications() {
        if (!this.notifications) return;
        
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            notification.life--;
            notification.alpha = notification.life / 120;
            notification.y -= 1; // 向上浮动
            
            if (notification.life <= 0) {
                this.notifications.splice(i, 1);
            }
        }
    }
    
    // 更新怪物移动
    updateMonsterMovement(monster, timeMultiplier) {
        const dx = this.player.x + this.player.width / 2 - (monster.x + monster.width / 2);
        const dy = this.player.y + this.player.height / 2 - (monster.y + monster.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const actualSpeed = monster.speed * timeMultiplier;
            
            switch (monster.type) {
                case 'flying':
                    // 飞行怪物有波浪形移动模式
                    monster.flyPattern += 0.1;
                    const waveOffset = Math.sin(monster.flyPattern) * 20;
                    monster.x += (dx / distance) * actualSpeed + waveOffset * 0.1;
                    monster.y += (dy / distance) * actualSpeed;
                    break;
                    
                case 'tank':
                    // 坦克怪物直线移动，不受干扰
                    monster.x += (dx / distance) * actualSpeed;
                    monster.y += (dy / distance) * actualSpeed;
                    break;
                    
                case 'fast':
                    // 快速怪物有时会突然冲刺
                    if (Math.random() < 0.02) { // 2%概率冲刺
                        monster.x += (dx / distance) * actualSpeed * 3;
                        monster.y += (dy / distance) * actualSpeed * 3;
                    } else {
                        monster.x += (dx / distance) * actualSpeed;
                        monster.y += (dy / distance) * actualSpeed;
                    }
                    break;
                    
                case 'boss':
                    // Boss移动较慢但有特殊行为
                    monster.x += (dx / distance) * actualSpeed;
                    monster.y += (dy / distance) * actualSpeed;
                    break;
                    
                default:
                    // 普通怪物直接朝角色移动
                    monster.x += (dx / distance) * actualSpeed;
                    monster.y += (dy / distance) * actualSpeed;
            }
        }
        
        return distance;
    }
    
    // 更新Boss攻击
    updateBossAttack(monster) {
        const now = Date.now();
        if (now - monster.lastAttackTime > monster.attackCooldown) {
            // Boss发射能量球攻击
            this.createEnergyBall(monster.x + monster.width / 2, monster.y + monster.height / 2);
            monster.lastAttackTime = now;
            console.log('Boss发动能量球攻击！');
        }
    }
    
    // 创建能量球（Boss攻击）
    createEnergyBall(x, y) {
        const energyBall = {
            x: x,
            y: y,
            width: 15,
            height: 15,
            speed: 3,
            damage: 15,
            isEnergyBall: true
        };
        
        // 计算能量球朝角色的方向
        const dx = this.player.x + this.player.width / 2 - x;
        const dy = this.player.y + this.player.height / 2 - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            energyBall.vx = (dx / distance) * energyBall.speed;
            energyBall.vy = (dy / distance) * energyBall.speed;
        } else {
            energyBall.vx = 0;
            energyBall.vy = energyBall.speed;
        }
        
        this.bullets.push(energyBall); // 重用子弹数组
    }
    
    // 初始化音效系统
    initAudioSystem() {
        try {
            // 预加载音效文件
            this.audioFiles = {
                shoot: 'assets/sounds/shoot.mp3',
                hit: 'assets/sounds/monster_hit.mp3',
                explosion: 'assets/sounds/explosion.mp3',
                powerup: 'assets/sounds/coin_collect.mp3',
                button: 'assets/sounds/coin_collect.mp3', // 复用金币音效作为按钮音效
                combo: 'assets/sounds/coin_collect.mp3', // 复用金币音效作为连击音效
                gameover: 'assets/sounds/game_over.mp3',
                background: 'assets/music/background.mp3'
            };
            
            // 创建音频对象
            this.sounds = {};
            for (let soundType in this.audioFiles) {
                if (typeof tt !== 'undefined' && tt.createInnerAudioContext) {
                    // 使用抖音小游戏的音频API
                    this.sounds[soundType] = tt.createInnerAudioContext();
                    this.sounds[soundType].src = this.audioFiles[soundType];
                    this.sounds[soundType].volume = soundType === 'background' ? 0.3 : 0.8;
                    this.sounds[soundType].loop = soundType === 'background';
                    
                    // 监听加载完成
                    this.sounds[soundType].onCanplay(() => {
                        console.log(`音效加载完成: ${soundType}`);
                    });
                    
                    // 监听播放错误
                    this.sounds[soundType].onError((error) => {
                        console.warn(`音效加载失败 ${soundType}:`, error);
                    });
                } else {
                    // 浏览器环境使用标准HTML5 Audio
                    this.sounds[soundType] = new Audio(this.audioFiles[soundType]);
                    this.sounds[soundType].volume = soundType === 'background' ? 0.3 : 0.8;
                    this.sounds[soundType].loop = soundType === 'background';
                    
                    this.sounds[soundType].addEventListener('canplaythrough', () => {
                        console.log(`音效加载完成: ${soundType}`);
                    });
                    
                    this.sounds[soundType].addEventListener('error', (error) => {
                        console.warn(`音效加载失败 ${soundType}:`, error);
                    });
                }
            }
            
            // 启动背景音乐
            this.startBackgroundMusic();
            
            console.log('音效系统初始化成功');
        } catch (error) {
            console.warn('音效系统初始化失败:', error);
            this.audioEnabled = false;
        }
    }
    
    // 启动背景音乐
    startBackgroundMusic() {
        if (this.audioEnabled && this.sounds.background) {
            try {
                this.sounds.background.play();
                console.log('背景音乐开始播放');
            } catch (error) {
                console.warn('背景音乐播放失败:', error);
            }
        }
    }
    
    // 停止背景音乐
    stopBackgroundMusic() {
        if (this.sounds.background) {
            this.sounds.background.pause();
            if (this.sounds.background.currentTime) {
                this.sounds.background.currentTime = 0;
            }
        }
    }
    
    // 播放音效
    playSound(soundType) {
        if (!this.audioEnabled || !this.sounds[soundType]) {
            console.warn(`音效不可用: ${soundType}`);
            return;
        }
        
        try {
            // 播放音频文件
            const sound = this.sounds[soundType];
            
            if (typeof tt !== 'undefined' && sound.play) {
                // 抖音小游戏环境
                sound.stop(); // 停止之前的播放
                sound.play();
            } else if (sound.play) {
                // 浏览器环境
                sound.currentTime = 0; // 重置到开始
                sound.play().catch(error => {
                    console.warn(`音效播放失败 ${soundType}:`, error);
                });
            }
            
            // 部分音效添加振动反馈
            if (typeof tt !== 'undefined') {
                switch (soundType) {
                    case 'explosion':
                        tt.vibrateLong && tt.vibrateLong();
                        break;
                    case 'hit':
                    case 'shoot':
                        tt.vibrateShort && tt.vibrateShort();
                        break;
                }
            }
            
            console.log(`播放音效: ${soundType}`);
        } catch (error) {
            console.warn(`音效播放错误 ${soundType}:`, error);
        }
    }
    
    // 图片资源管理
    initImageAssets() {
        // 在实际项目中，这里会加载图片资源
        this.images = {
            background: null,
            player: null,
            monsters: {},
            weapons: {},
            powerups: {},
            effects: {}
        };
        
        // 模拟图片加载（实际项目中使用tt.createImage()）
        console.log('图片资源系统初始化完成');
    }
    
    // 绘制图片（如果有的话）
    // 注：此处原有的简单版 drawImage 会覆盖前面带占位符的安全版，导致资源未就绪时抛错。
    // 为避免冲突，移除该重复实现，统一使用前面带占位符与旋转支持的安全版 drawImage。
    
    // 更新粒子系统
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新粒子位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 应用重力和摩擦力
            if (particle.gravity) {
                particle.vy += particle.gravity;
            }
            if (particle.friction) {
                particle.vx *= particle.friction;
                particle.vy *= particle.friction;
            }
            
            // 特殊行为
            if (particle.type === 'powerup') {
                particle.floatPattern += 0.1;
                particle.y += Math.sin(particle.floatPattern) * 0.5;
            }
            
            // 更新生命和透明度
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            // 移除死亡的粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // 更新震屏效果
    // 震屏效果已移除
    
    // 更新连击系统
    updateComboSystem() {
        if (this.combo.count > 0) {
            this.combo.timer--;
            
            // 连击时间到，重置连击
            if (this.combo.timer <= 0) {
                this.combo.count = 0;
                this.combo.multiplier = 1;
            }
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
        
        // 应用震屏效果 - 只在核弹轰炸时启用
        // 震屏效果已移除
        
        this.drawBackground();
        
        if (this.gameState === 'playing') {
            this.drawPlayer();
            this.drawMonsters();
            this.drawBullets();
            this.drawExplosions();
            this.drawParticles();
            this.drawPowerUps();
            this.drawNotifications();
            this.drawInventory();
            this.drawActiveEffects();
        }
        
        // 恢复震屏效果 - 只在核弹轰炸时启用
        // 震屏效果已移除
        
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
        // 使用图片绘制玩家
        this.drawImage('player', this.player.x, this.player.y, this.player.width, this.player.height);
        
        // 根据状态添加状态指示器
        if (this.player.isUsingWeapon) {
            // 使用武器时的红色光环
            this.ctx.strokeStyle = '#FF6B6B';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width / 2, 
                         this.player.y + this.player.height / 2, 
                         this.player.width / 2 + 5, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        } else if (!this.player.canMove) {
            // 不能移动时的橙色光环
            this.ctx.strokeStyle = '#FFA500';
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.5;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width / 2, 
                         this.player.y + this.player.height / 2, 
                         this.player.width / 2 + 3, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        // 绘制护盾效果
        if (this.activeEffects.shield.active) {
            this.ctx.strokeStyle = '#4169E1';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.7;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width / 2, 
                         this.player.y + this.player.height / 2, 40, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        }
        
        // 绘制当前武器信息
        if (this.player.currentWeapon) {
            const weapon = this.weapons[this.player.currentWeapon];
            this.ctx.fillStyle = '#FFA500';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${weapon.name}`, 
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
            
            // 根据怪物类型选择对应的图片
            let imageKey = 'monster_basic';
            switch (monster.type) {
                case 'boss':
                    imageKey = 'monster_boss';
                    break;
                case 'tank':
                    imageKey = 'monster_tank';
                    break;
                case 'fast':
                    imageKey = 'monster_fast';
                    break;
                case 'flying':
                    imageKey = 'monster_flying';
                    break;
                case 'shielded':
                    imageKey = 'monster_shielded';
                    break;
                default:
                    imageKey = 'monster_basic';
            }
            
            // 绘制怪物图片
            this.drawImage(imageKey, monster.x, monster.y, monster.width, monster.height);
            
            // 根据血量添加颜色滤镜效果
            const healthPercent = monster.health / monster.maxHealth;
            if (healthPercent <= 0.3) {
                // 重伤时添加红色滤镜
                this.ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
                this.ctx.fillRect(monster.x, monster.y, monster.width, monster.height);
            } else if (healthPercent <= 0.6) {
                // 中伤时添加橙色滤镜
                this.ctx.fillStyle = 'rgba(230, 126, 34, 0.3)';
                this.ctx.fillRect(monster.x, monster.y, monster.width, monster.height);
            }
            
            // 绘制护盾效果
            if (monster.shieldActive) {
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.arc(monster.x + monster.width / 2, 
                           monster.y + monster.height / 2, 
                           monster.width / 2 + 5, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
            
            // Boss怪物特殊效果
            if (monster.type === 'boss') {
                // 绘制Boss光环
                this.ctx.strokeStyle = '#8E44AD';
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.6;
                this.ctx.beginPath();
                this.ctx.arc(monster.x + monster.width / 2, 
                           monster.y + monster.height / 2, 
                           monster.width / 2 + 10, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
            
            // 绘制血条
            this.drawHealthBar(monster.x, monster.y - 10, monster.width, monster.health, monster.maxHealth);
            
            // 绘制怪物类型标识
            if (monster.type !== 'normal') {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(monster.type.toUpperCase(), 
                                monster.x + monster.width / 2, 
                                monster.y - 15);
            }
        }
        this.ctx.textAlign = 'left';
    }
    
    // 颜色混合函数
    blendColors(color1, color2, ratio) {
        // 简化的颜色混合，实际应用中可能需要更复杂的实现
        return color2; // 暂时返回第二个颜色
    }
    
    drawBullets() {
        for (let bullet of this.bullets) {
            if (bullet.isEnergyBall) {
                // 能量球特殊绘制
                this.ctx.fillStyle = '#8E44AD';
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.arc(bullet.x + bullet.width / 2, 
                           bullet.y + bullet.height / 2, 
                           bullet.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 能量球光晕
                this.ctx.strokeStyle = '#9370DB';
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.5;
                this.ctx.beginPath();
                this.ctx.arc(bullet.x + bullet.width / 2, 
                           bullet.y + bullet.height / 2, 
                           bullet.width / 2 + 3, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            } else if (bullet.isExplosive) {
                // 爆炸子弹用红色
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            } else {
                // 根据武器类型使用不同颜色
                this.ctx.fillStyle = bullet.color || '#FFD700';
                
                // 步枪子弹稍微大一点
                if (bullet.weaponType === 'rifle') {
                    this.ctx.fillRect(bullet.x - 1, bullet.y, bullet.width + 2, bullet.height + 2);
                } else {
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
                }
            }
        }
    }
    
    // 绘制增强道具
    drawPowerUps() {
        for (let powerUp of this.powerUps) {
            // 脉冲效果
            const pulseSize = Math.sin(powerUp.pulse) * 5 + 30;
            
            // 绘制道具背景
            this.ctx.fillStyle = powerUp.color;
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillRect(powerUp.x - (pulseSize - 30) / 2, 
                            powerUp.y - (pulseSize - 30) / 2, 
                            pulseSize, pulseSize);
            
            // 绘制道具图标
            this.ctx.globalAlpha = 1;
            this.ctx.font = '20px Arial';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(powerUp.icon, 
                            powerUp.x + powerUp.width / 2, 
                            powerUp.y + powerUp.height / 2 + 7);
            
            // 绘制道具名称
            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = powerUp.color;
            this.ctx.fillText(powerUp.name, 
                            powerUp.x + powerUp.width / 2, 
                            powerUp.y - 5);
        }
        this.ctx.textAlign = 'left';
    }
    
    // 绘制通知
    drawNotifications() {
        if (!this.notifications) return;
        
        for (let notification of this.notifications) {
            this.ctx.globalAlpha = notification.alpha;
            this.ctx.fillStyle = notification.color;
            
            // 支持自定义字体大小
            const fontSize = notification.size || 18;
            this.ctx.font = `bold ${fontSize}px Arial`;
            this.ctx.textAlign = 'center';
            
            // 连击通知添加描边效果
            if (notification.text.includes('COMBO')) {
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 2;
                this.ctx.strokeText(notification.text, notification.x, notification.y);
            }
            
            this.ctx.fillText(notification.text, notification.x, notification.y);
        }
        this.ctx.globalAlpha = 1;
        this.ctx.textAlign = 'left';
    }
    
    // 绘制活跃效果指示器
    drawActiveEffects() {
        let effectY = 250;
        const effectSpacing = 25;
        
        for (let effect in this.activeEffects) {
            if (this.activeEffects[effect].active) {
                const duration = this.activeEffects[effect].duration;
                const progress = duration / 10000; // 假设最大10秒
                
                // 效果图标
                const effectIcons = {
                    doubleShot: '⚡',
                    rapidFire: '🔥',
                    shield: '🛡️',
                    healthRegen: '💊',
                    explosiveAmmo: '💥',
                    timeSlowdown: '⏰',
                    timeFreeze: '❄️'
                };
                
                const effectColors = {
                    doubleShot: '#FFD700',
                    rapidFire: '#FF4500',
                    shield: '#4169E1',
                    healthRegen: '#32CD32',
                    explosiveAmmo: '#DC143C',
                    timeSlowdown: '#9370DB',
                    timeFreeze: '#00BFFF'
                };
                
                // 绘制效果背景
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.fillRect(15, effectY - 15, 120, 20);
                
                // 绘制进度条
                this.ctx.fillStyle = effectColors[effect];
                this.ctx.fillRect(17, effectY - 13, 116 * progress, 16);
                
                // 绘制效果图标和名称
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '14px Arial';
                this.ctx.fillText(`${effectIcons[effect]} ${effect}`, 20, effectY);
                
                effectY += effectSpacing;
            }
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
    
    // 绘制粒子系统
    drawParticles() {
        for (let particle of this.particles) {
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillStyle = particle.color;
            
            // 根据粒子类型绘制不同形状
            switch (particle.type) {
                case 'explosion':
                    // 爆炸粒子 - 圆形
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'hit':
                    // 击中粒子 - 小方形
                    this.ctx.fillRect(particle.x - particle.size / 2, 
                                    particle.y - particle.size / 2, 
                                    particle.size, particle.size);
                    break;
                    
                case 'powerup':
                    // 道具粒子 - 星形
                    this.drawStar(particle.x, particle.y, particle.size, particle.color);
                    break;
                    
                default:
                    // 默认粒子 - 圆形
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    // 绘制星形
    drawStar(x, y, size, color) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.fillStyle = color;
        
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 4) / 5;
            const radius = i % 2 === 0 ? size : size / 2;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            
            if (i === 0) {
                this.ctx.moveTo(px, py);
            } else {
                this.ctx.lineTo(px, py);
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawInventory() {
        for (let item of this.inventory) {
            const centerX = item.x + item.width / 2;
            const centerY = item.y + item.height / 2;
            const radius = item.width / 2;
            
            // 区分普通武器和终极道具
            const isUltimate = item.type === 'ultimate1' || item.type === 'ultimate2';
            
            // 绘制道具图标 - 使用图片
            let imageKey, color, bgColor;
            
            if (item.type === 'pistol') {
                imageKey = 'weapon_pistol';
                color = '#FFD700';
                bgColor = 'rgba(255, 215, 0, 0.2)';
            } else if (item.type === 'rifle') {
                imageKey = 'weapon_rifle';
                color = '#00FFFF';
                bgColor = 'rgba(0, 255, 255, 0.2)';
            } else if (item.type === 'ultimate1') {
                imageKey = 'weapon_nuclear';
                const energyReady = this.energy >= this.maxEnergy;
                color = energyReady ? '#FF4500' : '#666666';
                bgColor = energyReady ? 'rgba(255, 69, 0, 0.3)' : 'rgba(102, 102, 102, 0.2)';
            } else if (item.type === 'ultimate2') {
                imageKey = 'weapon_timefreeze';
                const energyReady = this.energy >= this.maxEnergy;
                color = energyReady ? '#00BFFF' : '#666666';
                bgColor = energyReady ? 'rgba(0, 191, 255, 0.3)' : 'rgba(102, 102, 102, 0.2)';
            }
            
            // 绘制外边框 - 终极道具有特殊边框
            if (isUltimate) {
                // 终极道具双重边框
                this.ctx.strokeStyle = this.energy >= this.maxEnergy ? color : '#444444';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.strokeStyle = this.energy >= this.maxEnergy ? '#FFD700' : '#222222';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
                this.ctx.stroke();
            } else {
                // 普通武器简单边框
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // 绘制背景圆形
            this.ctx.fillStyle = bgColor;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 绘制主背景色
            this.ctx.fillStyle = color;
            this.ctx.globalAlpha = isUltimate ? (this.energy >= this.maxEnergy ? 0.7 : 0.3) : 0.6;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius - 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
            
            // 绘制道具图片
            const iconSize = isUltimate ? 40 : 35;
            const iconX = centerX - iconSize / 2;
            const iconY = centerY - iconSize / 2;
            
            // 如果是终极道具且未充能，则降低透明度
            if (isUltimate && this.energy < this.maxEnergy) {
                this.ctx.globalAlpha = 0.5;
            }
            
            this.drawImage(imageKey, iconX, iconY, iconSize, iconSize);
            this.ctx.globalAlpha = 1;
            
            // 终极道具能量指示器 - 在图标上显示能量点数
            if (isUltimate) {
                // 绘制能量点
                const energyDots = Math.min(this.energy, this.maxEnergy);
                const dotSize = 3;
                const dotSpacing = 8;
                const startX = centerX - (this.maxEnergy - 1) * dotSpacing / 2;
                
                for (let i = 0; i < this.maxEnergy; i++) {
                    const dotX = startX + i * dotSpacing;
                    const dotY = centerY - radius + 8;
                    
                    this.ctx.fillStyle = i < energyDots ? '#FFD700' : '#333333';
                    this.ctx.beginPath();
                    this.ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // 添加发光效果
                    if (i < energyDots && this.energy >= this.maxEnergy) {
                        this.ctx.shadowColor = '#FFD700';
                        this.ctx.shadowBlur = 6;
                        this.ctx.fillStyle = '#FFFF00';
                        this.ctx.beginPath();
                        this.ctx.arc(dotX, dotY, dotSize - 1, 0, Math.PI * 2);
                        this.ctx.fill();
                        this.ctx.shadowBlur = 0;
                        this.ctx.shadowColor = 'transparent';
                    }
                }
            }
            
            // 绘制选中状态指示器
            if (this.player.currentWeapon === item.type) {
                this.ctx.strokeStyle = '#FFFF00';
                this.ctx.lineWidth = 4;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }
        
        this.ctx.textAlign = 'left';
    }
    
    // 绘制圆角矩形的辅助函数
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
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
        // 绘制现代化渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, '#1e3c72');
        gradient.addColorStop(0.5, '#2a5298');
        gradient.addColorStop(1, '#1e3c72');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制动态装饰圆形
        const time = Date.now() * 0.001;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        this.ctx.beginPath();
        this.ctx.arc(this.width * 0.8 + Math.sin(time) * 10, this.height * 0.15, 80 + Math.cos(time * 0.5) * 5, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(this.width * 0.2 + Math.cos(time * 0.7) * 8, this.height * 0.85, 60 + Math.sin(time * 0.3) * 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 添加更多装饰圆形
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.beginPath();
        this.ctx.arc(this.width * 0.1, this.height * 0.25, 40, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(this.width * 0.9, this.height * 0.75, 35, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 计算内容总高度并垂直居中
        const titleHeight = 90;
        const playerInfoHeight = 120;  // 增加高度以容纳更好的布局
        const weaponAreaHeight = 230;
        const buttonHeight = 65;
        const spacing = 25; // 各部分之间的间距
        
        const totalContentHeight = titleHeight + playerInfoHeight + weaponAreaHeight + buttonHeight + spacing * 3;
        const startY = (this.height - totalContentHeight) / 2;
        
        // 现代化标题区域
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
        // 圆角矩形背景
        this.roundRect(this.width / 2 - 130, startY, 260, titleHeight, 15);
        this.ctx.fill();
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 现代化标题
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🚀 射击冒险', this.width / 2, startY + 55);
        
        // 副标题
        this.ctx.fillStyle = '#7F8C8D';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Guns Adventure Game', this.width / 2, startY + 75);
        
        // 现代化玩家信息卡片
        const playerInfoY = startY + titleHeight + spacing;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetY = 3;
        this.roundRect(this.width / 2 - 130, playerInfoY, 260, playerInfoHeight, 12);
        this.ctx.fill();
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 优化的玩家信息布局 - 左右分列显示
        this.ctx.textAlign = 'left';
        
        // 等级信息 - 左侧
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('👑', this.width / 2 - 110, playerInfoY + 35);
        this.ctx.fillStyle = '#34495E';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText('等级', this.width / 2 - 80, playerInfoY + 35);
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText(`${this.playerLevel}`, this.width / 2 - 40, playerInfoY + 35);
        
        // 金币信息 - 右侧
        this.ctx.fillStyle = '#F39C12';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillText('💰', this.width / 2 + 20, playerInfoY + 35);
        this.ctx.fillStyle = '#34495E';
        this.ctx.font = 'bold 18px Arial';
        this.ctx.fillText('金币', this.width / 2 + 50, playerInfoY + 35);
        this.ctx.fillStyle = '#F39C12';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.fillText(`${this.coins.toLocaleString()}`, this.width / 2 + 85, playerInfoY + 35);
        
        // 统计信息 - 第二行
        this.ctx.fillStyle = '#7F8C8D';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Lv.' + this.playerLevel + ' 冒险者', this.width / 2 - 110, playerInfoY + 65);
        
        this.ctx.textAlign = 'right';
        this.ctx.fillText('财富值 ' + this.coins.toLocaleString(), this.width / 2 + 110, playerInfoY + 65);
        
        // 经验进度条 - 显示真实经验值
        const expPercent = this.experience / this.experienceToNext;
        this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
        this.roundRect(this.width / 2 - 110, playerInfoY + 80, 220, 12, 6);
        this.ctx.fill();
        this.ctx.fillStyle = '#3498DB';
        this.roundRect(this.width / 2 - 110, playerInfoY + 80, 220 * expPercent, 12, 6);
        this.ctx.fill();
        
        // 经验进度文字
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`EXP ${this.experience}/${this.experienceToNext}`, this.width / 2, playerInfoY + 105);
        
        // 现代化武器升级区域
        const weaponAreaY = playerInfoY + playerInfoHeight + spacing;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetY = 3;
        this.roundRect(this.width / 2 - 130, weaponAreaY, 260, weaponAreaHeight, 12);
        this.ctx.fill();
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;
        
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔫 武器升级', this.width / 2, weaponAreaY + 35);
        
        const weapons = ['pistol', 'rifle', 'grenade'];
        const weaponNames = ['手枪', '步枪', '手雷'];
        const weaponIcons = ['🔫', '🎯', '💣'];
        
        for (let i = 0; i < weapons.length; i++) {
            const weaponType = weapons[i];
            const weapon = this.weapons[weaponType];
            const level = this.weaponLevels[weaponType];
            const cost = this.upgradeCosts[weaponType];
            
            // 现代化武器信息卡片
            const weaponCardY = weaponAreaY + 50 + i * 55;
            this.ctx.fillStyle = 'rgba(236, 240, 241, 0.8)';
            this.roundRect(this.width / 2 - 110, weaponCardY, 220, 50, 8);
            this.ctx.fill();
            
            // 武器图标背景
            const iconBg = ['#E74C3C', '#3498DB', '#E67E22'][i];
            this.ctx.fillStyle = iconBg;
            this.ctx.beginPath();
            this.ctx.arc(this.width / 2 - 85, weaponCardY + 25, 15, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 武器图标
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(weaponIcons[i], this.width / 2 - 85, weaponCardY + 30);
            
            // 武器名称和等级
            this.ctx.fillStyle = '#2C3E50';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${weaponNames[i]} Lv.${level}`, this.width / 2 - 60, weaponCardY + 20);
            
            // 伤害信息
            this.ctx.fillStyle = '#E74C3C';
            this.ctx.font = '14px Arial';
            this.ctx.fillText(`💥 ${weapon.damage}`, this.width / 2 - 60, weaponCardY + 38);
            
            // 现代化升级按钮
            const button = {
                x: this.width / 2 + 25,
                y: weaponCardY + 5,
                width: 75,
                height: 40
            };
            
            // 按钮背景和阴影
            const canUpgrade = this.coins >= cost;
            this.ctx.fillStyle = canUpgrade ? '#27AE60' : '#95A5A6';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetY = 2;
            this.roundRect(button.x, button.y, button.width, button.height, 6);
            this.ctx.fill();
            
            // 重置阴影
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetY = 0;
            
            // 按钮文字
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('升级', button.x + 37, button.y + 18);
            
            // 升级费用
            this.ctx.fillStyle = canUpgrade ? '#F39C12' : '#7F8C8D';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(`${cost}💰`, button.x + 37, button.y + 32);
        }
        
        // 现代化开始游戏按钮
        const startButtonY = weaponAreaY + weaponAreaHeight + spacing;
        const startButton = {
            x: this.width / 2 - 110,
            y: startButtonY,
            width: 220,
            height: buttonHeight
        };
        
        // 按钮阴影
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 8;
        
        // 按钮渐变背景
        const buttonGradient = this.ctx.createLinearGradient(startButton.x, startButton.y, startButton.x, startButton.y + startButton.height);
        buttonGradient.addColorStop(0, '#00BF63');
        buttonGradient.addColorStop(0.5, '#00A859');
        buttonGradient.addColorStop(1, '#009951');
        this.ctx.fillStyle = buttonGradient;
        this.roundRect(startButton.x, startButton.y, startButton.width, startButton.height, 15);
        this.ctx.fill();
        
        // 按钮高光效果
        const highlightGradient = this.ctx.createLinearGradient(startButton.x, startButton.y, startButton.x, startButton.y + startButton.height * 0.4);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = highlightGradient;
        this.roundRect(startButton.x, startButton.y, startButton.width, startButton.height * 0.4, 15);
        this.ctx.fill();
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 按钮文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 26px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🚀 开始游戏', this.width / 2, startButton.y + 42);
        
        // 按钮副标题
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Start Adventure', this.width / 2, startButton.y + 58);
        
        this.ctx.textAlign = 'left';
    }
    
    // 绘制游戏UI - 现代化显示
    drawGameUI() {
        // 现代化UI背景卡片
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetY = 4;
        this.roundRect(15, 15, 190, 170, 12);
        this.ctx.fill();
        
        // 重置阴影
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetY = 0;
        
        // 分数显示 - 缩小字体
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.fillText(`🏆 ${this.score}`, 18, 32);
        
        // 金币显示 - 缩小字体
        this.ctx.fillStyle = '#f39c12';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`💰 ${this.coins}`, 18, 50);
        
        // 生命值条 - 缩小尺寸
        this.drawHealthBar(18, 58, 150, this.player.health, 100);
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.fillText(`❤️ ${this.player.health}`, 18, 78);
        
        // 波次显示 - 缩小字体
        this.ctx.fillStyle = '#9b59b6';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(`🌊 ${this.waveNumber}`, 18, 96);
        
        // 能量显示已移至道具图标上
        
        // 连击显示 - 缩小字体和位置
        if (this.combo.count > 1) {
            this.ctx.fillStyle = this.combo.count >= 10 ? '#FF4500' : '#FFD700';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`🔥 ${this.combo.count}x (${this.combo.multiplier}倍)`, 18, 114);
            
            // 连击时间条 - 缩小尺寸
            const timerPercent = this.combo.timer / this.combo.maxTimer;
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            this.ctx.fillRect(18, 118, 120, 4);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(18, 118, 120 * timerPercent, 4);
        }
        
        // 绘制操作提示 - 缩小字体和简化文字
        this.ctx.fillStyle = '#34495e';
        this.ctx.font = 'bold 10px Arial';
        const tipsY = this.combo.count > 1 ? 135 : 110;
        this.ctx.fillText('🎯 点击道具使用', 18, tipsY);
        this.ctx.fillText('🎯 点击怪物射击', 18, tipsY + 12);
        this.ctx.fillText('🎯 点击空白切换', 18, tipsY + 24);
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

// 启动一个游戏实例（避免多实例导致的画布相互覆盖）
console.log('🚀 启动游戏实例');
new GunsGame();
