'use client';

import MainSidebar from '@/components/main-sidebar';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="flex h-screen bg-gray-100">
        <MainSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
 
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 