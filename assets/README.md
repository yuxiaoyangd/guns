# 游戏资源目录

这个目录包含游戏所需的所有资源文件。

## 目录结构
```
assets/
├── sounds/          # 音效文件
│   ├── shoot.mp3    # 射击音效
│   ├── explosion.mp3 # 爆炸音效
│   ├── monster_hit.mp3 # 怪物受击音效
│   ├── coin_collect.mp3 # 收集金币音效
│   └── game_over.mp3 # 游戏结束音效
├── music/           # 背景音乐
│   └── background.mp3 # 背景音乐
├── images/          # 图片资源
│   ├── player.png   # 角色图片
│   ├── monster.png  # 怪物图片
│   ├── weapons/     # 武器图片
│   │   ├── pistol.png
│   │   ├── rifle.png
│   │   └── grenade.png
│   └── ui/          # UI图片
│       ├── button.png
│       ├── health_bar.png
│       └── coin.png
└── README.md        # 本文件
```

## 音效文件说明
- **shoot.mp3**: 射击音效，建议时长0.5秒以内
- **explosion.mp3**: 爆炸音效，建议时长1-2秒
- **monster_hit.mp3**: 怪物受击音效，建议时长0.3秒以内
- **coin_collect.mp3**: 收集金币音效，建议时长0.5秒以内
- **game_over.mp3**: 游戏结束音效，建议时长2-3秒

## 背景音乐说明
- **background.mp3**: 循环播放的背景音乐，建议时长1-3分钟

## 图片资源说明
- **player.png**: 角色图片，建议尺寸40x60像素
- **monster.png**: 怪物图片，建议尺寸40x40像素
- **weapons/**: 武器图标，建议尺寸60x60像素
- **ui/**: 界面元素，根据实际需要设计尺寸

## 注意事项
1. 所有音效文件建议使用MP3格式，文件大小控制在100KB以内
2. 背景音乐文件大小建议控制在2MB以内
3. 图片文件建议使用PNG格式，支持透明背景
4. 资源文件命名使用小写字母和下划线
5. 确保所有资源文件都有适当的版权许可

## 资源获取建议
- 音效：可使用免费音效网站如Freesound.org
- 音乐：可使用免费音乐网站如Incompetech.com
- 图片：可使用免费图片网站如OpenGameArt.org
- 或使用AI工具生成符合游戏风格的资源
