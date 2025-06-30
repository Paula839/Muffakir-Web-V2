from langchain_community.document_loaders import PyPDFLoader
from langchain.schema import Document
import re
import os

from TextProcessor.TextProcessor import *

class ArabicBookProcessor:
    def __init__(self, file_path: str):
        """
        Initialize with a single PDF file path.
        """
        self.file_path = file_path
        self.text_processor = TextProcessor()

    def load_documents(self) -> list[Document]:
        """Load all pages from the PDF as Documents."""
        # Use PyPDFLoader to read PDF pages
        loader = PyPDFLoader(self.file_path)
        # print("elpath felprocess =", self.file_path)
        # print("elloader felprocess =", loader)
        documents = loader.load()
        # print("eldocs felprocess =", documents)

        return documents

    def split_by_pages(self, documents: list[Document]) -> list[Document]:
        """Split document content by explicit page markers (if any) and preserve metadata."""
        page_documents = []
        for doc in documents:
            original_metadata = doc.metadata
            # Each doc from PyPDFLoader represents a page, but in case markers exist:
            pages = re.split(r'(?=رقم الصفحه|Page number)', doc.page_content)
            for page in pages:
                if not page.strip():
                    continue
                page_number = None
                arabic_match = re.search(r'رقم الصفحه\s*[:]?\s*(\d+)', page)
                if arabic_match:
                    page_number = arabic_match.group(1)
                    page = re.sub(r'رقم الصفحه\s*[:]?\s*\d+\s*', '', page)
                english_match = re.search(r'Page number[:]?\s*(\d+)', page)
                if english_match:
                    page_number = english_match.group(1)
                    page = re.sub(r'Page number[:]?\s*\d+\s*', '', page)
                # If no explicit marker, use loader page index
                if not page_number and 'page_number' in original_metadata:
                    page_number = str(original_metadata['page_number'])
                if page_number:
                    new_metadata = original_metadata.copy()
                    new_metadata['page_number'] = page_number
                    book_name = os.path.splitext(os.path.basename(self.file_path))[0]
                    new_metadata['source'] = f"اسم الكتاب: {book_name} - رقم الصفحة: {page_number}"
                    page_doc = Document(
                        page_content=page.strip(),
                        metadata=new_metadata
                    )
                    page_documents.append(page_doc)
        return page_documents

    def process_documents(self, chunk_size: int = 600, chunk_overlap: int = 200) -> list[Document]:
        """
        Load PDF, split by pages, and chunk text into smaller documents.
        """
        # Load all pages from PDF
        documents = self.load_documents()
        # Split into finer pages if needed
        # page_documents = self.split_by_pages(documents)
        # Process and chunk
        final_documents = self.text_processor.process_documents(
            documents=documents,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        return final_documents