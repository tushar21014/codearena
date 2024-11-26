import { linter, Diagnostic } from "@codemirror/lint";
import axios from "axios";
import debounce from "lodash.debounce";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@uiw/react-codemirror";
interface LintResult {
  location: {
    row: number;
    column: number;
  };
  end_location: {
    row: number;
    column: number;
  };
  message: string;
}

export const lintCodeWithRuff = async (code: string): Promise<LintResult[]> => {
  try {
    const response = await axios.post("http://localhost:8000/lint", { code });
    console.log("Linting response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error linting code with Ruff:", error);
    return [];
  }
};

export const processDiagnostics = (results: LintResult[], state: EditorState): Diagnostic[] => {
  return results.map((result) => {
    const fromLine = result.location.row - 1; // Convert to 0-based index
    const toLine = result.end_location.row - 1; // Convert to 0-based index

    return {
      from: state.doc.line(fromLine).from + result.location.column - 1,
      to: state.doc.line(toLine).from + result.end_location.column - 1,
      severity: "error",    
      message: result.message,
    };
  });
};


export const debouncedLintCodeWithRuff = debounce(async (code: string, view: EditorView) => {
  const results = await lintCodeWithRuff(code);
  const diagnostics = processDiagnostics(results, view.state);

  view.dispatch({
    effects: linter.of(diagnostics),
  });
}, 300);

