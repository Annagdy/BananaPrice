import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export const SearchIcon = (p: IconProps) => (
  <svg width="28" height="28" viewBox="0 0 24 24" {...base} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
)
export const UserPlusIcon = (p: IconProps) => (
  <svg width="22" height="18" viewBox="0 0 24 20" {...base} {...p}><circle cx="9" cy="6" r="4" /><path d="M1.5 19c0-4 3.2-6.5 7.5-6.5s7.5 2.5 7.5 6.5" /><path d="M20 5v6M17 8h6" /></svg>
)
export const BoltIcon = (p: IconProps) => (
  <svg width="30" height="40" viewBox="0 0 24 32" fill="currentColor" {...p}><path d="M14 0L1 18h9l-3 14L23 12h-9z" /></svg>
)
export const TagIcon = (p: IconProps) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M3 12.5V4a1 1 0 011-1h8.5a1 1 0 01.7.3l8 8a1 1 0 010 1.4l-8.5 8.5a1 1 0 01-1.4 0l-8-8a1 1 0 01-.3-.7z" /><circle cx="8" cy="8" r="1.6" fill="#150c09" /></svg>
)
export const AtIcon = (p: IconProps) => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.9 7.9" /></svg>
)
export const LockIcon = (p: IconProps) => (
  <svg width="14" height="16" viewBox="0 0 24 24" {...base} {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>
)
export const EyeIcon = (p: IconProps) => (
  <svg width="17" height="12" viewBox="0 0 24 24" {...base} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" /><circle cx="12" cy="12" r="3" /></svg>
)
export const EyeOffIcon = (p: IconProps) => (
  <svg width="17" height="12" viewBox="0 0 24 24" {...base} {...p}><path d="M17.9 17.9A10.9 10.9 0 0112 20C5 20 1 12 1 12a18.5 18.5 0 015.1-5.9M9.9 4.2A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.2M1 1l22 22" /></svg>
)
export const GamepadIcon = (p: IconProps) => (
  <svg width="15" height="11" viewBox="0 0 24 24" {...base} {...p}><path d="M6 12h4M8 10v4" /><circle cx="15" cy="11" r=".8" /><circle cx="18" cy="13" r=".8" /><path d="M17.3 5H6.7a4 4 0 00-3.9 3.2l-1.7 8A3 3 0 006 19l2-2h8l2 2a3 3 0 004.9-2.8l-1.7-8A4 4 0 0017.3 5z" /></svg>
)
export const RestoreIcon = (p: IconProps) => (
  <svg width="15" height="15" viewBox="0 0 24 24" {...base} {...p}><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.7L3 8" /><path d="M3 3v5h5M12 8v4l3 2" /></svg>
)
export const ArrowRight = (p: IconProps) => (
  <svg width="12" height="12" viewBox="0 0 24 24" {...base} strokeWidth={2.4} {...p}><path d="M5 12h14M13 5l7 7-7 7" /></svg>
)
export const VisitorIcon = (p: IconProps) => (
  <svg width="12" height="12" viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="7" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6z" /></svg>
)
export const UserPlusSmall = (p: IconProps) => (
  <svg width="20" height="15" viewBox="0 0 24 20" {...base} {...p}><circle cx="9" cy="6" r="4" /><path d="M1.5 19c0-4 3.2-6.5 7.5-6.5s7.5 2.5 7.5 6.5" /><path d="M20 5v6M17 8h6" /></svg>
)
export const SteamIcon = (p: IconProps) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="12" cy="12" r="11" fill="#fff" /><path fill="#0088ff" d="M12 4.5a7.5 7.5 0 00-7.4 6.2l4 1.7a2.3 2.3 0 011.3-.4l1.8-2.6a3 3 0 113 3l-2.6 1.9a2.3 2.3 0 01-4.5.4l-2.9-1.2A7.5 7.5 0 1012 4.5z" /></svg>
)
export const HeartIcon = (p: IconProps) => (
  <svg width="16" height="16" viewBox="0 0 24 24" {...base} {...p}><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z" /></svg>
)
export const UserIcon = (p: IconProps) => (
  <svg width="14" height="16" viewBox="0 0 24 24" {...base} {...p}><circle cx="12" cy="7" r="4" /><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6" /></svg>
)
export const BellIcon = (p: IconProps) => (
  <svg width="30" height="30" viewBox="0 0 24 24" {...base} {...p}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>
)
export const StoreIcon = (p: IconProps) => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M4 3h16l2 6a3 3 0 01-5 2 3 3 0 01-5 0 3 3 0 01-5 0 3 3 0 01-5-2z" /><path d="M4 13.5V21h6v-5h4v5h6v-7.5a5 5 0 01-4-1.3 5 5 0 01-4 1.3 5 5 0 01-4-1.3 5 5 0 01-4 1.3z" /></svg>
)
