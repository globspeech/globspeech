 # GlobSpeech

[Screenshot1](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot1.png)

GlobSpeech 是一款类似于 Anki 的开源单词记忆软件

本项目采用 [MIT 协议](LICENSE) 开源。

## ✨ 主要功能

*   **内置与自定义词库**：软件自带常用词库，同时支持用户根据自身需求创建专属词库。
*   **网络词库支持**：通过提供一个 Raw 格式的 URL，轻松添加和分享网络词库。
*   **视频字幕实时释义**：在观看视频时，选择并加载字幕文件，软件会在侧边栏实时显示当前字幕中单词的释义，并优先展示较难的单词。
*   **文本词元化 (Lemmatization)**：强大的文本分析工具，可将一篇文章或字幕中的所有单词提取并还原为其基本形式（词元），方便用户在阅读前集中学习生词。
*   **自定义快捷键**：根据个人使用习惯，自由设置各项操作的快捷键。
*   **数据管理**：支持方便地导入、导出和重置学习进度。

## 🚀 功能展示

### 词库管理与学习
用户可以方便地管理自己的词库，包括创建新词库、使用内置词库或添加网络词库。

[Screenshot2](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot2.png)

### 视频辅助学习
在观看视频时，加载本地字幕文件，GlobSpeech 会在右侧实时显示单词释义，并按难度排序，让您在娱乐中轻松学词。

[Screenshot5](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot5.png)

### 文本词元化工具
在阅读一篇英文文章或观看视频之前，可以先将其文本内容（如文章或字幕文件）输入到词元化工具中。该工具会自动提取所有单词并将其还原为基本形态（例如，"apples" 变为 "apple"），然后以每行一个单词的格式输出。这样，您可以预先学习和记忆核心词汇。

[Screenshot3](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot3.png)
[Screenshot4](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot4.png)

### 个性化设置
用户可以自定义快捷键，并轻松管理自己的学习数据。

[Screenshot6](https://raw.githubusercontent.com/globspeech/globspeech/refs/heads/main/Screenshot6.png)

## 🌐 如何创建和添加网络词库

GlobSpeech 支持用户通过一个公开的 Raw URL 添加网络词库。为了确保软件能够正确解析，您的网络词库文件必须遵循以下格式：

1.  **文件必须是可通过互联网访问的 Raw (原始数据) 链接。**
2.  **第一行**：必须包含词库的名称，并用英文尖括号 `< >` 包裹。
3.  **后续行**：从第二行开始，每行有且仅包含一个单词。
4.  **单词规范**：所有单词仅允许使用标准的 26 个英文字母（A-Z, a-z），不允许包含数字、特殊字符或空格。

**示例：**

假设您创建了一个名为 `tech-words.txt` 的文件，内容如下：

```
<tech words>
Neural
Genome
Quantum
Compiler
Algorithm
```

您可以将此文件上传到 GitHub Gist 或仓库中，并获取其 **Raw** 链接来添加到 GlobSpeech 中。

## 🛠️ 技术栈与编译

本软件基于 **Electron** 框架开发。

### 如何编译

若要从源代码编译本项目，请按照以下步骤操作：

1.  克隆本仓库到本地。
2.  安装项目依赖：
    ```bash
    yarn install
    ```
3.  编译打包：
    ```bash
    yarn build
    ```

编译完成后，您可以在 `dist` 找到可执行文件。
