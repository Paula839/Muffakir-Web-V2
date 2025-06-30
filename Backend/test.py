try:
    import pypdf
    print("pypdf loaded successfully.")
except ImportError as e:
    print("NOT LOADED:", e)
