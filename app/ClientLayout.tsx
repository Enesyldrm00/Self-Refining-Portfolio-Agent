'use client';

import { WalletProvider } from '@/context/WalletContext';
import { ReactNode } from 'react';

interface ClientLayoutProps {
    children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
    return <WalletProvider>{children}</WalletProvider>;
}
