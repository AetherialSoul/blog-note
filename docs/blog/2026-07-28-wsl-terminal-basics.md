# 2026-07-28：用 WSL 开始练 Linux 终端

今天开始在 Windows 的 WSL Ubuntu 环境中练习 Linux 终端。目标不是先背很多命令，而是先建立三个基本概念：我现在在哪个目录、目录里有什么、每个文件或目录谁能修改。

> 第一轮的范围是：安全地管理一个自己的练习目录，包括路径、文件、文本查看与搜索、复制移动删除、基础权限、软件安装和命令帮助。进程、网络、Git 和 ROS 2 工作区留到后续轮次。本文依据 GNU Coreutils、GNU grep、ripgrep 和 Ubuntu 官方文档复核，资料查询日期为 2026-07-28。

## 当前进度

目前已经创建了一个专门的练习目录：

```bash
mkdir -p ~/terminal-lab/notes
cd ~/terminal-lab
```

`mkdir` 的意思是创建目录，`-p` 表示上层目录不存在时一并创建，目录已经存在时也不会报错。`~` 表示当前 Linux 用户的家目录，所以练习文件最终放在 `~/terminal-lab` 下。

接着用下面的命令确认当前位置：

```bash
pwd
```

`pwd` 是 "print working directory" 的缩写，会显示当前所在目录。进入 `~/terminal-lab` 后，再执行：

```bash
ls -la
```

`ls` 用来列出目录内容；`-l` 要求显示详细信息，`-a` 则要求连隐藏项也显示。

## 看懂一次真实输出

当前目录的输出如下：

```text
drwxr-xr-x 3 linyudong linyudong 4096 Jul 28 14:59 .
drwxr-x--- 4 linyudong linyudong 4096 Jul 28 14:55 ..
drwxr-xr-x 2 linyudong linyudong 4096 Jul 28 14:59 notes
```

每一行的结构是：

```text
类型和权限  链接数  所有者  所属组  大小  修改时间  名称
```

其中：

- `.` 是当前目录，也就是 `~/terminal-lab`。
- `..` 是上一级目录，也就是当前用户的家目录。
- `notes` 是刚创建的子目录。
- 开头的 `d` 表示这是一个目录。
- `rwxr-xr-x` 是权限：所有者可以读、写、进入；同组用户和其他用户可以读、进入，但不能修改。
- 两个 `linyudong` 分别表示所有者和所属用户组。

`4096` 是目录本身的元数据占用，并不等于目录中所有文件的总大小。

## 补全：在路径之间前进、返回与切换

刚进入终端时，最容易混淆的不是命令本身，而是“我现在在哪”。先把下面几种移动方式练成固定动作。

假设当前提示符是 `~/terminal-lab$`，可以进入 `notes`：

```bash
cd notes
pwd
```

`cd` 是 "change directory" 的缩写。此时 `pwd` 应显示：

```text
/home/linyudong/terminal-lab/notes
```

返回上一级目录：

```bash
cd ..
pwd
```

`..` 永远表示当前目录的上一级。因此从 `notes` 执行 `cd ..` 会回到 `~/terminal-lab`。它只改变当前位置，不会删除、移动或回滚任何文件。

直接回到家目录有两种等价写法：

```bash
cd ~
cd
```

`~` 是当前用户的家目录，也就是这里的 `/home/linyudong`。无论之前进入了多深的目录，都可以用它重新回到一个确定的位置。

在两个目录之间来回切换时，使用：

```bash
cd ~/terminal-lab
cd -
cd -
```

`cd -` 会跳回上一次所在目录，同时把目标路径打印出来。上面的两次 `cd -` 会在家目录和 `~/terminal-lab` 之间切换。

## 相对路径与绝对路径

前面写的 `cd notes`、`cd ..` 是相对路径，含义取决于你现在所在的目录。以 `/` 开头的路径是绝对路径，不受当前位置影响：

```bash
cd /home/linyudong/terminal-lab/notes
```

练习时可以先用 `pwd` 看当前位置，再执行 `ls -la` 确认目标目录是否存在。路径写错而看到 `No such file or directory` 时，不要随便尝试带 `sudo` 的命令；按下面的顺序重新定位即可：

```bash
pwd
ls -la
cd ~
cd ~/terminal-lab
```

还可以使用 Tab 补全减少输入错误：先输入 `cd no`，按一次 `Tab` 键。终端会把已知的 `notes` 补全；如果有多个可能的名字，连续按两次 `Tab` 会列出候选项。

## 创建、编辑和查看文件

路径练熟后，在现有的 `notes` 目录中创建一份笔记：

```bash
cd ~/terminal-lab
touch notes/day1.md
```

`touch` 用来创建空文件；如果文件已经存在，它不会清空内容，只会更新文件的修改时间。

编辑这个文件：

```bash
nano notes/day1.md
```

`nano` 是终端中的文本编辑器。输入下面两行后，按 `Ctrl + O` 保存，按回车确认文件名，最后按 `Ctrl + X` 退出：

```text
I am learning Linux.
ROS 2 runs on Ubuntu.
```

查看短文件内容时使用：

```bash
cat notes/day1.md
```

`cat` 会把整个文件直接打印到终端。文件很长时改用：

```bash
less notes/day1.md
```

`less` 可以逐页查看，按 `q` 退出。不要用 `cat` 打开很大的日志文件，否则内容会快速滚过屏幕。

## 复制、移动和重命名

先复制笔记，再把副本重命名：

```bash
cp notes/day1.md notes/day1-copy.md
mv notes/day1-copy.md notes/linux-notes.md
```

`cp` 的格式是 `cp 原路径 新路径`，会保留原文件并创建副本。`mv` 的格式也是“原路径 新路径”；同一目录内修改名字时它表示重命名，换到另一个目录时它表示移动。

执行后检查结果：

```bash
ls -la notes
```

## 搜索文本：grep 和 rg

`grep` 是 Ubuntu 自带的文本搜索工具。`-n` 会同时显示匹配文本所在的行号：

```bash
grep -n "ROS" notes/day1.md
```

它会在单个文件中找出包含 `ROS` 的行。若命令没有输出，并不一定是故障，通常表示没有匹配到内容；可以用 `$?` 查看上一条命令的退出状态，`0` 表示找到了匹配，`1` 表示没有匹配，`2` 表示命令本身发生错误。

`rg` 是 ripgrep 提供的更快、更适合项目目录的搜索命令。先安装：

```bash
sudo apt update
sudo apt install -y ripgrep
```

`apt` 是 Ubuntu 的软件包管理器。`update` 只更新可安装软件的目录，`install` 才会安装软件；`sudo` 表示管理员权限，安装系统软件时才需要它。包名是 `ripgrep`，安装后的命令才叫 `rg`。

在当前练习目录及其子目录中搜索：

```bash
cd ~/terminal-lab
rg -n "ROS" .
```

这里的 `.` 表示从当前目录开始递归搜索。初学阶段可以先记住：搜一个已知文件用 `grep`，搜整个项目用 `rg`。

`rg` 默认会尊重 `.gitignore` 等忽略规则，也会跳过隐藏文件和二进制文件。这正适合搜索普通代码项目；只有确定需要时，才额外学习 `--hidden` 等选项。

## 删除：rm 必须谨慎

Linux 的 `rm` 默认不会把文件放进回收站，删除后通常不能方便地恢复。因此只在自己刚创建的测试文件上练习：

```bash
touch notes/delete-me.md
ls -la notes
rm -i notes/delete-me.md
```

`rm` 是删除文件，`-i` 表示删除前要求确认。看到提示时输入 `y` 并回车才会删除；输入其他内容或按 `Ctrl + C` 可以取消。

需要知道但暂时不要随意运行的两种形式是：

- `rm -r 目录名`：递归删除目录和它内部的所有内容。
- `rm -rf 路径`：递归且不询问地删除，`-f` 会忽略大部分提示。

不要对不完全确定的路径使用 `rm -r` 或 `rm -rf`，尤其不要加 `sudo`，也不要在路径中盲目使用 `*`。删除前先执行 `pwd` 和 `ls -la` 确认位置和目标；空目录可以优先用 `rmdir 目录名`，它只会删除真正为空的目录。

## 不会用命令时怎么查

遇到陌生命令，先看简明帮助：

```bash
rg --help
```

完整手册使用：

```bash
man rg
```

在 `man` 中按 `q` 退出。任何不确定的选项都先查 `--help`，特别是带有删除、权限或管理员权限的命令。

## 查找文件，而不只是查找文字

`rg` 和 `grep` 搜索的是文件内容；如果忘记文件放在哪里，使用 `find`：

```bash
find ~/terminal-lab -type f -name "*.md"
```

这条命令的含义是：从 `~/terminal-lab` 开始，只找普通文件（`-type f`），文件名匹配 `*.md`。这里给 `*.md` 加引号，避免 shell 在执行 `find` 前就把通配符提前展开。

常用通配符还有：

- `*`：任意长度的字符，例如 `notes/*.md`。
- `?`：一个任意字符，例如 `day?.md`。

通配符很方便，但不确定它会匹配哪些文件时，先用 `ls notes/*.md` 观察结果，特别是不要直接把它接到 `rm` 后面。

## 看文件的一部分，并统计内容

除了 `cat` 和 `less`，下面三个命令适合日志、配置和代码文件：

```bash
head -n 5 notes/day1.md
tail -n 5 notes/day1.md
wc -l notes/day1.md
```

- `head -n 5`：显示前 5 行。
- `tail -n 5`：显示最后 5 行。
- `wc -l`：统计行数。

后续看 ROS 2 日志时，`tail` 和 `rg` 会非常常用；这一轮只要先理解它们是在读取，不会修改文件。

## 管道与输出重定向

终端命令默认把结果打印到屏幕。`|` 可以把前一条命令的输出交给后一条命令：

```bash
rg -n "ROS" . | wc -l
```

这里先搜索所有包含 `ROS` 的行，再数一共有多少行。`|` 叫管道。

`>` 可以把输出写入文件，`>>` 可以把输出追加到文件末尾：

```bash
pwd > notes/location.txt
date >> notes/location.txt
cat notes/location.txt
```

第一条命令会新建或覆盖 `location.txt`，第二条命令会保留原内容并追加日期。因此使用 `>` 前必须确认目标文件；不想覆盖已有笔记时用 `>>`。

## 权限与可执行文件的最小练习

`ls -l` 中的 `r`、`w`、`x` 分别是读、写、执行权限。先在测试文件上练习为当前用户增加执行权限：

```bash
touch notes/hello.sh
ls -l notes/hello.sh
chmod u+x notes/hello.sh
ls -l notes/hello.sh
```

`chmod` 用于修改权限；`u+x` 表示为文件所有者（user）增加执行（execute）权限。这个空文件还不能完成有意义的工作，真正运行 shell 脚本会在后续练习中学习；这里的目的只是看懂权限字段从 `rw-` 变成 `rwx`。

不要在不理解目标的情况下使用递归权限修改，例如 `chmod -R`，也不要用 `sudo chmod` 修复普通练习目录的权限问题。

## 命令定位、历史与终端整理

安装或使用工具后，可以确认它来自哪里：

```bash
command -v rg
```

`command -v` 会打印 shell 将要运行的命令路径。查看刚输入过的命令：

```bash
history
```

也可以用键盘上箭头回到上一条命令并修改。屏幕太乱时使用 `clear`，或按 `Ctrl + L`；它们只清空显示，不会删除历史记录或文件。

## 第一轮的完整检查清单

这一轮结束前，应能独立完成下面每一项，而不是只认得命令名字：

- 用 `pwd`、`ls -la`、`cd`、`cd ..`、`cd -` 和 Tab 补全确认并切换路径。
- 用 `mkdir`、`touch`、`nano`、`cat`、`less` 创建、编辑和查看文本文件。
- 用 `cp`、`mv`、`rmdir` 和 `rm -i` 管理自己的测试文件，并在删除前先确认路径。
- 用 `grep` 搜索单一文件、用 `rg` 搜索整个目录、用 `find` 按文件名定位文件。
- 用 `head`、`tail`、`wc -l` 读取部分内容或统计行数。
- 理解 `|`、`>` 和 `>>` 分别如何传递、覆盖和追加输出。
- 看懂 `ls -l` 的基本权限，并只对测试文件使用 `chmod u+x`。
- 用 `--help`、`man`、`command -v` 和 `history` 自己查证不熟悉的命令。
- 知道 `sudo apt update` 与 `sudo apt install 包名` 的职责不同，且不随意使用 `sudo`。

## 参考资料

- [GNU Coreutils manual](https://www.gnu.org/software/coreutils/manual/coreutils.html)
- [GNU grep manual](https://www.gnu.org/software/grep/manual/grep.html)
- [ripgrep User Guide](https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md)
- [Ubuntu package management](https://ubuntu.com/server/docs/how-to/software/package-management/)

## 本轮待完成的小练习

下面的练习只涉及当前已经创建的目录，可以逐条执行。先完成路径切换：

```bash
cd ~/terminal-lab
cd notes
cd ..
cd ~
cd ~/terminal-lab
cd -
cd -
```

再完成文件、搜索和安全删除：

```bash
touch notes/day1.md
nano notes/day1.md
cat notes/day1.md
cp notes/day1.md notes/day1-copy.md
mv notes/day1-copy.md notes/linux-notes.md
grep -n "ROS" notes/day1.md
rg -n "ROS" .
touch notes/delete-me.md
rm -i notes/delete-me.md
```

完成后，应该能回答这些问题：`~` 指向哪里、`.` 和 `..` 分别表示什么、什么时候用相对路径、迷路后如何回到 `~/terminal-lab`、`cp` 和 `mv` 的区别、`grep` 和 `rg` 分别适合搜什么，以及为什么删除时优先使用 `rm -i`。

## 这一轮留下的习惯

后续每次执行命令前，先用 `pwd` 确认位置；需要确认目录内容时用 `ls -la`。Linux 路径中的 `~`、`.`、`..` 会反复出现，先把它们用熟，比急着记复杂命令更重要。

完成上面的完整检查清单后，第一轮才算结束。第二轮将专门练习启动一个本地服务、查看进程和端口、通过 `Ctrl + C` 正常停止程序，以及用 Git 保存练习记录。
