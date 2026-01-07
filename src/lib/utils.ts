import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function maskEmail(email: string | null | undefined) {
  if (!email) return '---';
  const [user, domain] = email.split('@');
  if (!domain) return email;
  return `${user.slice(0, 3)}***@${domain}`;
}

export function maskId(id: string | null | undefined) {
  if (!id) return '---';
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}
