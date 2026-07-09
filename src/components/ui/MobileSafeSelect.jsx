import React from 'react';

// Radix/custom dropdown portals have repeatedly broken on mobile Safari
// (blank bottom sheets, hidden options, clipped selected text). This app
// standardizes on a plain native <select> for all dropdowns — it always
// renders the OS-native picker, so options are guaranteed visible and
// selectable on every device, with no portal/z-index issues.
export default function MobileSafeSelect({
  value,
  onChange,
  disabled = false,
  options = [],
  placeholder,
  className = '',
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`w-full h-9 rounded-md border border-input px-3 text-sm leading-9 bg-white text-stone-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {placeholder && <option value="" disabled={value !== ''}>{placeholder}</option>}
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        return (
          <option key={val} value={val}>{label}</option>
        );
      })}
    </select>
  );
}