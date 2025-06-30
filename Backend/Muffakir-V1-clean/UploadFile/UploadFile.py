from TextProcessor.ArabicBookProcessor import ArabicBookProcessor
from RAGPipeline.RAGPipelineManager import RAGPipelineManager
from VectorDB.ChromaDBManager import ChromaDBManager
import os
from dotenv import load_dotenv

load_dotenv()

new_db_path = os.getenv("NEW_DB_PATH")

class UploadFile:
    # print("YES???")
    def __init__(self, file_path: str, model_name: str = 'mohamed2811/Muffakir_Embedding'):
        # print("NOOO??")
        """
        Initialize with a single PDF file path.
        """
        self.file_path = file_path
        self.model_name = model_name

        # Set up database manager
        self.db_manager = ChromaDBManager(
            path=new_db_path,
            collection_name="new_data",
            model_name=self.model_name
        )

    def upload(self):
        # print("IM FROM UPLOAD")
        """
        Process the single PDF file and upload chunks to the vector DB.
        """
        if not self.file_path.lower().endswith('.pdf'):
            raise ValueError("UploadFile only supports PDF files.")

        # Process PDF
        # print(self.file_path)
        processor = ArabicBookProcessor(self.file_path)
        processed_docs = processor.process_documents()
        # print("LEEEEEEEEEEEEEEEEEe")
        # print(processed_docs)
        # Add to database
        self.db_manager.add_documents(processed_docs)
        # print(f"Uploaded {len(processed_docs)} chunks from {os.path.basename(self.file_path)}")

        # print("File uploaded to", new_db_path)
        return new_db_path