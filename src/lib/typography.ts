export const typography = {
  heading: {
    h1: 'text-5xl font-extrabold tracking-tight',
    h2: 'text-3xl font-bold tracking-tight',
    h3: 'text-xl font-semibold tracking-tight',
  },
  body: {
    default: 'text-base leading-7',
    sm: 'text-sm leading-6',
    muted: 'text-sm leading-6 text-muted-foreground',
  },
  label: {
    default: 'text-sm font-medium leading-none',
    sm: 'text-xs font-medium leading-none',
  },
} as const

type TypographyCategory = typeof typography
export type TextVariant = {
  [K in keyof TypographyCategory]: `${K}.${string & keyof TypographyCategory[K]}`
}[keyof TypographyCategory]
