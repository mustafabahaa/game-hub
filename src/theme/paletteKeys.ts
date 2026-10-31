export type PaletteColorKey =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'playStation'
  | 'xbox'
  | 'pc'
  | 'gold';

export function isPaletteColorKey(value: string): value is PaletteColorKey {
  return ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'playStation', 'xbox', 'pc', 'gold'].includes(value);
}
