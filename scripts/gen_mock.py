def main(out_dir: str):
    pass

if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "data/mock"
    main(out)
