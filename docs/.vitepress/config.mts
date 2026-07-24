import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/blog-note/',
  title: 'RCS and Robotics Notes',
  description: 'RoboMaster, ROS2, Multi-Agent Robotics',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'Projects', link: '/projects' },
      { text: 'Roadmap', link: '/roadmap' },
      { text: 'Blog', link: '/blog/2026-07-24-rm-simulation-setup' },
      { text: 'Contact', link: '/contact' }
    ],
    sidebar: [
      {
        text: '个人网站',
        items: [
          { text: '首页', link: '/' },
          { text: 'About', link: '/about' },
          { text: 'Projects', link: '/projects' },
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'Contact', link: '/contact' }
        ]
      },
      {
        text: '博客',
        items: [
          { text: '跑通 RM 自瞄闭环仿真', link: '/blog/2026-07-24-rm-simulation-setup' },
          { text: '用竞赛题复习 C++ 基础', link: '/blog/2026-07-18-cpp-contest-review' },
          { text: 'C++ 从封装走到 STL', link: '/blog/2026-07-17-cpp-lessons-06-08' },
          { text: 'C++ 跟学课堂 01–06', link: '/blog/2026-07-15-cpp-lessons-01-06' },
          { text: '学习视觉组内容', link: '/blog/2026-07-09-vision-group' },
          { text: '学习机械组内容', link: '/blog/2026-07-08-mechanical-group' },
          { text: '学习电控组内容', link: '/blog/2026-07-06-electrical-control' },
          { text: '参加 CANN 启航营', link: '/blog/2026-07-04-cann-launch-camp' },
          { text: '用 AI 重新整理计算机基础学习路径', link: '/blog/2026-07-03-cs-learning-path' },
          { text: '了解 RoboMaster 赛事相关内容', link: '/blog/2026-07-02-rm-competition' },
          { text: '复习 C++ STL 和刷题', link: '/blog/2026-07-01-cpp-stl' },
          { text: '用 Typora 学 Markdown', link: '/blog/2026-06-30-markdown-typora' },
          { text: '博客从这里开始', link: '/blog/2026-06-28' }
        ]
      }
    ]
  }
})
