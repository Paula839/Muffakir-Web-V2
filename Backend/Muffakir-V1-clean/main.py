from config import settings

def main():
    # Access any config value like this:
    print("hello")
    print("Firecrawl API:", settings.FIRE_CRAWL_API)
    print("LLM model:", settings.LLM_MODEL_NAME)
    print("Output directory:", settings.OUTPUT_DIR)
    print("Provider:", settings.PROVIDER_NAME.value)
    print("Retrieve method:", settings.RETRIEVE_METHOD.name)

if __name__ == "__main__":
    main()
