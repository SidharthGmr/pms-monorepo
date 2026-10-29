import { Status } from '@pms/types';
import * as Yup from 'yup';

/**
 * `code` is the stable key other features select by, so it is constrained to an
 * uppercase snake token here exactly as the API's zod schema does.
 */
export const MasterAttributeSchema = Yup.object().shape({
  name: Yup.string().max(100, 'Name is too long').required('Name is required'),
  code: Yup.string()
    .max(50, 'Code is too long')
    .matches(/^[A-Z][A-Z0-9_]*$/, 'Use uppercase letters, numbers and underscores (e.g. SIZE, SHOE_SIZE)')
    .required('Code is required'),
  // Both scopes are optional - leaving them empty makes the attribute global.
  categoryId: Yup.number().nullable().optional(),
  brandNameId: Yup.number().nullable().optional(),
  status: Yup.mixed<Status>().oneOf(['Published', 'Draft', 'Trash']).required('Status is required'),
  displayOrder: Yup.number().nullable().optional(),
});

/**
 * Add collects a list of values and creates one entry per item; edit works on the single row
 * it opened, so both forms share this shape with the array holding exactly one entry.
 */
export const MasterEntrySchema = Yup.object().shape({
  attributeId: Yup.number().min(1, 'Please pick an attribute').required('Attribute is required'),
  values: Yup.array()
    .of(Yup.string().trim().max(100, 'Value is too long').required('Value is required'))
    .min(1, 'Add at least one value')
    .required('Add at least one value')
    .test('unique', 'Remove the repeated values', (list) => {
      const filled = (list ?? []).map((value) => (value ?? '').trim()).filter(Boolean);
      return new Set(filled).size === filled.length;
    }),
  status: Yup.mixed<Status>().oneOf(['Published', 'Draft', 'Trash']).required('Status is required'),
  displayOrder: Yup.number().nullable().optional(),
});
