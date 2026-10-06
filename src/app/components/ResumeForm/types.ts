export type CreateHandleChangeArgsWithDescriptions<
  T extends { descriptions: unknown[] }
> =
  | [field: Exclude<keyof T, "descriptions">, value: string]
  | [field: "descriptions", value: T["descriptions"]];
