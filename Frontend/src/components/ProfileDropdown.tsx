'use client';

import { useState, useRef, useEffect } from "react";
import { useUser } from "../context/UserContext";
import Link from "next/link";
import translations from "../translations/translations"; // Add translation import

const ProfileDropdown = ({lang}: {lang: 'en' | 'ar'}) => {
  const { user, setUser } = useUser();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load language preference

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentPath = window.location.pathname;
  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/user/logout", {
        method: "POST",
        credentials: "include",
      });
  
      if (response.ok) {
        setUser(null);
        localStorage.removeItem("user");
        setOpen(false);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="profile" ref={dropdownRef}>
      {/* Use translation for Guest */}
      <span className="profile-name">{user ? user.name : translations[lang].guest}</span>

      <button onClick={() => setOpen(prev => !prev)} className="profile-button">
        {user?.picture ? (
          <img src={user.picture} alt="Profile" className="profile-image" />
        ) : (
          <div className="profile-icon">
            <span>{user ? user.name[0] : translations[lang].guest[0]}</span>
          </div>
        )}
      </button>

      {open && (
        <div className="dropdown-menu">
          {user ? (
            <button onClick={handleLogout}>{translations[lang].logout}</button>
          ) : (
            
            <Link href={`http://localhost:8000/api/user/auth/google?redirect=${encodeURIComponent(currentPath)}`}>
              {translations[lang].signIn}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;