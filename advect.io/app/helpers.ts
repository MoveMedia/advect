export function pgDataTypeToHtmlInputType(pgDataType: string, name: string): string {
  switch (pgDataType) {
    case 'character varying':
    case 'text':
      if (name === 'password') {
        return 'password'
      }
      return 'text'
    case 'integer':
      return 'number'
    case 'boolean':
      return 'checkbox'
    case 'timestamp with time zone':
      return 'datetime-local'
    default:
      return 'text'
  }
}
