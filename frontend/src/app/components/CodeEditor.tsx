"use client";

import React, { useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { linter, lintGutter } from "@codemirror/lint";
import { autocompletion } from "@codemirror/autocomplete";
import { cpp } from "@codemirror/lang-cpp";
import axios from "axios";

const CodeEditor = () => {
  const [code, setCode] = useState<string>(""); // Code content
  const [language, setLanguage] = useState<string>("javascript"); // Default language
  const [output, setOutput] = useState<string>(""); // Execution output
  const [error, setError] = useState<string | null>(null); // Error message state
  const [loading, setLoading] = useState<boolean>(false); // Loading state
  const languageMap: Record<string, number> = {
    javascript: 63,
    python: 71,
    java: 62,
    cpp: 54,
  };

  // Map languages to their respective CodeMirror extensions
  const languageExtensions: Record<string, any> = {
    javascript: javascript({ linter: true }),
    python: python({linter: true}),
    java: java({linter: true}),
    cpp: cpp({linter: true}),
  };

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLanguage = event.target.value;

    try {
      setLanguage(selectedLanguage);
      setCode("// Start coding in " + selectedLanguage + "...");
      setError(null); // Clear any existing errors
    } catch (err) {
      setError("Error changing the language. Please try again.");
    }
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      if (!code.trim()) {
        throw new Error("Code editor is empty. Please write some code.");
      }

      const languageId = languageMap[language];

      const response = await axios.post("https://judge0-ce.p.rapidapi.com/submissions", {
        language_id: languageId,
        source_code: code,
        stdin: "",
      }, {
        headers: {
          "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          "X-RapidAPI-Key": "", // Replace with your RapidAPI key
        },
        params: {
          base64_encoded: "false",
          wait: "true",
        },
      });

      const { stdout, stderr } = response.data;
      setOutput(stdout || stderr || "No output");
      setError(null); // Clear any existing errors
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally{
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Language Selection */}
      <div style={{ marginBottom: "10px" }}>
        <label htmlFor="language-select" style={{ marginRight: "10px" }}>
          Select Language:
        </label>
        <select
          id="language-select"
          value={language}
          onChange={handleLanguageChange}
          className="text-black"
          style={{ padding: "5px", fontSize: "16px" }}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
      </div>

      {/* CodeMirror Editor */}
      <CodeMirror
  value={code}
  height="500px"
  extensions={[
    languageExtensions[language],
    autocompletion(),
    lintGutter(),
    linter((view) => {
      const diagnostics: { from: number; to: number; severity: string; message: string; }[] = [];
      const lines = view.state.doc.toString().split("\n");

      switch (language) {
        case "javascript":
          // Linter for JavaScript
          lines.forEach((line, i) => {
            if (line.includes("console.log")) {
              diagnostics.push({
                from: view.state.doc.line(i + 1).from,
                to: view.state.doc.line(i + 1).to,
                severity: "warning",
                message: "Avoid using console.log in production code.",
              });
            }
          });
          break;

        case "python":
          // Linter for Python
          lines.forEach((line, i) => {
            if (line.includes("print(")) {
              diagnostics.push({
                from: view.state.doc.line(i + 1).from,
                to: view.state.doc.line(i + 1).to,
                severity: "warning",
                message: "Avoid using print statements in production code.",
              });
            }
            if (line.startsWith(" ")) {
              const spaces = line.match(/^ +/)?.[0].length || 0;
              if (spaces % 4 !== 0) {
                diagnostics.push({
                  from: view.state.doc.line(i + 1).from,
                  to: view.state.doc.line(i + 1).to,
                  severity: "warning",
                  message: "Python recommends 4 spaces for indentation.",
                });
              }
            }
          });
          break;

        case "java":
          // Linter for Java
          lines.forEach((line, i) => {
            if (line.includes("System.out.println")) {
              diagnostics.push({
                from: view.state.doc.line(i + 1).from,
                to: view.state.doc.line(i + 1).to,
                severity: "warning",
                message: "Avoid using System.out.println in production code.",
              });
            }
            if (line.includes("class ") && !line.trim().endsWith("{")) {
              diagnostics.push({
                from: view.state.doc.line(i + 1).from,
                to: view.state.doc.line(i + 1).to,
                severity: "error",
                message: "Classes in Java should start with an opening '{' on the same line.",
              });
            }
          });
          break;

        case "cpp":
        case "c":
          // Linter for C++/C
          lines.forEach((line, i) => {
            if (line.includes("printf(")) {
              diagnostics.push({
                from: view.state.doc.line(i + 1).from,
                to: view.state.doc.line(i + 1).to,
                severity: "warning",
                message: "Avoid using printf in modern C++ (consider std::cout).",
              });
            }
            if (line.includes("using namespace std;")) {
              diagnostics.push({
                from: view.state.doc.line(i + 1).from,
                to: view.state.doc.line(i + 1).to,
                severity: "warning",
                message: "Avoid using 'using namespace std;' in header files.",
              });
            }
          });
          break;

        default:
          // No linter for unsupported languages
          break;
      }

      return diagnostics;
    }),
  ]}
  theme="dark"
  onChange={(value) => setCode(value || "")}
/>


      {/* Run Button */}
      {loading ? <>
        <button
          disabled
          style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px" }}
        >
          Running...
        </button>
      </>:<>
      <button
        onClick={handleRun} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        style={{ marginTop: "10px", padding: "10px 20px", fontSize: "16px" }}
      >
        Run
      </button>
      </>}
      {/* Output and Errors */}
      {output && (
        <pre style={{ marginTop: "10px", backgroundColor: "#111", color: "#0f0", padding: "10px" }}>
          <strong>Output:</strong>
          <br />
          {output}
        </pre>
      )}
      {error && (
        <p style={{ color: "red", marginTop: "10px" }}>
          <strong>Error:</strong> {error}
        </p>
      )}
    </div>
  );
};

export default CodeEditor;
