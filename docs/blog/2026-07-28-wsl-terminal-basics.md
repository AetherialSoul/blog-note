# 2026-07-28：用 WSL 开始练 Linux 终端

今天开始在 Windows 的 WSL Ubuntu 环境中练习 Linux 终端。目标不是先背很多命令，而是先建立三个基本概念：我现在在哪个目录、目录里有什么、每个文件或目录谁能修改。

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

## 本轮待完成的小练习

下面的练习只涉及当前已经创建的目录，可以逐条执行并在每一步观察 `pwd` 的输出：

```bash
cd ~/terminal-lab
cd notes
cd ..
cd ~
cd ~/terminal-lab
cd -
cd -
```

完成后，应该能回答四个问题：`~` 指向哪里、`.` 和 `..` 分别表示什么、什么时候用相对路径、迷路后如何回到 `~/terminal-lab`。

## 这一轮留下的习惯

后续每次执行命令前，先用 `pwd` 确认位置；需要确认目录内容时用 `ls -la`。Linux 路径中的 `~`、`.`、`..` 会反复出现，先把它们用熟，比急着记复杂命令更重要。

路径切换练顺以后，下一轮再练习编辑文件、启动一个本地服务、查看进程和通过 `Ctrl + C` 正常停止程序。
