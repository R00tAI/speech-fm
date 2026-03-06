'use client';

import React, { useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import type { PhosphorColor } from '../Voice31Store';

/**
 * Settings Primitives
 * Shared UI components used across all settings tabs.
 */

// =============================================================================
// TAB BUTTON
// =============================================================================

interface TabButtonProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  color: string;
}

export const TabButton: React.FC<TabButtonProps> = ({ label, icon, isActive, onClick, color }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs font-mono uppercase tracking-wider"
    style={{
      backgroundColor: isActive ? `${color}20` : 'transparent',
      borderBottom: isActive ? `2px solid ${color}` : '2px solid transparent',
      color: isActive ? color : `${color}80`,
    }}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// =============================================================================
// SETTING ROW
// =============================================================================

interface SettingRowProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  color: string;
}

export const SettingRow: React.FC<SettingRowProps> = ({ label, description, children, color }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-white/5">
    <div className="flex-1">
      <div className="text-sm font-medium" style={{ color }}>{label}</div>
      {description && <div className="text-xs text-white/40 mt-0.5">{description}</div>}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

// =============================================================================
// SELECT DROPDOWN
// =============================================================================

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SelectDropdownProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  color: string;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({ value, options, onChange, color }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono min-w-[140px] justify-between"
        style={{ backgroundColor: `${color}15`, border: `1px solid ${color}40`, color }}
      >
        <span className="flex items-center gap-2">
          {selected?.icon}
          {selected?.label}
        </span>
        <CaretDown size={12} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-full rounded-lg z-50 overflow-hidden"
            style={{ backgroundColor: '#0a0a10', border: `1px solid ${color}40`, boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            {options.map((option) => (
              <button key={option.value}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-mono text-left hover:bg-white/5 transition-colors"
                style={{ color: option.value === value ? color : `${color}80` }}>
                {option.icon}
                {option.label}
                {option.value === value && <Check size={12} className="ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// =============================================================================
// COLOR PICKER
// =============================================================================

interface ColorPickerProps {
  value: PhosphorColor;
  onChange: (color: PhosphorColor) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const colors: { id: PhosphorColor; hex: string; label: string }[] = [
    { id: 'green', hex: '#33ff33', label: 'Matrix Green' },
    { id: 'amber', hex: '#ffaa00', label: 'Amber' },
    { id: 'red', hex: '#ff4444', label: 'Red Alert' },
    { id: 'blue', hex: '#4488ff', label: 'Ice Blue' },
    { id: 'white', hex: '#ffffff', label: 'White' },
  ];

  return (
    <div className="flex gap-2">
      {colors.map((color) => (
        <button key={color.id} onClick={() => onChange(color.id)}
          className="w-8 h-8 rounded-full transition-all hover:scale-110"
          style={{
            backgroundColor: color.hex,
            boxShadow: value === color.id ? `0 0 0 2px #000, 0 0 0 4px ${color.hex}` : 'none',
            opacity: value === color.id ? 1 : 0.6,
          }}
          title={color.label} />
      ))}
    </div>
  );
};

// =============================================================================
// TEXT INPUT
// =============================================================================

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  color: string;
  multiline?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({ value, onChange, placeholder, color, multiline }) => {
  const commonStyles = { backgroundColor: `${color}10`, border: `1px solid ${color}30`, color };

  if (multiline) {
    return (
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg text-sm font-mono resize-none focus:outline-none"
        style={{ ...commonStyles, minHeight: 100 }} rows={4} />
    );
  }

  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3 py-1.5 rounded-lg text-sm font-mono focus:outline-none" style={commonStyles} />
  );
};

// =============================================================================
// TOGGLE SWITCH
// =============================================================================

export const ToggleSwitch: React.FC<{ enabled: boolean; onToggle: () => void; color: string }> = ({ enabled, onToggle, color }) => (
  <button onClick={onToggle} className="w-12 h-6 rounded-full transition-all relative"
    style={{ backgroundColor: enabled ? `${color}40` : 'rgba(255,255,255,0.1)', border: `1px solid ${enabled ? color : 'rgba(255,255,255,0.2)'}` }}>
    <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
      style={{ left: enabled ? '26px' : '2px', backgroundColor: enabled ? color : 'rgba(255,255,255,0.4)' }} />
  </button>
);

// =============================================================================
// CAPABILITY SECTION (Collapsible)
// =============================================================================

export const CapabilitySection: React.FC<{
  title: string;
  icon: React.ReactNode;
  color: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, icon, color, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${color}20`, borderRadius: 8, overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all hover:bg-white/5" style={{ color }}>
        {icon}
        <span className="text-xs font-mono font-bold tracking-wide uppercase flex-1">{title}</span>
        <CaretDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
      </button>
      {open && <div className="px-3 pb-3 space-y-2" style={{ borderTop: `1px solid ${color}15` }}>{children}</div>}
    </div>
  );
};

// =============================================================================
// SLIDER ROW
// =============================================================================

interface SliderRowProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  color: string;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

export const SliderRow: React.FC<SliderRowProps> = ({
  label, description, value, min, max, step, color, onChange, format,
}) => {
  const display = format ? format(value) : String(value);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-white/5">
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color }}>{label}</div>
        {description && <div className="text-xs text-white/40 mt-0.5">{description}</div>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-24 accent-current" style={{ color }}
        />
        <span className="text-xs font-mono w-12 text-right" style={{ color }}>{display}</span>
      </div>
    </div>
  );
};

// =============================================================================
// BUTTON GROUP (Segmented selector)
// =============================================================================

interface ButtonGroupOption {
  value: string;
  label: string;
}

interface ButtonGroupProps {
  value: string;
  options: ButtonGroupOption[];
  onChange: (value: string) => void;
  color: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ value, options, onChange, color }) => (
  <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${color}30` }}>
    {options.map((option) => (
      <button
        key={option.value}
        onClick={() => onChange(option.value)}
        className="px-3 py-1.5 text-xs font-mono transition-all"
        style={{
          backgroundColor: value === option.value ? `${color}25` : 'transparent',
          color: value === option.value ? color : `${color}60`,
          borderRight: `1px solid ${color}20`,
        }}
      >
        {option.label}
      </button>
    ))}
  </div>
);

// =============================================================================
// TOOL CHIP (Toggle chip for individual tools)
// =============================================================================

export const ToolChip: React.FC<{
  id: string;
  name: string;
  enabled: boolean;
  onToggle: (id: string) => void;
  color: string;
}> = ({ id, name, enabled, onToggle, color }) => (
  <button onClick={() => onToggle(id)}
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono transition-all"
    style={{
      backgroundColor: enabled ? `${color}18` : 'transparent',
      border: `1px solid ${enabled ? color : `${color}25`}`,
      color: enabled ? color : `${color}50`,
    }}>
    <div className="w-3 h-3 rounded-sm flex items-center justify-center"
      style={{ backgroundColor: enabled ? color : 'transparent', border: `1px solid ${enabled ? color : `${color}60`}` }}>
      {enabled && <Check size={8} color="#000" weight="bold" />}
    </div>
    {name}
  </button>
);
