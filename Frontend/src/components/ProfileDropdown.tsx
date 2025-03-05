'use client';

import { useState, useRef, useEffect } from "react";
import { useUser } from "../context/UserContext";
import Link from "next/link";

const ProfileDropdown = () => {
  const { user, setUser } = useUser();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    setOpen(false);
  };

  return (
    <div className="profile" ref={dropdownRef}>
      {/* Display the user's name */}
      <span className="profile-name">{user ? user.name : "Guest"}</span>

      {/* Profile button with image/icon */}
      <button onClick={() => setOpen(prev => !prev)} className="profile-button">
        {user && user.picture ? (
          <img src={user.picture} alt="Profile" className="profile-image" />
        ) : (
          <div className="profile-icon">
            <span>{user && user.name ? user.name[0] : "G"}</span>
          </div>
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="dropdown-menu">
          {user ? (
            <button onClick={handleLogout}>Logout</button>
          ) : (
            <Link href="http://localhost:8000/api/user/auth/google">Sign In</Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
