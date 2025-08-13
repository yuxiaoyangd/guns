// 音频管理类
class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        this.init();
    }
    
    init() {
        // 初始化音频上下文
        try {
            this.audioContext = tt.createInnerAudioContext();
        } catch (e) {
            console.log('音频初始化失败:', e);
        }
    }
    
    // 播放音效
    playSound(soundName) {
        if (this.isMuted) return;
        
        try {
            const audio = tt.createInnerAudioContext();
            audio.src = `sounds/${soundName}.mp3`;
            audio.play();
        } catch (e) {
            console.log('播放音效失败:', e);
        }
    }
    
    // 播放背景音乐
    playMusic(musicName) {
        if (this.isMuted) return;
        
        try {
            if (this.music) {
                this.music.destroy();
            }
            
            this.music = tt.createInnerAudioContext();
            this.music.src = `music/${musicName}.mp3`;
            this.music.loop = true;
            this.music.play();
        } catch (e) {
            console.log('播放音乐失败:', e);
        }
    }
    
    // 停止音乐
    stopMusic() {
        if (this.music) {
            this.music.stop();
            this.music.destroy();
            this.music = null;
        }
    }
    
    // 静音切换
    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopMusic();
        } else {
            this.playMusic('background');
        }
    }
    
    // 预加载音效
    preloadSounds() {
        const soundList = [
            'shoot',
            'explosion',
            'monster_hit',
            'coin_collect',
            'game_over'
        ];
        
        soundList.forEach(sound => {
            this.sounds[sound] = tt.createInnerAudioContext();
            this.sounds[sound].src = `sounds/${sound}.mp3`;
        });
    }
}

// 导出音频管理器
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
