export interface ILoggerObject {
    code?: string;
    frame?: string;
    name?: string;
    start?: { column?: string; line?: number };
    loc?: { line?: number; file?: string; column?: number };
    error?: Error;
    filename?: string;
}
