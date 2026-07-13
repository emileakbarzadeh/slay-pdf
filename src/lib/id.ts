export function uid(prefix = 'id') {
  return `${prefix}-${crypto.randomUUID()}`
}
