// 游戏配置文件
const GameConfig = {
    // 游戏基础设置
    GAME_TITLE: '射击冒险',
    VERSION: '1.0.0',
    
    // 画布设置
    CANVAS_WIDTH: 375,
    CANVAS_HEIGHT: 667,
    
    // 角色设置
    PLAYER: {
        WIDTH: 40,
        HEIGHT: 60,
        SPEED: 2,
        MAX_HEALTH: 100,
        START_X: 187, // CANVAS_WIDTH / 2
        START_Y: 517  // CANVAS_HEIGHT - 150
    },
    
    // 武器设置
    WEAPONS: {
        PISTOL: {
            NAME: '手枪',
            DAMAGE: 20,
            RANGE: 200,
            COOLDOWN: 500,
            BULLET_SPEED: 8,
            BULLET_SIZE: { WIDTH: 4, HEIGHT: 8 }
        },
        RIFLE: {
            NAME: '步枪',
            DAMAGE: 35,
            RANGE: 300,
            COOLDOWN: 300,
            BULLET_SPEED: 10,
            BULLET_SIZE: { WIDTH: 6, HEIGHT: 10 }
        },
        GRENADE: {
            NAME: '手雷',
            DAMAGE: 80,
            RANGE: 150,
            COOLDOWN: 1000,
            EXPLOSION_RADIUS: 50,
            EXPLOSION_DURATION: 30
        }
    },
    
    // 怪物设置
    MONSTERS: {
        SPAWN_RATE: 0.02,
        MIN_HEALTH: 50,
        MAX_HEALTH: 100,
        MIN_SPEED: 1,
        MAX_SPEED: 3,
        WIDTH: 40,
        HEIGHT: 40,
        SCORE_VALUE: 100,
        COIN_VALUE: { MIN: 1, MAX: 5 }
    },
    
    // 道具栏设置
    INVENTORY: {
        ITEM_SIZE: 60,
        START_X: 50,
        START_Y: 587, // CANVAS_HEIGHT - 80
        SPACING: 80
    },
    
    // UI设置
    UI: {
        FONT_FAMILY: 'Arial',
        SCORE_FONT_SIZE: 20,
        HEALTH_FONT_SIZE: 14,
        HEALTH_BAR_HEIGHT: 4,
        HEALTH_BAR_WIDTH: 200
    },
    
    // 颜色配置
    COLORS: {
        BACKGROUND_TOP: '#87CEEB',
        BACKGROUND_BOTTOM: '#E0F6FF',
        PLAYER_NORMAL: '#4ECDC4',
        PLAYER_ATTACKING: '#FF6B6B',
        PLAYER_HEAD: '#FFEAA7',
        MONSTER: '#9B59B6',
        BULLET: '#FFD700',
        EXPLOSION: '#FF6B6B',
        INVENTORY_BG: '#34495E',
        INVENTORY_TEXT: '#FFFFFF',
        HEALTH_BAR_BG: '#E74C3C',
        HEALTH_BAR_FILL: '#2ECC71',
        UI_TEXT: '#2C3E50',
        GAME_OVER_OVERLAY: 'rgba(0, 0, 0, 0.7)',
        GAME_OVER_TEXT: '#FFFFFF'
    },
    
    // 动画设置
    ANIMATION: {
        EXPLOSION_GROWTH_RATE: 2,
        EXPLOSION_FADE_RATE: 0.03,
        PARTICLE_LIFE: 30,
        PARTICLE_COUNT: 20
    },
    
    // 音效设置
    AUDIO: {
        ENABLED: true,
        BACKGROUND_MUSIC: 'background',
        SOUND_EFFECTS: {
            SHOOT: 'shoot',
            EXPLOSION: 'explosion',
            MONSTER_HIT: 'monster_hit',
            COIN_COLLECT: 'coin_collect',
            GAME_OVER: 'game_over'
        }
    },
    
    // 难度设置
    DIFFICULTY: {
        EASY: {
            MONSTER_SPAWN_RATE: 0.015,
            MONSTER_SPEED_MULTIPLIER: 0.8,
            PLAYER_SPEED_MULTIPLIER: 1.2
        },
        NORMAL: {
            MONSTER_SPAWN_RATE: 0.02,
            MONSTER_SPEED_MULTIPLIER: 1.0,
            PLAYER_SPEED_MULTIPLIER: 1.0
        },
        HARD: {
            MONSTER_SPAWN_RATE: 0.025,
            MONSTER_SPEED_MULTIPLIER: 1.2,
            PLAYER_SPEED_MULTIPLIER: 0.8
        }
    },
    
    // 成就系统
    ACHIEVEMENTS: {
        FIRST_KILL: { name: '初次击杀', requirement: 1, type: 'monsters_killed' },
        SHARPSHOOTER: { name: '神射手', requirement: 10, type: 'monsters_killed' },
        SURVIVOR: { name: '生存者', requirement: 60, type: 'survival_time' },
        WEAPON_MASTER: { name: '武器大师', requirement: 3, type: 'weapons_used' }
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameConfig;
}
