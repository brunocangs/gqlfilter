declare module "bc-graphql-filter" {
  export default function gqlFilter<T>(obj: object, filter: string): T;
}
