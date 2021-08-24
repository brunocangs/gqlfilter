declare module "bc-graphql-filter" {
  export default function gqlFilter<T>(obj: object, filter: string): T;
  export function bulkFilter<T, U>(obj: U, filter: { [I in keyof U]: U[I] });
}
