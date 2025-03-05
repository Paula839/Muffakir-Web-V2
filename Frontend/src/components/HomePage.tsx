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
        // Fetch user info from backend using the token in the cookie
        const fetchUser = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/user/me", {
                    credentials: "include", // Ensures cookies are sent with the request
                });
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                setUser(data);
            } catch (error) {
                console.error("Error fetching user data:", error);
            }
        };
        fetchUser();
    }, [setUser]);

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
                <Link href={`http://localhost:8000/api/user/auth/google`} className="secondary-button">
                    {translations[lang].signIn}
                </Link>
            </div>
        </main>
    );
}

export default HomePage;