export interface ExpiryOption {
  label: string
  value: number
}

export const EXPIRY_OPTIONS: ExpiryOption[] = [
  { label: '30分钟', value: 1000 * 60 * 30 },
]
