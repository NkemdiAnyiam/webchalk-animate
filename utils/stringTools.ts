export function regexIndexOf(text: string, regex: RegExp, startpos: number = 0): number {
  const index = text.substring(startpos).search(regex);
  return (index >= 0) ? (index + startpos) : index;
}

export function regexIndexAfter(text: string, regex: RegExp, startpos: number = 0): number {
  const index = regexIndexOf(text, regex, startpos);
  return (index >= 0) ? (index + getLine(text, index).length) : index;
}

export function escapeRegex(string: string): string {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function getLine(text: string, index: number): string {
  return text.substring(index).split(/\r\n|\n/)[0];
}
