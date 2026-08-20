declare module 'pdf-parse/lib/pdf-parse.js' {
  type PdfParseResult = {
    text: string;
  };

  type PdfParser = (buffer: Buffer) => Promise<PdfParseResult>;

  const parse: PdfParser;
  export default parse;
}
