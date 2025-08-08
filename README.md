# GlobSpeech

一个类 Anki 的开源背单词工具。支持本地与网络词库、视频字幕词义联动、词元化（词形还原）、自定义快捷键与学习进度管理。基于 Electron 开发，MIT 协议开源。

- 主页截图  
  [Screenshot1](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot1.png)

## 主要特性

- 自带词库，亦可本地创建自定义词库
- 支持添加网络词库（通过 Raw 原始数据链接）
- 视频 + 字幕学习：根据当前字幕实时显示词义，难词优先
  - 截图示例  
    [Screenshot5](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot5.png)
- 词元化（词形还原）：将文本中的单词还原为词根形态（如 apples → apple）
  - 适合事先处理文章或字幕，导出为一行一个词
  - 截图示例  
    [Screenshot3](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot3.png)  
    [Screenshot4](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot4.png)
- 自定义快捷键、导入/导出、重置学习进度  
  [Screenshot6](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot6.png)

## 网络词库格式（Raw 原始数据）

网络词库文件必须可以通过互联网以 Raw（原始数据）方式访问，例如 GitHub 文件页面点击 “Raw” 后复制得到的链接。

文件格式要求：
- 第一行：词库名称，使用英文尖括号包裹
- 从第二行开始：每行仅包含一个单词
- 单词仅允许使用标准的 26 个英文字母（A–Z, a–z）

示例（注意尖括号保持原样，不要转义）：
```
<tech words>
Neural
Genome
Quantum
```

添加方式（示例流程）：
1) 将上面的内容保存到一个文本文件并托管（如 GitHub Gist 或仓库）  
2) 在对应页面点击 “Raw”，复制原始数据链接  
3) 在 GlobSpeech 中选择“添加网络词库”，粘贴该 Raw 链接即可

格式校验清单：
- 有且仅有一行标题，且形如 <your list name>
- 每个单词独占一行
- 不包含数字、连字符、下划线或其他符号
- 文件必须能通过网络以纯文本 Raw 方式访问

## 使用指南

- 本地词库
  - 新建词库、编辑单词，按需导入/导出或重置进度
- 视频与字幕联动
  - 选择视频文件与对应字幕文件
  - 播放时右侧实时显示当前字幕中的词义，难词在上，便于优先记忆
- 词元化（词形还原）
  - 粘贴或导入一段英文文本/字幕
  - 工具会自动分词并还原为词根（如 apples → apple）
  - 导出结果为“一行一个词”，可直接用于构建词库或预习

## 构建与运行

- 环境：Node.js + Yarn
- 命令：
```
yarn install
yarn build
```

## 许可

- 开源协议：MIT

——  
如需示例网络词库的最小模板，可直接复制以下内容托管为 Raw 文件后添加：
```
<my words>
apple
banana
cherry
```
