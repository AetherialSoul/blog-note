# TACO 阅读笔记：同一帧 LiDAR，为什么定位和检测既要共享又要分开

读 TACO 时，我一开始只抓住了“定位和检测一起做，可以减少计算”这条线。继续往下读才发现，论文真正想解决的不是简单地把两个任务塞进一个网络，而是一个更麻烦的问题：它们明明使用同一份 LiDAR 点云，想从中保留的信息却不完全一样。

定位希望找到长期稳定的地理结构，检测则要关注车辆、行人和骑行者。正在行驶的汽车对检测很重要，对定位却可能是动态噪声；停在路边的汽车此刻是静态的，但也不应该被当成永久地标。TACO 就在这种“可以协同，又会冲突”的关系里设计共享和解耦。

这篇笔记记录我这次具体卡住和逐步弄懂的地方，重点是 shared backbone、Task-Aware Contrastive Learning、三种很像的缩写、RANSAC、OxfoLD 和实验。它不是完整复现，也不把论文没有验证的想法写成结论。

论文入口：[CVPR 2026 页面](https://openaccess.thecvf.com/content/CVPR2026/html/Xing_TACO_Task-Aware_Contrastive_Learning_for_Joint_LiDAR_Localization_and_3D_CVPR_2026_paper.html)、[PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Xing_TACO_Task-Aware_Contrastive_Learning_for_Joint_LiDAR_Localization_and_3D_CVPR_2026_paper.pdf) 和[项目仓库](https://github.com/xmuxly/TACO)。

## 论文要解决的不是“两个任务共用一个数据集”

LiDAR localization 要回答：

> 我在地图中的哪里，朝向是什么？

3D object detection 要回答：

> 周围有哪些目标，它们在三维空间中的位置、尺寸、朝向和类别是什么？

传统系统可以分别为两个任务准备一条流水线：各自处理同一帧点云，各自提取特征，再分别输出位姿和三维框。这样比较直接，但会重复做体素化和大部分 3D 特征提取，也缺少跨任务的信息交换。

我最开始把它概括成“同一数据集减少计算成本”，并不准确。真正被复用的是**同一份 LiDAR 输入上的 backbone 计算**，不是“数据集”这个概念本身。

```text
原来：
LiDAR → backbone A → localization
LiDAR → backbone B → 3D detection

TACO：
                    ┌→ localization-aware features → localization head
LiDAR → shared 3D backbone
                    └→ detection-aware features    → detection head
```

论文把前半段叫 Task-Agnostic Feature Extraction（TAFE）：先提取两个任务都能用的底层表示。后面的对比学习阶段再告诉网络，哪些特征应该靠近，哪些应该分开。

所以 shared backbone 的价值有两层：

- 复用点云编码和特征提取，减少两套独立网络的冗余；
- 给两个任务一个交换信息的公共入口。

但共享结构不等于所有特征都要混在一起。论文的实验支持联合学习有效，却没有给我一个“真实部署一定快多少”的直接答案；端到端延迟还会受到体素化、两个任务头、RANSAC 和硬件实现影响。

## Localization 和 detection 为什么能互相帮助

这两个任务有冲突，也有互补。

检测可以给定位提供对象层面的线索：哪些点来自会移动的目标，不应该被当成稳定地图结构。定位则能给检测提供更稳定的空间背景，帮助模型减少把路缘、墙面等静态结构误检成目标的情况。

我现在用下面这组关系记：

```text
Detection → “这是车 / 人，可能会动，定位别太信它”
Localization → “这是稳定空间背景，检测别把背景当目标”
```

普通多任务学习可能只写成：

```text
L = L_det + L_loc
```

但这样只规定了两个输出都要学好，没有直接规定中间特征怎样处理任务冲突。TACO 额外加入三种对比学习约束，总损失可以概括为：

```text
L = λ₁L_det + λ₂L_loc
  + λ₃L_ITCL + λ₄L_ILCL + λ₅L_IDCL
```

这也是题目里 Task-Aware 的关键：相似性的规则由任务决定，不是把所有东西统一拉近。

## 对比学习先记“拉近谁、推远谁”

特征可以看成网络为一块点云生成的向量。两个向量方向越接近，可以认为表示越相似。论文会使用 cosine similarity：

```text
sim(a, b) = (a · b) / (||a|| ||b||)
```

我不需要先背完整损失，只要先回答：

> 对当前任务而言，谁应该像，谁不应该混在一起？

TACO 的三种模块分别处理任务之间、检测内部和定位内部的关系。

| 模块 | 层级 | 比较的特征 | 目标 |
| --- | --- | --- | --- |
| ITCL | 两个任务之间 | geographic features 与动态/可移动目标特征 | 推远 |
| IDCL | detection 内部 | 同类别的动态与静态目标 | 拉近 |
| IDCL | detection 内部 | 不同类别的目标 | 推远 |
| ILCL | localization 内部 | 真正地理特征与 pseudo-geographic features | 推远 |

三个缩写很接近，我最后不背长全称，只记这句：

> **T：两个任务别混；D：同类目标抱团；L：定位别信假地标。**

再短一点就是：

```text
I-T：任务间，分
I-D：检测内，聚
I-L：定位内，辨
```

## ITCL：共享 backbone，但任务偏好要分开

ITCL 是 Inter-Task Contrastive Learning。定位分支需要的 geographic features，代表建筑、道路结构和固定设施等长期稳定的空间信息；检测分支需要 object features，尤其要保留动态目标的信息。

论文从 localization feature map 中按特征的 L2 norm 排序，选出更显著的 geographic features；目标特征则借助 3D 目标 ground truth 提取。ITCL 计算这些特征之间的 cosine similarity，并让地理特征与可移动目标特征保持低相似度。

```text
稳定建筑 / 道路结构  ← 推远 →  行驶中的车 / 行人
       定位偏好                         检测偏好
```

这里的 disentangle 不是把两个网络彻底拆开，而是：

> 底层表示共享，任务特定的偏好适当解耦。

这修正了我最开始的一个误解：协同并不等于所有 feature 都应该拉近。

## IDCL：检测时，“动不动”不应盖过“它是什么”

IDCL 是 Intra-Detection Contrastive Learning。论文根据连续 LiDAR 帧匹配得到的速度，把目标分成：

```text
v > 0.5 m/s   → dynamic object
v ≤ 0.5 m/s   → static object
```

对于检测任务，一辆正在开的车和一辆停着的车都属于 Vehicle。网络不应该只因为运动状态不同，就把同类目标学成两种完全不同的表示。

```text
moving car  ← 拉近 →  parked car
car         ← 推远 →  pedestrian
```

论文设计了 dynamic-to-static 和 static-to-dynamic 两个对称方向：动态目标找同类别静态目标作为正样本、其他类别作为负样本，静态目标再反过来找动态目标。

所以 IDCL 的目标不是忽略运动，而是让检测特征首先回答“它是什么”。

## ILCL：停着的车为什么是 pseudo-geographic feature

ILCL 是 Intra-Localization Contrastive Learning，也是我最容易绕晕的一部分。

一辆停在路边的车，在当前几帧中可能完全不动。如果定位分支只看“现在是否静止”，它就可能把这辆车当成稳定地标。可是第二天它开走后，地图中的这部分对应关系就不存在了。

```text
今天：建筑 | 停车车辆 | 路缘
明天：建筑 |          | 路缘
```

论文把这种**暂时静止、看起来像地理结构，但本质上可以移动**的表示叫 pseudo-geographic feature。ILCL 从 static object 的 ground-truth box 对应位置提取这类特征，再和显著的真正 geographic features 做对比，让二者的 cosine similarity 降低。

```text
长期稳定结构  ← 推远 →  暂时静止的可移动物体
 geographic                pseudo-geographic
```

同一辆停车汽车在两个模块里的身份正好相反：

- 对 IDCL：它和行驶中的汽车同类，应该拉近；
- 对 ILCL：它不是建筑或固定道路结构，应该和真地标推远。

这就是我认为 TACO 最漂亮的地方：**同一个样本应该靠近谁，不由它的表面状态单独决定，而由任务目标决定。**

还要注意，geographic feature 不是人工给每个建筑都画一个“地理框”。论文从定位特征图中选择显著响应；object 和 pseudo-geographic feature 的构造则较强地依赖 3D box、类别与运动状态等监督。

## 从一帧点云到最终结果，我现在这样串起来

```text
LiDAR points
    ↓
TAFE：shared 3D backbone，复用底层计算
    ↓
localization-aware / detection-aware features
    ↓
┌──────────────────┬──────────────────┐
│ ITCL：任务之间分 │                  │
│ ILCL：定位内辨真 │ IDCL：检测内聚类 │
└────────┬─────────┴────────┬─────────┘
         ↓                  ↓
 localization head     detection head
         ↓                  ↓
      RANSAC             3D boxes
         ↓
   final global pose
```

对比学习约束主要发生在训练阶段。推理时不需要人工再指定谁是正样本、谁是负样本；网络直接输出两个任务的结果，定位分支再经过 RANSAC。

## RANSAC：神经网络给候选，几何方法清掉离群匹配

定位需要根据当前扫描和地图之间的对应关系估计位姿，但候选对应不可能全部正确：

```text
A ↔ A'
B ↔ B'
C ↔ X    ← 错匹配 / outlier
D ↔ D'
```

RANSAC（Random Sample Consensus）会反复随机抽取一小组对应，计算候选位姿，再检查这个位姿能解释多少其他对应。支持该模型的是 inliers，明显不一致的是 outliers，最后保留一致性较高的结果。

```text
随机采样对应 → 估计候选位姿 → 统计 inliers
       ↑                           ↓
       └──────── 多次重复 ←────────┘
                    ↓
             选一致性最好的位姿
```

因此 TACO 不是“一个网络端到端包办全部几何”。学习到的 feature 和 correspondence 给出候选，RANSAC 在推理阶段负责提高最终位姿估计对错匹配的鲁棒性。

论文报告的 `0.72 m / 0.85°` 分别是平均位置误差和平均朝向误差，不是检测 AP。检测则使用 Vehicle AP@0.5 等指标，两类数字不能混在一起比较。

## OxfoLD、traversal 和为什么要做新数据集

联合任务不仅需要定位 ground truth，还需要每帧丰富的 3D object annotations。很多定位数据有多次行驶轨迹，却没有完整三维框；检测数据有三维框，却不一定适合跨时间重定位。

TACO 因此提出 OxfoLD。它基于 Oxford 的多次行驶 LiDAR 数据构建，覆盖约 80 km，给 315k 帧加入 3D 标注，并保留不同时间和天气条件下的多 traversal 信息。

这里的 traversal 可以理解成：

> 在某个时间、天气和交通状态下，把同一片区域完整走过并采集一次。

```text
Traversal A：白天 / 晴天 / 路边有车
Traversal B：夜间 / 雨天 / 路边没车
Traversal C：另一天 / 交通状态又变化
```

多 traversal 才能真正检验：模型有没有学到长期稳定的空间结构，而不是记住某一天临时出现的车辆。OxfoLD 的作用不只是“数据更多”，而是让 localization 和 detection 第一次能在同一套大规模监督下联合训练和评估。

3D box 可以用一个简化形式理解：

```text
box = (x, y, z, l, w, h, θ)
       中心位置   尺寸      朝向
```

这些标注也是 TACO 当前能力与限制同时产生的地方：丰富监督让三种 feature 分组成为可能，但标注成本很高。

## pseudo-relocalization protocol 不是“伪造定位结果”

真正的 relocalization 是：系统以前在这里建立过参考，过一段时间再次来到附近，要根据当前扫描重新判断全局位姿。

nuScenes 和 KITTI-360 并不是专门按这个任务组织的多 traversal 定位数据。为了检查跨数据集泛化，论文人为构造接近重定位的 reference/query 关系，因此称 pseudo-relocalization protocol。

nuScenes 使用 5 帧滑动窗口：

```text
frame 1  frame 2  frame 3  frame 4  | frame 5
└────────── training references ────┘ | query
```

KITTI-360 则选择重访区域：测试帧需要距离某个训练帧 5 m 以内，同时在时间上至少相隔 30 s。

“pseudo” 指评测对是按规则构造出来的，不是模型输出或 ground truth 是假的。它让原本不完全适合重定位的数据也能用于测试，但仍不能等同于机器人隔几个月、跨季节、场景明显变化后的长期重定位。

## 实验先看联合训练是否真的互相帮助

我最关心的第一个问题是：把两个任务放在一起，到底只是省一套 backbone，还是性能也会变好？

论文的 single-task / joint-training 对比给出了比较直接的结果：

| 训练方式 | Localization error | Vehicle AP@0.5 |
| --- | ---: | ---: |
| Localization-only | 0.95 m / 1.14° | — |
| Detection-only | — | 60.01% |
| Joint TACO | 0.72 m / 0.85° | 81.60% |

这说明在本文的模型和 OxfoLD 设定下，共享与任务感知约束不仅减少结构冗余，还让两个任务都从对方的信息中受益。它不是普遍的“multi-task 一定更好”定律，结论仍然受数据、损失权重和任务关系限制。

## 消融实验告诉我每个模块在做什么

消融实验就是把模块逐个加入或拿掉，观察指标怎样变化。TACO 以纯定位方法 LiSA 为 baseline，加入检测头，再分别测试三种对比学习模块。

| 配置 | Position / orientation error | Vehicle AP@0.5 | 我从中读到的作用 |
| --- | ---: | ---: | --- |
| Baseline | 0.95 m / 1.14° | — | 纯定位起点 |
| + DET | 0.89 m / 1.06° | 72.54% | 只加入检测任务，定位已经受益 |
| DET + ITCL | 0.82 m / 0.99° | 75.32% | 任务间解耦，两边都改善 |
| DET + IDCL | 0.85 m / 0.93° | 77.45% | 检测内部按类别对齐，AP 提升明显 |
| DET + ILCL | 0.76 m / 0.89° | 76.21% | 排斥伪地理特征，对定位帮助明显 |
| Full TACO | 0.72 m / 0.85° | 81.60% | 三种约束一起效果最好 |

中间的 ITCL、IDCL、ILCL 三行是分别在 `DET` 上加入单个模块，不是按表格顺序一路累加。完整 TACO 才是三者都打开。

相对纯定位 baseline，完整模型的位置误差下降 24.21%，朝向误差下降约 25.44%。检测主结果中，TACO 的 Vehicle AP@0.5 为 81.60%；论文也分别报告了 Pedestrian 和 Cyclist 的结果。

还有一个 traversal 数量实验：随着用于训练的 traversal 增多，LiSA 和 TACO 的定位都变好；使用 4 条时，TACO 达到 `0.72 m / 0.85°`，LiSA 是 `0.95 m / 1.14°`。这支持 TACO 能利用跨时间扫描，但也说明性能仍然受可用 traversal 和数据覆盖影响。

最后，论文在 nuScenes 和 KITTI-360 的 pseudo-relocalization 设定下也与多任务方法比较，结果继续优于 LiDARFormer。这个实验主要用于说明方法不只在 OxfoLD 上有效；由于评测协议是人为构造的，不能把它夸大成所有真实长期定位场景都已解决。

## 当前边界：论文明确写的，和我从实验中看到的

论文明确写出的 limitation 是：方法依赖**多 traversal LiDAR 扫描和丰富的 3D bounding boxes**。作者把使用更少标注、甚至只用单 traversal 数据完成统一感知，列为未来方向。

在这条明确限制之外，我还从任务和实验设计中看到几条边界。下面是我的分析，不是作者原话：

- 当前核心是 LiDAR-only 的定位与检测联合学习，没有处理 Camera、Radar、VLM 等多模态融合；
- dynamic / static 分组和 pseudo-geographic feature 构造依赖 3D 标注、类别和连续帧运动信息，换到弱标注数据并不直接成立；
- nuScenes 与 KITTI-360 使用 pseudo-relocalization，和跨月、跨季节、道路结构发生变化的长期定位仍有差距；
- 两个任务互补，不代表继续加入 segmentation、tracking、occupancy 后一定更好，任务冲突和 loss 权重还要重新设计；
- RANSAC 能清理一部分离群对应，但不是对所有地图变化、传感器退化和错误匹配都有效。

这些边界让我更清楚 TACO 的贡献范围：它很好地回答了“定位与检测怎样共享又解耦”，但没有完成一个全传感器、全场景的自动驾驶感知系统。

## 和上一篇 V2U4Real 放在一起看

[上一篇 V2U4Real 笔记](/blog/2026-09-18-v2u4real-reading-notes)研究的是地面车辆与无人机怎样共享观测，重点在跨 Agent、跨视角、通信和时空对齐。TACO 研究的是一个 LiDAR 系统内部怎样让定位与检测共用表示，重点在跨任务协同和特征冲突。

```text
V2U4Real：多个 Agent 怎样一起看世界
            ↓ multi-agent perception

TACO：一个 Agent 的多个任务怎样一起理解点云
            ↓ multi-task perception
```

两篇论文虽然层级不同，都在回答一个相似的问题：

> 什么信息值得共享，什么信息必须保持区别？

V2U4Real 中，共享太少会丢掉另一视角的线索，共享太多又会增加通信量，并放大 pose error 和 async 的影响。TACO 中，完全分开会重复计算、失去互补，简单混合又会让动态目标污染定位特征。

这条线还可以继续往前延伸：

```text
single-agent / multi-task
          ↓
multi-agent / multi-view
          ↓
multi-agent / multi-modal / planning
```

## 和 RM 雷达、3D 感知路线的联系

RM 雷达站或自瞄系统也会遇到 detection、localization、tracking、coordinate transform 和 sensor fusion。TACO 最直接对应的是前两个：系统既要知道目标在哪里，也要知道自己或传感器在统一坐标系中的位姿。

我能把两篇论文和 RM 的技术链先这样对上：

```text
Camera / LiDAR / Radar
        ↓
Detection → Tracking → Trajectory
        ↓
Calibration / Coordinate Transform / Localization
        ↓
统一世界坐标中的目标状态
```

V2U4Real 提醒我，多传感器或多机器的信息先要处理坐标、时间和通信；TACO 提醒我，即使只看同一帧点云，多任务也不是简单共享 feature，而要区分稳定背景、动态目标和暂时静止目标。

不过这不意味着把 TACO 代码直接搬进 RM 就能工作。赛场尺度、传感器配置、目标类别、实时预算和可获得标注都不同。更现实的学习目标是先做到：

- 分清检测输出和定位输出的指标；
- 能在连续帧里判断动态与静态目标；
- 理解坐标变换后，哪些观测可以被当成稳定参考；
- 遇到误检或定位漂移时，能判断是特征、匹配、时间还是几何后处理出了问题。

## 这次我真正带走的东西

回头看，我最初记住的是“同一份 LiDAR 可以省计算”，但现在更想保留下面这句话：

> **TACO 让 LiDAR 定位和 3D 检测共享底层 backbone，再用任务感知对比学习处理二者的特征冲突：定位依赖长期稳定的地理结构，检测依赖目标特征；停车车辆在检测中应和行驶车辆靠近，在定位中却要和真地标分开。**

如果以后忘掉缩写，我至少应该还能回答：

- 为什么 shared backbone 不等于所有 feature 混在一起；
- 为什么 moving car 对 detection 是信息，对 localization 可能是噪声；
- 为什么 parked car 是 pseudo-geographic feature；
- ITCL、IDCL、ILCL 分别在“任务间分、检测内聚、定位内辨”；
- 为什么最后还要 RANSAC；
- OxfoLD 和 pseudo-relocalization protocol 各自补了什么评测空缺。

从 V2U4Real 到 TACO，我开始感觉 3D perception 不只是“换一个更强的 detector”。真正进入机器人系统后，还要同时处理自己在哪里、周围有什么、什么在动、不同任务和不同 Agent 怎样共享信息。对我现在的阶段，先把这些问题之间的关系讲清楚，比背住所有网络名字更重要。
