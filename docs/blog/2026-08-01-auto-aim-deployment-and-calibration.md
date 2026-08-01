# 2026-08-01：上位机部署与相机标定准备

今天主要做了两件事：把视觉上位机部署到 NUC，并按调车前顺序验证编译、视频、虚拟云台和串口协议。相机标定也重新梳理了一遍，确认标定必须使用与相机驱动和参数格式匹配的项目包。

## NUC 部署

项目部署在 NUC 的独立目录中，原始项目目录没有改动。上位机使用 `deployment/20260801-cpu-onnx` 分支，推理后端改为 OpenCV DNN CPU，构建产物为：

```text
/home/rcs/deployments/SHtech_auto_aim-20260801/SHtech_auto_aim/build_nuc_protocol_20260801/auto-aim
```

部署过程保留了 Git 回滚点：

```text
7f3bc85  deployment: validate XUC protocol and NUC runtime
d3e2c5a  tools: add calibration image capture
67e8cb5  tools: support headless calibration capture
```

采集工具是独立目标，不会启动自瞄主程序，也不会给云台发送控制命令。

## 调车前测试

编译通过：

```text
[100%] Built target auto-aim
```

视频冒烟测试使用打包的 `test.avi`，视频初始化和线程退出正常，运行过程中没有发送开火指令。测试帧率根据运行时负载约为 `8–18 FPS`。

虚拟云台使用 `MockDriver`，注入的数据是：

```text
yaw=0
pitch=0
robot_speed=28 m/s
fire=0
```

它可以验证视觉流水线和消息桥接，但不代表真实云台姿态。

XUC 协议回环测试通过：

```text
status frame: 12 bytes
control frame: 22 bytes
header: SP
baudrate: 460800
CRC16: low byte first
```

PTY 真驱动测试也通过，控制帧能够发送，但在没有真实 IMU 姿态时强制保持 `control=0`，避免误控真实云台。

目前协议状态帧没有 `imu_yaw` 和 `imu_pitch`。因此真实闭环前还需要电控确认 IMU 上行协议。下位机代码中 `GetImuPitch()` 返回 yaw 字段的问题也需要一起复核。

## 相机标定踩坑

今天的标定问题不是棋盘格本身，而是相机驱动和标定流程混用了：

- 同济代码默认使用迈德威视相机，和当前的海康相机 SDK 不匹配。
- 同济和上科大的流程没有直接使用 ROS 2 通用标定工具。
- 当前项目的相机参数文件、坐标系和标定脚本是项目内约定，不能拿另一份代码的输出直接替换。

这次问题说明，标定前要先确认三件事：相机型号和 SDK、当前包的采集入口、参数文件中的字段和坐标方向。标定必须在对应包内完成，不能只因为工具名字相同就混用。

## 当前项目的标定入口

部署版的海康采集工具复用了当前项目的 Hikrobot 驱动。它按 `MV_USB_DEVICE` 枚举 USB 相机，不是网口相机入口。无屏幕采集可以通过 Remote-SSH 执行：

```bash
cd /home/rcs/deployments/SHtech_auto_aim-20260801/SHtech_auto_aim
./build_calibration_capture_20260801/sensor/calibration_capture \
  --headless --count 20 --interval-ms 1000 \
  --output /home/rcs/deployments/SHtech_auto_aim-20260801/runtime_virtual/handeye_calibration_data
```

程序只保存识别到 `9×10` 内角点棋盘格的原图：

```text
frame_001.png
euler_001.txt
```

当前 `euler` 文件默认写入虚拟 `0 0 0`。这可以占位并验证流程，也可以用于准备相机内参图片，但不能用于求真实手眼外参。

## 配置文件检查

当前 `launch.cfg` 指向：

```text
asset/camParam/cam_param_hik1_.yml
```

这个文件包含：

```text
K       3×3 相机内参矩阵
D       1×5 畸变参数
R_c2i   3×3 相机到 IMU 的旋转矩阵
T_c2i   3×1 相机到 IMU 的平移向量
```

配置格式和数值类型可以正常读取，当前 `K/D` 也都是有限值。但 `R_c2i` 是单位矩阵，`T_c2i` 是零向量，所以外参目前仍是占位状态。配置能被程序读取，不等于标定数值已经正确；内参还需要用棋盘格图片和重投影误差验证。

内参标定不需要云台姿态：固定相机，移动棋盘格拍多张图片，再由 OpenCV 自动计算 `K/D`。外参或手眼标定需要每张图片对应的真实 `yaw/pitch/roll`，不能把虚拟角度直接当成真实结果。

## 陀螺仪串口

电控提供的信息是：云台陀螺仪直接连接步兵小电脑，波特率为 `460800`。正常情况下可以通过下面的命令看到两个 USB 串口：

```bash
ls /dev/ttyUSB*
```

一个应是下位机，另一个应是陀螺仪。下一步先逐个确认设备身份，再以只读方式测试是否能收到数据，不发送控制帧。能读到字节还不代表已经解析出 yaw/pitch，还需要确认陀螺仪的数据帧格式。

## 下一步

1. 接入正确型号的海康 USB3 相机，先验证当前包能枚举和读取图像。
2. 用对应包采集 15～20 张棋盘格图片，计算并验证 `K/D`。
3. 电控确认陀螺仪串口设备和数据协议后，再接入真实姿态。
4. 用真实姿态重新做手眼外参，确认坐标方向后再更新 `R_c2i/T_c2i`。
5. 真实云台空载测试前继续保持虚拟云台和 `fire=0`。

今天的测试证明了软件能在无下位机条件下编译、跑视频并完成协议回环；相机内参和真实云台外参仍需要真实硬件数据，不能用虚拟状态代替。
