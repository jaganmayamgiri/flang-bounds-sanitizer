import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Play, Cpu, Diff, ShieldAlert, Menu, X, Terminal, Sun, Moon } from 'lucide-react';

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const [isLight, setIsLight] = useState(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'light';
  });

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isLight]);

  const toggleTheme = () => {
    setIsLight(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'light' : 'dark');
      return next;
    });
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Test Runner', href: '/runner', icon: Play },
    { name: 'Benchmarks', href: '/benchmarks', icon: Cpu },
    { name: 'Pass Inspector', href: '/inspector', icon: Diff },
  ];

  return (
    <div className="min-h-screen bg-base text-primary flex flex-col font-body">
      {/* Top Header */}
      <header className="h-14 bg-surface border-b border-border-default flex items-center justify-between px-4 z-20">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded hover:bg-elevated transition-colors text-secondary hover:text-primary md:block"
            aria-label="Toggle Sidebar"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          
          <div className="flex items-center space-x-2">
            <Terminal size={20} className="text-accent" />
            <h1 className="font-display font-semibold text-lg tracking-tight">
              Flang Bounds-Sanitizer
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-elevated border border-border-subtle text-secondary font-mono">
              v20.0-HLFIR
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded hover:bg-elevated transition-colors text-secondary hover:text-primary flex items-center justify-center"
            title="Toggle Light/Dark Theme"
            aria-label="Toggle Light/Dark Theme"
          >
            {isLight ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          
          <div className="flex items-center space-x-2 text-xs text-secondary font-mono">
            <span className="h-2 w-2 rounded-full bg-pass animate-pulse"></span>
            <span>Compiler: flang-20 (WSL-Ubuntu)</span>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`bg-surface border-r border-border-default flex flex-col transition-all duration-300 ease-snap z-10 ${
            sidebarOpen ? 'w-56' : 'w-14'
          } shrink-0`}
        >
          <nav className="flex-1 py-4 space-y-1 px-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-3 py-2 rounded transition-colors text-sm font-medium group relative ${
                    isActive
                      ? 'bg-elevated border-l-2 border-accent text-primary'
                      : 'text-secondary hover:bg-elevated hover:text-primary'
                  }`}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 ${isActive ? 'text-accent' : 'text-secondary group-hover:text-primary'}`}
                  />
                  {sidebarOpen && <span className="ml-3 truncate">{item.name}</span>}
                  
                  {/* Tooltip when collapsed */}
                  {!sidebarOpen && (
                    <div className="absolute left-14 hidden group-hover:block bg-overlay border border-border-strong text-primary text-xs px-2.5 py-1.5 rounded whitespace-nowrap shadow-xl z-50">
                      {item.name}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-border-default bg-elevated">
            {sidebarOpen ? (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] text-secondary font-mono">
                  <span>WSL STATUS</span>
                  <span className="text-pass">ONLINE</span>
                </div>
                <div className="flex justify-between text-[10px] text-secondary font-mono">
                  <span>SYSTEM OVERHEAD</span>
                  <span className="text-warn">~7.4%</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <span className="h-2 w-2 rounded-full bg-pass"></span>
              </div>
            )}
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-base p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
