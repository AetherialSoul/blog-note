# 2026-07-24：搭建 RoboMaster 自瞄仿真环境

今天用 AI 辅助，从零搭建了同济 SuperPower 战队 25 赛季自瞄系统的 Windows 仿真环境，并跑通了完整的自瞄开火测试。虽然大部分操作是 AI 执行的，但过程中学到了很多关于项目架构、编译流程和自瞄原理的知识。

## 做了什么

### 环境搭建

整个项目依赖链比较长，涉及多个工具和库：

- **Visual Studio 2026 Build Tools**：提供 MSVC 编译器（`cl.exe`、`link.exe`）
- **vcpkg**：C++ 包管理器，用来安装 OpenCV、fmt、spdlog、Eigen、yaml-cpp
- **easywsclient**：轻量 WebSocket 客户端库，桥程序通过它和游戏通信
- **OpenVINO**：Intel 的神经网络推理引擎，用来跑 YOLO 检测模型

这些依赖在 Windows 上手动配确实繁琐，尤其是 vcpkg 编译 OpenCV 要好几分钟。

### 编译过程

项目用 CMake 构建，但 Windows 上不能直接 `cmake -B build`，需要额外指定：

1. vcpkg 的 toolchain 文件（让 CMake 知道去哪找库）
2. Eigen 的头文件路径（vcpkg 装的 Eigen 和项目预期的路径不一致）
3. easywsclient 的源码路径
4. OpenVINO 的 cmake 路径

编译命令：
```powershell
cmake -S . -B build -G "NMake Makefiles" ^
  -DCMAKE_TOOLCHAIN_FILE=C:\dev\vcpkg\scripts\buildsystems\vcpkg.cmake ^
  -DGESTALT_EIGEN_INCLUDE=C:\dev\vcpkg\installed\x64-windows\include\eigen3 ^
  -DGESTALT_EXTRA_INCLUDE=C:\dev ^
  -DGESTALT_EASYWS_DIR=C:\dev\easywsclient ^
  -DOpenVINO_DIR=<python_site_packages>/openvino/cmake

cmake --build build --target gestalt
```

中间遇到几个坑：
- ATL 头文件报错 → 改用 WRL（Windows Runtime C++ Template Library）
- 游戏 Qt 窗口崩溃 → 加 `--showui=0` 参数
- 哨兵属性等待超时 → 加了 10 秒重试机制

### 仿真测试

游戏启动后创建 RMUC2026 对局，停在 Prepare 阶段，然后运行桥程序：

```powershell
.\build\gestalt.exe <ws_port> configs\gestalt_sentry_outpost.yaml --setup=1 --mode=ekf --fire=1 --timeout=120
```

最终结果：

| 指标 | 值 |
|------|-----|
| 检测率 | 86.6% |
| 命中率 | 54.0% |
| EKF 角速度估计 | w=2.51 rad/s（实际 2.51） |
| 前哨站 HP | 1500 → 420 |
| 造成伤害 | 1080 |
| 子弹出膛 | 100 发 |

前哨站在仿真里会以 ±144°/s 旋转，自瞄系统需要实时估计旋转角度并计算提前量。54% 的命中率比基线（49%）略高，说明系统工作正常。

## 学到的东西

### 项目架构

这个项目的代码分层很清晰：

```
src/gestalt.cpp          ← 主循环，串联所有模块
tasks/auto_aim/          ← 自瞄算法（检测、跟踪、解算、瞄准、开火）
io/gestalt/              ← 游戏 I/O（WebSocket、共享内存帧捕获）
tools/                   ← 工具库（EKF、数学、日志）
configs/                 ← YAML 配置文件
```

数据流是：
```
游戏画面 → YOLO 检测装甲板 → 匹配装甲板 ID → EKF 跟踪目标状态 → 计算瞄准角度 → 开火决策 → WebSocket 发送命令
```

### 自瞄原理

读了 readme 里的"轨迹视角下的自瞄理论"，核心思想是：

- **传统方法**：检测到装甲板 → 算当前位置 → 瞄准当前位置（有延迟）
- **轨迹规划**：预测目标未来轨迹 → 计算子弹飞行时间 → 瞄准未来位置 → 同时考虑云台控制能力

关键公式：`yaw_shoot(t) = yaw_target(t + t_fly)`，即射击角度要提前 `t_fly` 时间。

### bench 测试流程

仿真不是直接开打，而是有严格的 gate 机制：

1. 生成哨兵车辆（Respawn）
2. 等待属性就绪（class、team、hp）
3. 导航到指定位置（outpost-lob 点）
4. 认领外部瞄准（ExtAimClaim）
5. 布置相机参数（armLength:0 收回吊臂）
6. 开始比赛（SetMatchStatus 1）
7. 连续帧检测 + EKF 跟踪 + 自动开火
8. 超时后释放控制权

任何一步失败都会安全退出，不会卡死游戏。

## 作为新人的感受

虽然今天大部分操作是 AI 完成的，但过程中被迫理解了很多概念：

- 为什么需要 vcpkg 而不是直接下载 dll
- CMake toolchain 文件是什么
- WebSocket 在这个系统里扮演什么角色
- EKF 为什么能估计旋转角速度
- bench 测试的 gate 机制为什么这么复杂

下一步应该自己从零复现一遍，把每个步骤的理解夯实。

## 接下来

- [ ] 自己从零搭建编译环境（不用 AI 辅助）
- [ ] 读 `src/gestalt.cpp` 主循环，理解状态机
- [ ] 读 `tasks/auto_aim/target.cpp`，理解 EKF 跟踪
- [ ] 改 `min_confidence` 参数，观察检测率变化
- [ ] 读"轨迹视角下的自瞄理论"，理解轨迹规划器

## 一句话

仿真跑通了，但真正的学习从现在开始——自己动手复现一遍，比看 AI 做十遍都有用。
