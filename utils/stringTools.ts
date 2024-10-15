export function regexIndexOf(text: string, regex: RegExp, startpos: number = 0): number {
  const index = text.substring(startpos).search(regex);
  return (index >= 0) ? (index + startpos) : index;
}

// export function regexIndexAfter(text: string, regex: RegExp, startpos: number = 0): number {
//   const index = regexIndexOf(text, regex, startpos);
//   return (index >= 0) ? (index + getLine(text, index).length) : index;
// }

export function getTagMatch(text: string, regex: RegExp, startpos: number = 0) {
  return text.substring(startpos).match(regex)?.[0];
}

export function getTagMatches(text: string, regex: RegExp, startpos: number = 0) {
  return [...text.substring(startpos).matchAll(new RegExp(regex, 'g'))].map(match => match[0]);
}

export function escapeRegex(string: string): string {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function getLine(text: string, searchText: string, searchStart: number = 0): string {
  return text.substring(searchStart).split(/\r\n|\n/).find(str => str.includes(searchText)) ?? '';
}
