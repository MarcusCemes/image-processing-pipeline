/** Replace all backslashes "\\" wth forward slashes "/" for cross-platform path compatibility */
export function slash(path: string): string {
  return path.replace(/\\/g, "/");
}
