export function dedent(text: string, tabLength: number = 2) {
  // split lines by carriage return + newline or newline
  // then replace all leading tabs (or leading tabs mixed with leading spaces) with spaces
  const lines = text
    .split(/\r\n|\n/)
    .map(line => {
      const leadSpacesAndTabs = line.match(/^\s*/)?.[0] ?? '';
      return `${leadSpacesAndTabs.replaceAll(/\t/g, ' '.repeat(tabLength))}${line.trimStart()}`;
    });

  // find the minimum amount of leading spaces across the lines (not including empty lines)
  let minIndent = Infinity;
  for (const line of lines) {
    if (line === '') { continue; }
    const leadSpaces = line.match(/^\s*/)?.[0] ?? '';
    minIndent = Math.min(minIndent, leadSpaces.length);
  }

  // return the joined lines with the beginnings trimmed by the minimum amount of leading spaces
  return lines
    .map(line => line !== '' ? line.substring(minIndent) : '')
    .join('\n');
}
