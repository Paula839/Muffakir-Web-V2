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
  quiz: boolean;
  youtubeSearch: boolean;
  summary: boolean;
  upload: boolean;
  activeButton: 'search' | 'documents' | 'quiz' | 'youtube' | 'summary' | 'upload' | 'none';
  onButtonToggle: (button: 'search' | 'documents' | 'quiz' | 'youtube' | 'summary' | 'upload' | 'none') => void;
};

function ButtonHandler({ 
  lang, 
  isSending, 
  onCancel, 
  documents, 
  search, 
  quiz, 
  youtubeSearch, 
  summary, 
  upload, 
  activeButton, 
  onButtonToggle 
}: ButtonHandlerProps) {

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSummaryClick = () => {
    if (activeButton === 'summary') {
      onButtonToggle('none');
    } else {
      onButtonToggle('summary');
      // Trigger file input
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("http://localhost:8000/api/summarize", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Summarization failed");
        const data = await res.json();

        // TODO: Use this summary however you want (e.g., add to messages or documents)
        console.log("Summary:", data.summary);
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }
  };

  return (
    <>
      {/* Hidden file input for summary PDF upload */}
      <input
        type="file"
        accept=".pdf"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Main send/cancel button */}
      <button
        type="submit"
        className="send-button"
        onClick={(e) => {
          if (isSending) {
            e.preventDefault(); // 👈 Prevent form submission
            onCancel();         // 👈 Cancel typing
          }
          // Else: allow normal submit
        }}
      >
        {isSending ? <FaStop /> : <FaArrowUpLong />}
      </button>

      {/* Functional button group */}
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

        <button
          type="button"
          className={`youtube-button ${activeButton === 'youtube' ? 'active' : ''}`}
          onClick={() => onButtonToggle(activeButton === 'youtube' ? 'none' : 'youtube')}
        >
          {translations[lang].youtubeSearch}
        </button>

        {/* <button
          type="button"
          className={`summary-button ${activeButton === 'summary' ? 'active' : ''}`}
          onClick={handleSummaryClick}
        >
          {translations[lang].summary}
        </button> */}
      </div>
    </>
  );
}

export default ButtonHandler;
