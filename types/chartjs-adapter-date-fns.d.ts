// Type declarations for chartjs-adapter-date-fns
declare module 'chartjs-adapter-date-fns' {
  const dateFnsAdapter: {
    id: string
    formats: () => Record<string, string>
    parse: (value: string | number | Date) => Date | null
    format: (date: Date, format: string, options?: Record<string, unknown>) => string
    add: (date: Date, amount: number, unit: string) => Date
    subtract: (date: Date, amount: number, unit: string) => Date
    difference: (date1: Date, date2: Date, unit: string) => number
    startOf: (date: Date, unit: string) => Date
    endOf: (date: Date, unit: string) => Date
    isValid: (date: unknown) => boolean
  }
  export default dateFnsAdapter
}
