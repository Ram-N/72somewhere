export type LocationFilter = {
  type: "region" | "subRegion" | "country" | "city";
  label: string;
  filterField: string;
  filterValue: string;
};
