import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * Logo 组件
 * 根据主题自动切换深色/浅色模式的 SVG 图标
 */
export default function Logo({
  className = '',
  width = 48,
  height = 48,
}: LogoProps) {
  return (
    <div className={className}>
      {/* 浅色模式 Logo */}
      <Image
        alt="QuizGen Logo"
        className="block dark:hidden"
        height={height}
        src="/logo.svg"
        width={width}
      />
      {/* 深色模式 Logo */}
      <Image
        alt="QuizGen Logo"
        className="hidden dark:block"
        height={height}
        src="/logo-dark-mode.svg"
        width={width}
      />
    </div>
  );
}
