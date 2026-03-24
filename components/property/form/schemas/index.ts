import { houseChaletSchema } from './type1';
import { PropertyFormSchema } from './types';

export const getSchemaByTypeId = (typeId: number): PropertyFormSchema | null => {
  switch (typeId) {
    case 1:
      return houseChaletSchema;
    // Agregaremos mas tipos (4, 9, 13, 15) progresivamente
    default:
      return null;
  }
};
