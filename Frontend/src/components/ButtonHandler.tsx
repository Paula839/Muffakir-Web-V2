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
  onUploadComplete: (doc: { file: File; title: string; content?: string }) => void;
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
  onButtonToggle,
  onUploadComplete 
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
  const files = Array.from(e.target.files || []);
  const pdfFiles = files.filter(file => file.type === "application/pdf");

  for (const file of pdfFiles) {
    // Read file name and optionally the content
    const reader = new FileReader();
    reader.onload = () => {
      const textContent = reader.result as string;

      onUploadComplete({
        title: file.name.replace(/\.pdf$/, ""), // Remove .pdf
        content: "", // or you could add part of textContent here
        file,
      });
    };
    reader.readAsText(file); // Optional: read as text, or skip this if not needed
  }

  // Clear the input to allow re-uploading same files
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};




  return (
    <>
      {/* Hidden file input for summary PDF upload */}
     <input
      type="file"
      accept=".pdf"
      multiple // ✅ Enable multiple files
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

        <button
        type="button"
        className={`upload-button ${activeButton === 'upload' ? 'active' : ''}`}
        onClick={() => {
          // if (activeButton === 'upload') {
            // onButtonToggle('none');
          // } else {
            onButtonToggle('upload');
            // 👇 Trigger the file input
            setTimeout(() => {
              fileInputRef.current?.click();
            }, 0);
          // }
        }}
      >
        {translations[lang].upload}
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
