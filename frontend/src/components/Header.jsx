import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Bell, 
  Search, 
  User, 
  ChevronDown,
  Settings,
  LogOut
} from 'lucide-react';

export default function Header({ 
  currentUser,
  openExceptionsCount = 0, 
  onOpenExceptions,
  onSearch,
  onSignOut,
  onSelectView
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userName = currentUser?.name || 'TPO Lead';
  const userSubtitle = currentUser?.role === 'student' ? 'Student Candidate' : currentUser?.role === 'recruiter' ? 'Recruitment Lead' : 'Placement Cell';
  const userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2) || 'TL';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-2.5 h-14 flex items-center justify-between">
      {/* Left: Simple Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
          <Building2 className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-sm tracking-tight text-slate-900 leading-tight">
            CAMPUS COMMAND
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Placement Operations
          </div>
        </div>
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex items-center w-96 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search students, drives, interviews..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            /
          </kbd>
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          onClick={onOpenExceptions}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          title="Notifications & Action Items"
        >
          <Bell className="w-4 h-4" />
          {openExceptionsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>

        <div className="h-4 w-px bg-slate-200"></div>

        {/* TPO Profile with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              {userInitials}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-xs font-semibold text-slate-900">
                {userName}
              </div>
              <div className="text-[10px] text-slate-500">
                {userSubtitle}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-md py-1.5 z-50 text-xs text-slate-700 animate-fadeIn">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-900">{userName}</div>
                <div className="text-[11px] text-slate-500 truncate">{currentUser?.email || 'tpo@university.edu'}</div>
              </div>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onSelectView) onSelectView('audit');
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onSelectView) onSelectView('audit');
                }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Settings</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  if (onSignOut) onSignOut();
                }}
                className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
