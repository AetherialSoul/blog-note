# MSGNav 与 TACO 阅读笔记事实核查

核查日期：2026-09-21
核查范围：`docs/blog/2026-09-20-msgnav-reading-notes.md`、`docs/blog/2026-09-18-taco-reading-notes.md`，以及三篇文章的时间线描述。
总体置信度：**高**。关键论文身份、方法模块、数据集规模、指标和公开时间均与论文主页、原文或补充材料相符。关于真实部署能力和跨数据集泛化的判断在文中标为个人问题或推论，没有写成论文已证明的结果。

## MSGNav 阅读笔记

| 核查的主张 | 分类 | 来源与结果 | 处理 |
| --- | --- | --- | --- |
| 论文标题为 *MSGNav: Unleashing the Power of Multi-modal 3D Scene Graph for Zero-Shot Embodied Navigation*，收录于 CVPR 2026 | 可核实硬事实 | [CVPR 2026 论文主页](https://openaccess.thecvf.com/content/CVPR2026/html/Huang_MSGNav_Unleashing_the_Power_of_Multi-modal_3D_Scene_Graph_for_CVPR_2026_paper.html)列明标题、会议和年份。已确认。 | 保留 |
| arXiv 预印本于 2025-11-13 首次提交 | 可核实硬事实 | [arXiv:2511.10376](https://arxiv.org/abs/2511.10376)列明首次提交日期。已确认。 | 保留 |
| 零样本语境指不针对每个导航任务单独训练策略；系统仍使用预训练视觉基础模型和视觉语言模型 | 可核实软事实 | [CVPR 论文摘要](https://openaccess.thecvf.com/content/CVPR2026/html/Huang_MSGNav_Unleashing_the_Power_of_Multi-modal_3D_Scene_Graph_for_CVPR_2026_paper.html)将零样本与任务特定 RL 训练作对照；[补充材料](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Huang_MSGNav_Unleashing_the_CVPR_2026_supplemental.pdf)说明通过 VFMs 构建图并由 LLM 推理。已确认，避免把“零样本”写成“从未训练过”。 | 保留并加限定 |
| M3DSG 以动态图像作为关系线索，降低纯文本场景关系造成的视觉证据损失 | 可核实软事实 | [CVPR 论文摘要](https://openaccess.thecvf.com/content/CVPR2026/html/Huang_MSGNav_Unleashing_the_Power_of_Multi-modal_3D_Scene_Graph_for_CVPR_2026_paper.html)说明以动态分配图像替代文本关系边。已确认。 | 保留 |
| KSS、AVU、CLR、VVD 的功能分别涉及关键子图选择、词汇更新、闭环决策记忆和可见性视点选择 | 可核实软事实 | [CVPR 论文主页](https://openaccess.thecvf.com/content/CVPR2026/html/Huang_MSGNav_Unleashing_the_Power_of_Multi-modal_3D_Scene_Graph_for_CVPR_2026_paper.html)及[补充材料](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Huang_MSGNav_Unleashing_the_CVPR_2026_supplemental.pdf)列明模块及其流程。已确认。 | 保留 |
| 找到目标后 VVD 选择可见性较好的目标视点；未找到时继续选择 frontier | 可核实软事实 | [CVPR 补充材料](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Huang_MSGNav_Unleashing_the_CVPR_2026_supplemental.pdf)的流程说明：找到目标后按目标点云可见性选视点，否则由 LLM 选 frontier。已确认。 | 保留 |
| 作者报告在 GOAT-Bench 与 HM3D-OVON 上有领先表现；Val Seen 补充结果中 MSGNav 为 SR 48.3、SPL 27.0，MTU3D 为 SR 55.0、SPL 23.6 | 可核实硬事实 | [CVPR 论文摘要](https://openaccess.thecvf.com/content/CVPR2026/html/Huang_MSGNav_Unleashing_the_Power_of_Multi-modal_3D_Scene_Graph_for_CVPR_2026_paper.html)支持整体基准主张；[补充材料表 3](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Huang_MSGNav_Unleashing_the_CVPR_2026_supplemental.pdf)给出 Val Seen 数值。已确认。正文限定了数据划分，并指出不同指标排序不同。 | 保留并加限定 |
| 感知标签和房间归属可能出错；API 推理的本地资源需求与开放模型的算力需求不同 | 可核实软事实 | [CVPR 补充材料](https://openaccess.thecvf.com/content/CVPR2026/supplemental/Huang_MSGNav_Unleashing_the_CVPR_2026_supplemental.pdf)的提示词明确承认检测标签/房间可能不准确；资源说明区分 API 与开放模型推理所需资源。已确认。 | 保留 |
| 基准结果不能直接证明真实机器人部署可靠 | 推论 | 论文摘要和补充材料提供的是基准测试结果；文中明确把这一句作为评估边界，而非作者实验结论。 | 标为边界推论 |

## TACO 阅读笔记

| 核查的主张 | 分类 | 来源与结果 | 处理 |
| --- | --- | --- | --- |
| TACO 是 CVPR 2026 论文，主题为联合 LiDAR 定位与 3D 物体检测 | 可核实硬事实 | [CVPR 2026 论文主页](https://openaccess.thecvf.com/content/CVPR2026/html/Xing_TACO_Task-Aware_Contrastive_Learning_for_Joint_LiDAR_Localization_and_3D_CVPR_2026_paper.html)确认标题与出版信息。 | 保留 |
| 定位使用全局地图位姿，论文将其作为 6-DoF 位姿估计；检测预测 3D 框 | 可核实软事实 | [TACO 论文 PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Xing_TACO_Task-Aware_Contrastive_Learning_for_Joint_LiDAR_Localization_and_3D_CVPR_2026_paper.pdf)的方法定义说明 6-DoF 位姿和 3D 框输出。 | 保留 |
| 定位依赖稳定地理结构，检测依赖物体局部和类别特征；无差别共享可能造成冲突 | 可核实软事实 | [TACO 论文 PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Xing_TACO_Task-Aware_Contrastive_Learning_for_Joint_LiDAR_Localization_and_3D_CVPR_2026_paper.pdf)引言讨论静态地理结构、运动物体特征及共享表示冲突。 | 保留 |
| TACO 包含 TAFE、TFCL、ITCL、IDCL、ILCL；ITCL 促进任务间双向信息，IDCL 改善检测表示，ILCL 改善定位表示 | 可核实软事实 | [TACO 论文 PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Xing_TACO_Task-Aware_Contrastive_Learning_for_Joint_LiDAR_Localization_and_3D_CVPR_2026_paper.pdf)的方法节明列各阶段与模块功能。已确认。 | 保留 |
| OxfoLD 基于 Oxford RobotCar 扩展；提供约 315k 帧、8 次遍历的数据，训练/测试各 4 次；目标类别含车辆、行人、骑行者 | 可核实硬事实 | [TACO 论文 PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Xing_TACO_Task-Aware_Contrastive_Learning_for_Joint_LiDAR_Localization_and_3D_CVPR_2026_paper.pdf)的数据集节列出来源、帧数、划分、类别。已确认。 | 保留 |
| 作者报告定位结果领先，同时检测结果有竞争力 | 归因 | [CVPR 论文摘要](https://openaccess.thecvf.com/content/CVPR2026/html/Xing_TACO_Task-Aware_Contrastive_Learning_for_Joint_LiDAR_Localization_and_3D_CVPR_2026_paper.html)如此概括实验结论。正文没有扩张为“所有检测指标都领先”。 | 保留并限定 |
| 换城市、传感器或天气后的表现仍需进一步验证 | 推论/开放问题 | 实验围绕论文描述的 OxfoLD 数据和评测设置；文中用“我还想继续追问”和“需要额外实验”表述，未声称论文已证实此结论。 | 标为个人问题 |

## 时间线与未核实项

以下是个人首次读完日期，不是论文发表日期；日期按对话记录的 Asia/Shanghai 本地时间归纳：

- V2U4Real：2026-09-17（9 月 18 日的回忆复习不作为首次读完日期）。
- TACO：2026-09-18。
- MSGNav：2026-09-20。

以下才是论文公开或收录时间：

- [MSGNav arXiv](https://arxiv.org/abs/2511.10376)：首次提交 2025-11-13。
- [V2U4Real arXiv](https://arxiv.org/abs/2603.25275)：首次提交 2026-03-26。
- [TACO CVPR 2026 论文主页](https://openaccess.thecvf.com/content/CVPR2026/html/Xing_TACO_Task-Aware_Contrastive_Learning_for_Joint_LiDAR_Localization_and_3D_CVPR_2026_paper.html)：会议论文页面标注 2026 年 6 月。正文将其概括为“收录于 2026 年 6 月 CVPR”，没有推断更精确的 TACO 首次在线日期。

关键事实均由作者论文页面、论文原文或补充材料支持。没有在本次核查中验证模型复现、代码可用性或实际机器人部署效果；博客正文也没有声称这些已经验证。
