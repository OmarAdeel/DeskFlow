export function createMessageId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
