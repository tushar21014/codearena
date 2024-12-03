from pymongo import MongoClient
import csv
import google.generativeai as genai

# Connect to MongoDB
client = MongoClient("mongodb://127.0.0.1:27017/")

# Access database
db = client["codearena"]

# Access collection
collection = db["questions"]

# Configure Google Gemini API
genai.configure(api_key="")
model = genai.GenerativeModel("gemini-1.5-flash")

# Define the file path for the CSV
csv_file = "C:/Users/tg210/OneDrive/Desktop/Codes/vips sem1/CodeArena/updatedStubs.csv"

# Open the CSV file in append mode
with open(csv_file, mode='a', newline='') as file:
    # Create a CSV writer object
    writer = csv.writer(file)

    # Iterate over the next 30 questions in the collection (skipping the first 10)
    for question in collection.find().skip(67).limit(30):
        question_id = question["_id"]
        question_content = question["Content"]
        example = '''
        #include <bits/stdc++.h> 
        using namespace std;
        // } Driver Code Ends
        class Solution { public:
            int minChar(string& s) { // write your code here
            }
        };
        // Driver Code Starts.
        int main() { 
            int t;
            cin >> t;
            while (t--) {
                string str;
                cin >> str; 
                Solution ob;
                int ans = ob.minChar(str); 
                cout << ans << endl;
                cout << "~" << "\n";
            }
            return 0;
        }
        '''
        # Prepare the prompt
        prompt = (
            "I will provide you with a detailed description of the problem. "
            "I want you to just write code stub for the problem in 3 languages. If you found any problem regarding input or output, you can change accordingly. "
            "i.e., c++, python, java. I want it to use in a csv so generate accordingly. Remember to write only the starter code. There is no need to write the entire code. \n\n. Here is a sample example " 
            f"{example} Here is the question: {question_content}"
        )

        try:
            # Generate stubs using Google Gemini API
            response = model.generate_content(prompt)
            response_text = response.text

            # Extract language-specific stubs from the response
            def extract_stub(response_text, language):
                start_marker = f"```{language.lower()}"
                end_marker = "```"
                start_idx = response_text.find(start_marker) + len(start_marker)
                end_idx = response_text.find(end_marker, start_idx)
                return response_text[start_idx:end_idx].strip() if start_idx >= len(start_marker) else ""

            cplusplus_stub = extract_stub(response_text, "cpp")
            python_stub = extract_stub(response_text, "python")
            java_stub = extract_stub(response_text, "java")
        except Exception as e:
            # If an error occurs, log it and leave empty spaces for the stubs
            print(f"Error generating stubs for question {question_id}: {e}")
            cplusplus_stub = ""
            python_stub = ""
            java_stub = ""

        # Write the stubs (or empty spaces) to the CSV file
        writer.writerow([question_id, cplusplus_stub, python_stub, java_stub])

        print(f"Stubs processed for question: {question_id}")

print(f"Stubs have been successfully appended to {csv_file}")
