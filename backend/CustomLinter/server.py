from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import subprocess
import json

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with specific origins for production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

class CodeRequest(BaseModel):
    code: str

@app.post("/lint")
async def lint_code(request: CodeRequest):
    try:
        # Save the code to a temporary file
        with open("temp.py", "w") as temp_file:
            temp_file.write(request.code)

        # Run Ruff and capture the output
        result = subprocess.run(
            ["ruff", "check", "temp.py", "--output-format", "json"],  # Fix command to lint the file
            text=True,
            capture_output=True,
        )

        # Check if there's any output to parse
        if result.stdout:
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                return {"error": "Failed to decode JSON output from ruff", "details": result.stdout}
        else:
            return {"error": "No output from ruff", "stderr": result.stderr}
    except Exception as e:
        return {"error": str(e)}
