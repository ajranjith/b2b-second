'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

type SearchInputProps = {
  defaultValue?: string;
  placeholder?: string;
  onSearch?: (value: string) => void;
  size?: 'md' | 'lg';
};

export function SearchInput({ defaultValue = '', placeholder, onSearch, size = 'md' }: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(defaultValue);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = value.trim();
    if (onSearch) {
      onSearch(query);
      return;
    }
    const target = query ? `/dealer/search?q=${encodeURIComponent(query)}` : '/dealer/search';
    if (pathname !== target) {
      router.push(target);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 ${
          size === 'lg' ? 'py-3' : 'py-2'
        } shadow-sm`}
      >
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder || 'Search parts, SKU, model...'}
          className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus-visible:outline-none"
        />
        <button
          type="submit"
          className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 focus-visible:outline-offset-2"
        >
          Search
        </button>
      </div>
    </form>
  );
}
