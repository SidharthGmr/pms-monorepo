import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { ExpenseController } from '../controllers/expense.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { validate } from '../middleware/validate';
import { expenseStatusValidator, expenseValidator } from '@pms/types';
import { Role } from '@prisma/client';

const STAFF_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.STAFF];
const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

const expenseRouter = Router();
const expenseController = container.get<ExpenseController>(TYPES.ExpenseController);

/**
 * @swagger
 * tags:
 *   - name: Expense
 *     description: Business expense management, posted to the accounting journal
 */

/**
 * @swagger
 * /expenses:
 *   post:
 *     summary: Record a new expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expenseAccountId, amount]
 *             properties:
 *               expenseDate: { type: string, format: date-time }
 *               expenseAccountId: { type: integer, example: 31 }
 *               paidFromAccountId: { type: integer, example: 1 }
 *               supplierId: { type: integer }
 *               partyType: { type: string, enum: [CUSTOMER, SUPPLIER, STAFF, OTHER] }
 *               partyId: { type: string }
 *               referenceNumber: { type: string }
 *               notes: { type: string }
 *               amount: { type: number, example: 15000 }
 *               taxId: { type: string, format: uuid }
 *               taxType: { type: string, enum: [WithTax, WithoutTax] }
 *               isInterState: { type: boolean }
 *               attachments: { type: array, items: { type: string } }
 *               status: { type: string, enum: [DRAFT, APPROVED, PAID] }
 *               isTemplate: { type: boolean }
 *               recurrenceInterval: { type: string, enum: [WEEKLY, MONTHLY, QUARTERLY, YEARLY] }
 *               recurrenceNextDate: { type: string, format: date-time }
 *               recurrenceEndDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Expense recorded
 *       400:
 *         description: Validation failed, the account is not an expense account, or store code not found
 *       401:
 *         description: User id not found on the token
 *       404:
 *         description: The account, tax or supplier was not found
 *     description: A DRAFT is recorded only. APPROVED debits the expense and credits Accounts Payable, so it stands as a liability. PAID debits the expense and credits the cash or bank account given in paidFromAccountId. GST is debited to the input accounts when the chart has them, and otherwise becomes part of the cost.
 */
expenseRouter.post('/', authenticateToken, authorization(STAFF_ROLES), validate(expenseValidator), asyncHandler(expenseController.create));

/**
 * @swagger
 * /expenses:
 *   get:
 *     summary: List expenses
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: recordPerPage
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFT, APPROVED, PAID, CANCELLED] }
 *       - in: query
 *         name: expenseAccountId
 *         schema: { type: integer }
 *       - in: query
 *         name: supplierId
 *         schema: { type: integer }
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: isTemplate
 *         schema: { type: boolean }
 *       - in: query
 *         name: showAllRecords
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortDirection
 *         schema: { type: string, enum: [ASC, DESC] }
 *     responses:
 *       200:
 *         description: Expenses fetched
 *     description: Recurring templates are excluded unless isTemplate is true, so a definition never shows up among real expenses.
 */
expenseRouter.get('/', authenticateToken, authorization(STAFF_ROLES), asyncHandler(expenseController.getAll));

/**
 * @swagger
 * /expenses/summary:
 *   get:
 *     summary: Expense totals and a breakdown by category
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: fromDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: toDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Expense summary fetched
 *       400:
 *         description: Store code not found
 *     description: Defaults to the current month. Paid, unpaid and draft totals are reported separately, because a draft is not yet a commitment and an unpaid expense is a liability rather than money gone.
 */
expenseRouter.get('/summary', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(expenseController.getSummary));

/**
 * @swagger
 * /expenses/run-recurring:
 *   post:
 *     summary: Generate the expenses that recurring templates have fallen due for
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       201:
 *         description: Recurring expenses generated
 *       400:
 *         description: Store code not found
 *       401:
 *         description: User id not found on the token
 *     description: Generated expenses land as drafts, so a person still confirms each one. Each template is rolled forward to its next due date, and running this twice in a day generates nothing the second time.
 */
expenseRouter.post('/run-recurring', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(expenseController.runRecurring));

/**
 * @swagger
 * /expenses/{id}:
 *   get:
 *     summary: Get one expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Expense fetched
 *       400:
 *         description: Invalid id
 *       403:
 *         description: The expense belongs to another store
 *     description: Includes the posted voucher number when the expense has reached the journal.
 */
expenseRouter.get('/:id', authenticateToken, authorization(STAFF_ROLES), asyncHandler(expenseController.getById));

/**
 * @swagger
 * /expenses/{id}:
 *   put:
 *     summary: Update an expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [expenseAccountId, amount]
 *             properties:
 *               expenseDate: { type: string, format: date-time }
 *               expenseAccountId: { type: integer }
 *               paidFromAccountId: { type: integer }
 *               supplierId: { type: integer }
 *               referenceNumber: { type: string }
 *               notes: { type: string }
 *               amount: { type: number }
 *               taxId: { type: string, format: uuid }
 *               taxType: { type: string, enum: [WithTax, WithoutTax] }
 *               isInterState: { type: boolean }
 *               attachments: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Expense updated
 *       400:
 *         description: Invalid id, a cancelled expense, or a posted amount being changed
 *       403:
 *         description: The expense belongs to another store
 *       404:
 *         description: Expense not found
 *     description: A draft is fully editable. Once the expense is posted only the descriptive fields change - the amount and the account are frozen, because the journal was written from them and editing them would leave the books disagreeing with the record.
 */
expenseRouter.put('/:id', authenticateToken, authorization(STAFF_ROLES), validate(expenseValidator), asyncHandler(expenseController.update));

/**
 * @swagger
 * /expenses/{id}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Expense deleted
 *       400:
 *         description: Invalid id, store code not found, or the expense is already posted
 *       403:
 *         description: The expense belongs to another store
 *       404:
 *         description: Expense not found
 *     description: Only a draft can be deleted. A posted expense is undone by reversing its voucher, because an accounting record is never removed.
 */
expenseRouter.delete('/:id', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(expenseController.delete));

/**
 * @swagger
 * /expenses/{id}/status:
 *   patch:
 *     summary: Approve, pay or cancel an expense
 *     tags: [Expense]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [APPROVED, PAID, CANCELLED] }
 *               paidFromAccountId: { type: integer }
 *               paymentDate: { type: string, format: date-time }
 *               note: { type: string, maxLength: 500 }
 *     responses:
 *       200:
 *         description: Expense status updated
 *       400:
 *         description: Invalid id, a transition that is not allowed, or PAID without a cash or bank account
 *       403:
 *         description: The expense belongs to another store
 *       404:
 *         description: Expense or account not found
 *     description: Transitions follow DRAFT to APPROVED to PAID; CANCELLED is only available while the expense is still a draft. Approving posts the cost against Accounts Payable; paying an approved expense posts a second voucher that settles the payable, while paying a draft posts one voucher that does both.
 */
expenseRouter.patch(
  '/:id/status',
  authenticateToken,
  authorization(STAFF_ROLES),
  validate(expenseStatusValidator),
  asyncHandler(expenseController.updateStatus)
);

export default expenseRouter;
