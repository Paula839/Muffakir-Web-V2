'use client';

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import translations from "../translations/translations";
import { useEffect, useState } from "react";
import UserProfile from "./UserProfile";
import React from "react";
import { useUser } from "../context/UserContext";
import ProfileDropdown from "./ProfileDropdown";

function HomePage() {
    const [lang, setLang] = useState<'en' | 'ar'>('en');
    const { user, setUser } = useUser(); 
    useEffect(() => {
        const fetchUser = async () => {
          try {
            const response = await fetch("http://localhost:8000/api/user/me", {
              credentials: "include", // Ensure cookies are sent with the request
            });
            if (response.ok) {
              const data = await response.json();
              setUser(data);
            }
            // Optionally, you could handle specific status codes here (like 401)
          } catch (error: any) {
            // If error message is "Failed to fetch", ignore it
            if (error.message && error.message !== "Failed to fetch") {
              console.error("Error fetching user data:", error);
            }
            // Otherwise, silently ignore it (user likely isn't logged in)
          }
        };
        fetchUser();
      }, [setUser]);

    useEffect(() => {
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        } else {
            localStorage.removeItem("user");
        }
    }, [user]);

    useEffect(() => {
        const savedLang = localStorage.getItem('lang') === 'ar' ? 'ar' : 'en';
        setLang(savedLang);
        updateDocumentAttributes(savedLang);
    }, []);

    const updateDocumentAttributes = (language: string) => {
        document.documentElement.setAttribute('lang', language);
        // document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
    };

    const handleLanguageChange = () => {
        const newLang = lang === 'en' ? 'ar' : 'en';
        setLang(newLang);
        localStorage.setItem('lang', newLang);
        updateDocumentAttributes(newLang);
    };
    
    return (
        <main className="container">
            <ThemeToggle />
            <ProfileDropdown />
            <LanguageToggle lang={lang} onToggle={handleLanguageChange} />
            <h1 className="title">{translations[lang].welcome}</h1>
            <div className="button-group">
                <Link href="/chat" className="primary-button">
                    {translations[lang].useNow}
                </Link>
                <Link href="/test" className="primary-button">
                    {translations[lang].test}
                </Link>
                {!user && 
                    <Link href={`http://localhost:8000/api/user/auth/google`} className="secondary-button">
                        {translations[lang].signIn}
                    </Link>
            }               
            </div>
        </main>
        
    );
}

export default HomePage;