export interface PropertyType {
  id: number;
  name: string;
  description?: string;
}

export interface OperationOption {
  id: string;
  label: string;
  operationType: string;
  useSalePrice: boolean;
  useRentalPrice: boolean;
}

export interface PropertyFormState {
  title: string;
  sale_price: string;
  rental_price: string;
  address: string;
  city: string;
  province: string;
  country: string;
  postal_code: string;
  latitude: string;
  longitude: string;
  description: string;
  page_url: string;
  [key: string]: string | string[] | number | boolean | null;
}

export interface MediaAsset {
  uri: string;
  name: string;
  type: string;
  size?: number | null;
  file?: File;
}
