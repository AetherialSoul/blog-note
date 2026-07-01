import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'RCS and Robotics Notes',
  description: 'RoboMaster, ROS2, Multi-Agent Robotics',
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'Projects', link: '/projects' },
      { text: 'Roadmap', link: '/roadmap' },
      { text: 'Blog', link: '/blog/2026-06-30-markdown-typora' },
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
          { text: '用 Typora 学 Markdown', link: '/blog/2026-06-30-markdown-typora' },
          { text: '博客从这里开始', link: '/blog/2026-06-28' }
        ]
      }
    ]
  }
})
