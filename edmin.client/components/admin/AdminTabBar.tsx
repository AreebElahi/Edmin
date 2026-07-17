interface Tab {
  id: string;
  label: string;
}

interface AdminTabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function AdminTabBar({ tabs, activeTab, onTabChange }: AdminTabBarProps) {
  return (
    <div className="flex overflow-x-auto scrollbar-hide md:flex-wrap gap-2 mb-8 bg-surface p-2 rounded-[2px] shadow-none border border-border w-full md:w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`whitespace-nowrap px-5 py-3 font-bold text-sm rounded-[2px] transition-all shrink-0 ${
            activeTab === tab.id
              ? 'bg-primary text-white shadow-none shadow-indigo-100'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
