'use client';

import { useEffect, useState } from "react";
import translations from "../translations/translations";
import { FaArrowUpLong } from "react-icons/fa6";
import { FaStop } from "react-icons/fa6";
import React from "react";

type ButtonHandlerProps = {
  lang: 'en' | 'ar';
  isSending: boolean;
  onCancel: () => void;
  documents: boolean;
  onDocumentsToggle: () => void;
};

function ButtonHandler({ lang, isSending, onCancel, documents, onDocumentsToggle  }: ButtonHandlerProps) {
  const [search, setSearch] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('go-search', search ? 'on' : 'off');
    document.documentElement.setAttribute('go-documents', documents ? 'on' : 'off');
  }, [search, documents]);

  return (
    <>
      <button
        type={isSending ? "button" : "submit"}
        className="send-button"
        onClick={isSending  ? onCancel : undefined}
      >
        {isSending ? <FaStop /> : <FaArrowUpLong />}
      </button>
      <div className="button-container">
        <button type="button" className="search-button" onClick={() => setSearch(!search)}>
          {translations[lang].search}
        </button>
        <button 
        type="button" 
        className={`documents-button ${documents ? 'active' : ''}`}
        onClick={onDocumentsToggle}
      >
        {translations[lang].documents}
      </button>
      </div>
    </>
  );
}

export default ButtonHandler;
