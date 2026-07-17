import * as Yup from 'yup';

export const receiveStockSchema = Yup.object().shape({
  supplierId: Yup.string().nullable().optional(),
  supplierName: Yup.string().nullable().optional(),
  invoiceNumber: Yup.string().nullable().optional(),
  invoiceUrl: Yup.string().nullable().optional(),
  notes: Yup.string().nullable().optional(),
  totalAmount: Yup.number().default(0),
  items: Yup.array()
    .of(
      Yup.object().shape({
        productId: Yup.number().typeError('Product is required').required('Product is required'),
        quantity: Yup.number().typeError('Quantity is required').min(1, 'Quantity must be at least 1').required('Quantity is required'),
        unitCost: Yup.number().typeError('Unit cost is required').min(0, 'Unit cost must be >= 0').required('Unit cost is required'),
        totalCost: Yup.number().default(0),
      })
    )
    .min(1, 'At least one item is required')
    .required(),
});

export type ReceiveStockFormValues = Yup.InferType<typeof receiveStockSchema>;
