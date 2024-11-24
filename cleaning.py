import csv

def add_br_tag_to_examples(input_csv, output_csv):
    # Open the input CSV file for reading
    with open(input_csv, mode='r', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        rows = []

        # Process each row
        for row in reader:
            updated_row = []
            for cell in row:
                # Add <br/> after "Examples :"
                if "Examples:" in cell:
                    cell = cell.replace("Examples:", "<br/> Examples <br/>:")
                if "Output:" in cell:
                    cell = cell.replace("Output:", "<br/> Output:")
                if "Explanation:" in cell:
                    cell = cell.replace("Explanation:", "<br/> Explanation:")
                if "Constraints:" in cell:
                    cell = cell.replace("Constraints:", "<br/> Constraints:")
                updated_row.append(cell)
            rows.append(updated_row)

    # Write the updated content to a new CSV file
    with open(output_csv, mode='w', encoding='utf-8', newline='') as outfile:
        writer = csv.writer(outfile)
        writer.writerows(rows)

    print(f"Updated content has been saved to {output_csv}")

# Specify the input and output CSV file paths
input_csv = "leetcode_questions.csv"
output_csv = "output.csv"

# Call the function
add_br_tag_to_examples(input_csv, output_csv)
