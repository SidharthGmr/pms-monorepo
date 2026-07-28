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
  description: Yup.string().max(500, 'Description is too long').nullable().optional(),
  unit: Yup.string().max(20, 'Unit is too long').nullable().optional(),
  status: Yup.string().required('Status is required'),
  displayOrder: Yup.number().nullable().optional(),
});

export const MasterEntrySchema = Yup.object().shape({
  attributeId: Yup.number().min(1, 'Please pick an attribute').required('Attribute is required'),
  name: Yup.string().max(100, 'Name is too long').required('Name is required'),
  value: Yup.string().max(100, 'Value is too long').required('Value is required'),
  colorHex: Yup.string()
    .matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, { message: 'Use a hex colour like #FF0000', excludeEmptyString: true })
    .nullable()
    .optional(),
  status: Yup.string().required('Status is required'),
  displayOrder: Yup.number().nullable().optional(),
});
