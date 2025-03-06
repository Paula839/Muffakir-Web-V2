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
    const [clickedButton, setClickedButton] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
          try {
            const response = await fetch("http://localhost:8000/api/user/me", {
              credentials: "include",
            });
            if (response.ok) {
              const data = await response.json();
              setUser(data);
            }
          } catch (error: any) {
            if (error.message && error.message !== "Failed to fetch") {
              console.error("Error fetching user data:", error);
            }
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
    };

    const handleLanguageChange = () => {
        const newLang = lang === 'en' ? 'ar' : 'en';
        setLang(newLang);
        localStorage.setItem('lang', newLang);
        updateDocumentAttributes(newLang);
    };

    const handleButtonClick = (buttonType: string) => {
        setClickedButton(buttonType);
        setTimeout(() => setClickedButton(null), 200);
    };

    return (
        <main className="container">
            <ThemeToggle />
            <ProfileDropdown lang={lang}/>
            <LanguageToggle lang={lang} onToggle={handleLanguageChange} />
            <h1 className="title">{translations[lang].welcome}</h1>
            <div className="button-group">
                <Link 
                    href="/chat" 
                    className={`primary-button ${clickedButton === 'chat' ? 'clicked' : ''}`}
                    onClick={() => handleButtonClick('chat')}
                >
                    {translations[lang].useNow}
                </Link>
                <Link 
                    href="/test" 
                    className={`primary-button ${clickedButton === 'test' ? 'clicked' : ''}`}
                    onClick={() => handleButtonClick('test')}
                >
                    {translations[lang].test}
                </Link>
                {!user && 
                    <Link 
                        href={`http://localhost:8000/api/user/auth/google`} 
                        className={`secondary-button ${clickedButton === 'signin' ? 'clicked' : ''}`}
                        onClick={() => handleButtonClick('signin')}
                    >
                        {translations[lang].signIn}
                    </Link>
                }               
            </div>
        </main>
    );
}

export default HomePage;