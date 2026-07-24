# 跑通 RoboMaster 自瞄闭环仿真

今天完成了同济 SuperPower 25 赛季自瞄系统的 Windows 仿真复现。目标不是“让程序看起来在开火”，而是验证一条完整闭环：游戏画面进入视觉程序，程序检测并跟踪目标，外部命令真实带动云台，最后造成游戏内伤害。

最后一轮测试中，前哨站从剩余 440 HP 被击毁到 0 HP：发射 66 发，22 次造成有效伤害。这是今天最有价值的结果，因为它证明了外部视觉链路，而不是游戏内置 AI 的偶然行为。

## 最终结果

| 项目 | 结果 |
| --- | --- |
| 外部瞄准认领 | `TargetMode=90`，验证通过 |
| 炮塔响应 | 测试角从 -90 度转到 45 度，实际变化 135 度 |
| 图像来源 | 游戏共享内存帧流正常，且帧写入进程身份匹配 |
| 不发射闭环 | 5,401 帧，检测率 92.0%，持续跟踪，无射击 |
| 第一轮开火 | 100 发，53 次有效伤害，HP 1500 到 440，命中率 53.0% |
| 第二轮开火 | 66 发，22 次有效伤害，HP 440 到 0，击毁前哨站 |
| 安全交还 | 退出时确认 `AITargetMode` 已恢复，外控权已释放 |

## 我实际搭了什么

项目运行在 Windows 上，复用真实 RoboMaster 自瞄的检测、PnP、跟踪、瞄准和射击模块，只把输入输出换成了游戏：

```text
Gestalt 游戏渲染画面
  -> 共享内存读取图像与同帧相机姿态
  -> YOLO 检测装甲板
  -> PnP 还原目标三维位置
  -> EKF 估计旋转目标状态
  -> Aimer 计算 yaw / pitch 与提前量
  -> WebSocket 发送 RBExtAim
  -> 游戏云台转动、开火、扣除目标 HP
```

代码位置也很清楚：

| 目录/文件 | 负责什么 |
| --- | --- |
| `src/gestalt.cpp` | 仿真主程序，组织建模、接管、检测和测试流程 |
| `io/gestalt/` | WebSocket 控制与共享内存取帧 |
| `tasks/auto_aim/` | 检测、跟踪、解算、瞄准、射击算法 |
| `configs/gestalt_sentry_outpost.yaml` | 前哨站基准场景的参数 |

## 关键排查：程序在动，不等于外控真的生效

今天最重要的坑在于，早期日志里已经能看到炮塔转动和伤害，但这还不足以证明外部自瞄接管成功。游戏自带 AI 也会扫描和开火，可能制造“好像跑通了”的假象。

真正的验收点是：

```text
post-claim diag: TargetMode=90 ... verified=true
turret test result: before=-90.0 after=45.0 delta=135.0
```

其中 `ExtAimClaim` 是对外部瞄准控制权的认领；`TargetMode=90` 表示游戏已把瞄准权交给视觉程序。之后主动发一个大角度命令并读取实际炮塔角度，才能确认命令确实改变了云台。

这个问题最终定位到游戏启动参数。游戏必须带：

```text
-externalvisioncontrol -visionbridge -wsbind=127.0.0.1
```

- `-externalvisioncontrol`：开放最小的外部视觉控制白名单。
- `-visionbridge`：建立游戏画面的共享内存帧流。
- `-wsbind=127.0.0.1`：把控制 WebSocket 限制在本机。

此外，控制端口每次启动可能不同，不能机械复用旧日志里的端口号。本次运行的 AttributeMap 控制端口是 `29662`；把错误端口传给桥程序，表面上能建立连接，却不会获得需要的状态和控制能力。

## 从 C++ 语法到自瞄原理

我目前只学过 C++ 语法，因此把整件事拆成了下面几个可以逐步理解的问题。

### 1. YOLO 在做什么

YOLO 输入一张图片，输出“哪些区域像装甲板”。它给出候选框、类别和置信度，但它不知道目标离我多远，也不会直接给云台角度。

### 2. PnP 为什么存在

图像坐标是二维的，而云台需要朝三维空间里的目标转动。PnP 利用装甲板的真实尺寸、角点在图像中的位置，以及相机内参，推回目标相对相机的三维位置。

可以把它理解为：同一个装甲板在图像里更小，通常意味着它更远；但要把这种直觉变成可用坐标，必须经过相机模型计算。

### 3. EKF 为什么比单帧检测更可靠

检测会抖动，也会偶尔漏掉装甲板。EKF 会保存对目标位置、速度和旋转状态的估计：有新检测时修正，没有检测时继续预测。

前哨站是旋转目标，本次日志稳定估计到角速度约 `2.51 rad/s`。这使系统不只是“看见以后再追”，而能预测装甲板下一刻会出现在哪里。

### 4. 瞄准不是把准星对准当前画面

子弹飞向目标需要时间，云台本身也有响应时间。因此真正的目标角度更接近：

```text
射击角度 = 目标在未来某一时刻的位置对应的角度
```

`Aimer` 负责把目标预测位置变成 yaw 和 pitch；`Shooter` 只在瞄准误差足够小时允许 `fire=true`。最后，`RBExtAim` 才把命令送进游戏。

## 一次可复现的运行顺序

1. 启动游戏，并确保带上三个外部视觉参数。
2. 找到这次游戏实例的 AttributeMap WebSocket 端口。
3. 先运行 `--fire=0`：检查 `TargetMode=90`、炮塔响应、帧数和检测率。
4. 再运行 `--fire=1`：检查 `shots`、目标 HP 和 `damage_dealt`。
5. 退出时检查 `release_restored=true`，确认控制权交还给游戏。

运行程序时还要把 vcpkg 与 OpenVINO DLL 目录放在 `PATH` 最前面；否则 Windows 可能加载到不兼容版本的运行库，表现为 `0xC0000139` 启动失败。

```powershell
$env:PATH = 'C:\dev\vcpkg\installed\x64-windows\bin;C:\Users\17859\AppData\Local\Programs\Python\Python314\Lib\site-packages\openvino\libs;' + $env:PATH
$env:OPENCV_IO_ENABLE_OPENEXR = '0'
cd C:\Users\17859\sp_vision_25_gestalt_system_bridge
.\build\gestalt.exe <ws_port> configs\gestalt_sentry_outpost.yaml --setup=1 --fire=1 --timeout=180 --showui=0
```

## 接下来怎么学

接下来不急着改复杂算法，先按这个顺序补基础：

- 复跑一次不发射和开火测试，只观察日志与游戏画面。
- 从 `src/gestalt.cpp` 的主流程开始读，理解各阶段如何串联。
- 再读 `io/gestalt/game_link.cpp`，搞清 WebSocket、AttributeMap 和控制权。
- 最后进入 `tasks/auto_aim/`，依次看检测、PnP、EKF 和 Aimer。

这样每补一个知识点，都能在已经跑通的系统中找到对应的位置。比起先硬啃完整代码，学习路径会更具体。

## 一句话

今天真正跑通的不是“一个会动的演示”，而是一条经过控制权、炮塔响应、图像来源和游戏伤害共同验证的自瞄闭环。
