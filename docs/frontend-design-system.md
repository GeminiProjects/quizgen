# QuizGen 前端设计系统

## 设计理念

QuizGen 采用现代化极简主义设计风格，强调：
- **清晰性**：界面元素层次分明，重要信息突出显示
- **专注性**：减少视觉干扰，让用户专注于答题和学习
- **响应性**：适配各种设备，确保移动端和桌面端的优秀体验
- **可访问性**：遵循 WCAG 2.1 标准，确保所有用户都能使用

## 视觉规范

### 颜色系统

基于 shadcn/ui 的默认主题，采用中性色调为主：

```css
/* 主题色 */
--primary: hsl(222.2 47.4% 11.2%);           /* 深蓝黑色 */
--primary-foreground: hsl(210 40% 98%);     /* 几乎白色 */

/* 背景色 */
--background: hsl(0 0% 100%);               /* 纯白 */
--foreground: hsl(222.2 84% 4.9%);          /* 深黑 */

/* 次要色 */
--secondary: hsl(210 40% 96.1%);            /* 浅灰 */
--secondary-foreground: hsl(222.2 47.4% 11.2%);

/* 强调色 */
--accent: hsl(210 40% 96.1%);               /* 用于悬停状态 */
--accent-foreground: hsl(222.2 47.4% 11.2%);

/* 功能色 */
--success: hsl(142 76% 36%);                /* 绿色 - 正确答案 */
--error: hsl(0 84% 60%);                    /* 红色 - 错误答案 */
--warning: hsl(38 92% 50%);                 /* 黄色 - 倒计时警告 */
--info: hsl(199 89% 48%);                   /* 蓝色 - 提示信息 */
```

### 字体系统

```css
/* 字体家族 */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans CJK SC", 
             "PingFang SC", "Microsoft YaHei", sans-serif;
--font-mono: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;

/* 字体大小 */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* 字重 */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 间距系统

采用 8px 基础单位的间距系统：

```css
--spacing-0: 0;
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-5: 1.25rem;   /* 20px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-10: 2.5rem;   /* 40px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
```

### 圆角系统

```css
--radius-none: 0;
--radius-sm: 0.125rem;  /* 2px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;  /* 完全圆角 */
```

### 阴影系统

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

## 组件设计原则

### 1. 按钮 (Button)

- **主按钮**：用于主要操作，如"提交答案"、"开始测验"
- **次要按钮**：用于次要操作，如"返回"、"取消"
- **文字按钮**：用于不太重要的操作，如"查看更多"

```tsx
// 示例用法
<Button variant="default">开始测验</Button>
<Button variant="secondary">查看统计</Button>
<Button variant="ghost">跳过</Button>
<Button variant="destructive">删除</Button>
```

### 2. 卡片 (Card)

- 用于组织相关内容
- 保持适当的内边距和圆角
- 可选的边框和阴影

```tsx
// 示例用法
<Card>
  <CardHeader>
    <CardTitle>讲座标题</CardTitle>
    <CardDescription>讲座描述</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 内容 */}
  </CardContent>
</Card>
```

### 3. 表单 (Form)

- 清晰的标签和占位符
- 实时验证反馈
- 合理的输入框大小

### 4. 进度指示器

- **倒计时条**：显示答题剩余时间
- **进度条**：显示测验完成进度
- **加载动画**：处理异步操作时的反馈

## 页面布局原则

### 1. 响应式网格

使用 12 列网格系统，根据屏幕大小自适应：
- 移动端 (< 640px)：单列布局
- 平板 (640px - 1024px)：2-3 列布局
- 桌面 (> 1024px)：多列布局

### 2. 导航结构

- **顶部导航栏**：包含 Logo、主导航、用户信息
- **侧边栏**（可选）：用于复杂页面的二级导航
- **底部导航**（移动端）：快速访问主要功能

### 3. 内容区域

- 最大宽度：1280px
- 水平内边距：移动端 16px，桌面端 24px
- 垂直间距：使用一致的间距系统

## 交互设计

### 1. 动画和过渡

- 使用微妙的过渡效果（duration: 150-300ms）
- 避免过度动画
- 保持一致的缓动函数（ease-in-out）

```css
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

### 2. 状态反馈

- **悬停状态**：轻微变色或阴影
- **点击状态**：缩小效果或颜色加深
- **禁用状态**：降低透明度
- **加载状态**：骨架屏或加载动画

### 3. 错误处理

- 清晰的错误信息
- 友好的错误提示
- 提供解决方案

## 可访问性要求

1. **键盘导航**：所有交互元素都可通过键盘访问
2. **屏幕阅读器**：适当的 ARIA 标签
3. **颜色对比**：确保足够的对比度（WCAG AA 标准）
4. **焦点指示**：清晰的焦点样式

## 深色模式支持

使用 CSS 变量和 `class="dark"` 切换深色模式：

```css
.dark {
  --background: hsl(222.2 84% 4.9%);
  --foreground: hsl(210 40% 98%);
  /* 其他深色模式变量 */
}
```

## 图标系统

使用 Lucide React 图标库，保持一致的图标风格：
- 线条粗细：2px
- 尺寸规格：16px, 20px, 24px
- 常用图标映射：
  - 开始：Play
  - 暂停：Pause
  - 提交：Send
  - 统计：BarChart3
  - 用户：User
  - 设置：Settings
  - 退出：LogOut