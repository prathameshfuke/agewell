import { ReactNode } from 'react';
import { Bell, Home, Pill, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ElderlyLayoutProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function ElderlyLayout({ children, activeTab = 'home', onTabChange }: ElderlyLayoutProps) {
  const { profile, signOut } = useAuth();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'medications', label: 'My Pills', icon: Pill },
    { id: 'health', label: 'Health', icon: Heart },
    { id: 'alerts', label: 'Alerts', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-50">
      <header className="bg-white shadow-md border-b-4 border-emerald-400">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Hello, {profile?.display_name}!
              </h1>
              <p className="text-2xl text-gray-600 mt-2">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="px-8 py-4 text-2xl bg-gray-200 hover:bg-gray-300 rounded-2xl font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-4 py-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`
                    flex items-center gap-4 px-8 py-5 rounded-2xl text-2xl font-bold
                    transition-all duration-200 whitespace-nowrap
                    ${isActive
                      ? 'bg-emerald-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon size={32} strokeWidth={2.5} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
