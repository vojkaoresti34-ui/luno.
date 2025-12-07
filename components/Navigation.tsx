import React from 'react';
import { Map, BarChart2, User, Moon } from './Icons';
import { Screen } from '../types';

interface Props {
  current: Screen;
  onNavigate: (s: Screen) => void;
}

export const Navigation: React.FC<Props> = ({ current, onNavigate }) => {
  const navItems = [
    { id: Screen.HOME, icon: Moon, label: 'Trip' },
    { id: Screen.MAP, icon: Map, label: 'Map' },
    { id: Screen.INSIGHTS, icon: BarChart2, label: 'Insights' },
    { id: Screen.PROFILE, icon: User, label: 'You' },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-black border-t border-white/10 pb-6 pt-4 px-6 flex justify-between items-center z-50 max-w-md mx-auto"
      role="navigation"
      aria-label="Main Navigation"
    >
      {navItems.map((item) => {
        const isActive = current === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={`flex flex-col items-center gap-1 transition-transform duration-200 focus:outline-none focus:text-white active:scale-90 ${isActive ? 'text-white scale-105' : 'text-white/40'}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};