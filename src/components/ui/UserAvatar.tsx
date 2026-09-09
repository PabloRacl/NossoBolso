import React, { useState } from 'react';
import { User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showOnlineBadge?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
};

/**
 * Obtém as 1 ou 2 iniciais do nome do usuário.
 */
function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name = 'Usuário',
  size = 'md',
  className,
  showOnlineBadge = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(name);

  // Se não houver imagem fornecida ou se o carregamento falhou, exibe avatar estilizado de iniciais
  const shouldShowInitials = !src || hasError;

  return (
    <div className={twMerge('relative inline-flex shrink-0 select-none', className)}>
      {shouldShowInitials ? (
        <div
          className={twMerge(
            clsx(
              'rounded-full flex items-center justify-center font-bold tracking-wider text-white shadow-md',
              'bg-gradient-to-br from-[#06B6D4] via-[#00CC6D] to-[#00FF88] border border-[#00FF88]/40',
              sizeClasses[size]
            )
          )}
          title={name}
        >
          {initials || <User className="w-1/2 h-1/2" />}
        </div>
      ) : (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={() => setHasError(true)}
          className={twMerge(
            clsx(
              'rounded-full object-cover border border-[#00FF88]/40 shadow-md bg-slate-800',
              sizeClasses[size]
            )
          )}
        />
      )}

      {showOnlineBadge && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00FF88] border-2 border-[#0B0F19] rounded-full shadow-sm"
        />
      )}
    </div>
  );
};
