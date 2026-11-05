export const typography = {
  heading: {
    h1: "text-3xl font-bold tracking-tight text-foreground",
    h2: "text-2xl font-bold tracking-tight text-foreground",
    h3: "text-lg font-semibold tracking-tight text-foreground",
  },
  body: {
    default: "text-base leading-relaxed text-foreground",
    sm: "text-sm leading-normal text-foreground",
    muted: "text-sm text-muted-foreground",
  },
  label: {
    default: "text-sm font-medium leading-none text-foreground",
    sm: "text-xs font-medium leading-none text-foreground",
  },
} as const;

type Typography = typeof typography;

export type TextVariant = {
  [Category in keyof Typography]: `${Category}.${string & keyof Typography[Category]}`;
}[keyof Typography];
