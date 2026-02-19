import sys
import os
from pdf2docx import Converter


def main():
    if len(sys.argv) < 3:
        print("Usage: python pdf_to_docx.py <input_pdf> <output_docx>")
        sys.exit(1)

    input_pdf = sys.argv[1]
    output_docx = sys.argv[2]

    try:
        # Check if input file exists
        if not os.path.exists(input_pdf):
            print(f"Error: Input file {input_pdf} not found")
            sys.exit(1)

        cv = Converter(input_pdf)
        cv.convert(output_docx)
        cv.close()
        print("Success")
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()