'use client';

import { useEffect } from "react";
import translations from "../translations/translations";
import { FaArrowUpLong } from "react-icons/fa6";
import { FaStop } from "react-icons/fa6";
import React from "react";

type ButtonHandlerProps = {
  lang: 'en' | 'ar';
  isSending: boolean;
  onCancel: () => void;
  documents: boolean;
  search: boolean;
  quiz: boolean; // New prop
  activeButton: 'search' | 'documents' | 'quiz' | 'none';
  onButtonToggle: (button: 'search' | 'documents' | 'quiz' | 'none') => void;
};

function ButtonHandler({ lang, isSending, onCancel, documents, search, quiz, activeButton, onButtonToggle }: ButtonHandlerProps) {
  useEffect(() => {
    document.documentElement.setAttribute('go-search', search ? 'on' : 'off');
    document.documentElement.setAttribute('go-documents', documents ? 'on' : 'off');
    document.documentElement.setAttribute('go-quiz', quiz ? 'on' : 'off');
  }, [search, documents, quiz]);

  return (
    <>
      <button
        type={isSending ? "button" : "submit"}
        className="send-button"
        onClick={isSending ? onCancel : undefined}
      >
        {isSending ? <FaStop /> : <FaArrowUpLong />}
      </button>
      <div className="button-container">
        <button
          type="button"
          className={`search-button ${activeButton === 'search' ? 'active' : ''}`}
          onClick={() => onButtonToggle(activeButton === 'search' ? 'none' : 'search')}
        >
          {translations[lang].search}
        </button>
        <button
          type="button"
          className={`documents-button ${activeButton === 'documents' ? 'active' : ''}`}
          onClick={() => onButtonToggle(activeButton === 'documents' ? 'none' : 'documents')}
        >
          {translations[lang].documents}
        </button>
        <button
          type="button"
          className={`quiz-button ${activeButton === 'quiz' ? 'active' : ''}`}
          onClick={() => onButtonToggle(activeButton === 'quiz' ? 'none' : 'quiz')}
        >
          {translations[lang].quiz}
        </button>
      </div>
    </>
  );
}

export default ButtonHandler;