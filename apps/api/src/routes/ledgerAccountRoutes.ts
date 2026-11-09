import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { LedgerAccountController } from '../controllers/ledger-account.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { validate } from '../middleware/validate';
import { ledgerAccountValidator } from '@pms/types';
import { Role } from '@prisma/client';

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

const ledgerAccountRouter = Router();
const ledgerAccountController = container.get<LedgerAccountController>(TYPES.LedgerAccountController);

/**
 * @swagger
 * tags:
 *   - name: LedgerAccount
 *     description: Chart of accounts - the ledger accounts every journal line posts against
 */

/**
 * @swagger
 * /ledger-accounts:
 *   post:
 *     summary: Create a ledger account
 *     description: storeCode is taken from the authenticated user's token. A parent must share the child's category.
 *     tags: [LedgerAccount]
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
 *             required: [code, name, category]
 *             properties:
 *               code: { type: string, example: "5250" }
 *               name: { type: string, example: "Packaging Expense" }
 *               category: { type: string, enum: [ASSET, LIABILITY, EQUITY, INCOME, EXPENSE] }
 *               subType: { type: string, enum: [CASH, BANK, RECEIVABLE, PAYABLE, TAX_INPUT, TAX_OUTPUT, INVENTORY, OTHER] }
 *               parentId: { type: integer }
 *               description: { type: string }
 *               isActive: { type: boolean }
 *               status: { type: string, enum: [Published, Draft, Trash] }
 *               displayOrder: { type: integer }
 *     responses:
 *       201:
 *         description: The account was created
 *       400:
 *         description: Validation failed, the parent category differs, or the code is already used in this store
 *       401:
 *         description: The token carries no user id
 *       404:
 *         description: The parent account does not exist in this store
 */
ledgerAccountRouter.post('/', authenticateToken, authorization(ADMIN_ROLES), validate(ledgerAccountValidator), asyncHandler(ledgerAccountController.create));

/**
 * @swagger
 * /ledger-accounts:
 *   get:
 *     summary: List ledger accounts
 *     tags: [LedgerAccount]
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
 *         schema: { type: string, enum: [Published, Draft, Trash] }
 *       - in: query
 *         name: category
 *         schema: { type: string, enum: [ASSET, LIABILITY, EQUITY, INCOME, EXPENSE] }
 *       - in: query
 *         name: subType
 *         schema: { type: string, enum: [CASH, BANK, RECEIVABLE, PAYABLE, TAX_INPUT, TAX_OUTPUT, INVENTORY, OTHER] }
 *       - in: query
 *         name: parentId
 *         schema: { type: integer }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: postableOnly
 *         schema: { type: boolean }
 *       - in: query
 *         name: showAllRecords
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [code, name, category, subType, displayOrder, createdAt, updatedAt, id] }
 *       - in: query
 *         name: sortDirection
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: A page of ledger accounts
 */
ledgerAccountRouter.get('/', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(ledgerAccountController.getAll));

/**
 * @swagger
 * /ledger-accounts/tree:
 *   get:
 *     summary: The whole chart of accounts as a tree
 *     tags: [LedgerAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       200:
 *         description: Root accounts, each carrying its children
 *       400:
 *         description: The token carries no store code
 */
ledgerAccountRouter.get('/tree', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(ledgerAccountController.getTree));

/**
 * @swagger
 * /ledger-accounts/{id}:
 *   get:
 *     summary: Get one ledger account
 *     tags: [LedgerAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: The account
 *       400:
 *         description: The id is not a number, or the token carries no store code
 *       404:
 *         description: No such account in this store
 */
/**
 * @swagger
 * /ledger-accounts/trial-balance:
 *   get:
 *     summary: Every account's net position for a period
 *     description: Derived from journal lines on read, never stored. A non-zero difference means something was posted out of balance and is reported rather than hidden.
 *     tags: [LedgerAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: includeReversed
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: One row per account with a balance, plus the two column totals
 *       400:
 *         description: The token carries no store code
 */
ledgerAccountRouter.get('/trial-balance', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(ledgerAccountController.getTrialBalance));

/**
 * @swagger
 * /ledger-accounts/profit-loss:
 *   get:
 *     summary: Profit and loss for a period
 *     description: Income and expense movement over the window, derived from journal lines on read. Purchases are shown as direct costs above gross profit; the application runs periodic inventory, so unsold stock still sits inside the purchases figure.
 *     tags: [LedgerAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: includeReversed
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Income, direct costs, expenses and the gross and net profit lines
 *       400:
 *         description: The token carries no store code
 */
ledgerAccountRouter.get('/profit-loss', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(ledgerAccountController.getProfitLoss));

/**
 * @swagger
 * /ledger-accounts/{id}/statement:
 *   get:
 *     summary: One account's ledger statement for a period
 *     description: Opening balance, every movement in date order with a running balance, and the closing balance - all derived from journal lines, nothing stored. Pass partyType and partyId to narrow a control account to one customer or supplier, which is how the customer and supplier ledgers are produced.
 *     tags: [LedgerAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: partyType
 *         schema: { type: string, enum: [CUSTOMER, SUPPLIER, STAFF, OTHER] }
 *       - in: query
 *         name: partyId
 *         schema: { type: string }
 *       - in: query
 *         name: includeReversed
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: The statement, with opening, running and closing balances
 *       400:
 *         description: The id is not a number, or the token carries no store code
 *       404:
 *         description: No such account in this store
 */
ledgerAccountRouter.get('/:id/statement', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(ledgerAccountController.getStatement));

ledgerAccountRouter.get('/:id', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(ledgerAccountController.getById));

/**
 * @swagger
 * /ledger-accounts/{id}:
 *   put:
 *     summary: Update a ledger account
 *     description: A system account keeps its code and category; only its label, parent and activity can change.
 *     tags: [LedgerAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, category]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               category: { type: string, enum: [ASSET, LIABILITY, EQUITY, INCOME, EXPENSE] }
 *               subType: { type: string, enum: [CASH, BANK, RECEIVABLE, PAYABLE, TAX_INPUT, TAX_OUTPUT, INVENTORY, OTHER] }
 *               parentId: { type: integer }
 *               description: { type: string }
 *               isActive: { type: boolean }
 *               status: { type: string, enum: [Published, Draft, Trash] }
 *               displayOrder: { type: integer }
 *     responses:
 *       200:
 *         description: The updated account
 *       400:
 *         description: Validation failed, a system field was changed, the code is taken, or the move would create a cycle
 *       401:
 *         description: The token carries no user id
 *       404:
 *         description: No such account, or the parent does not exist in this store
 */
ledgerAccountRouter.put('/:id', authenticateToken, authorization(ADMIN_ROLES), validate(ledgerAccountValidator), asyncHandler(ledgerAccountController.update));

/**
 * @swagger
 * /ledger-accounts/{id}:
 *   delete:
 *     summary: Move a ledger account to Trash
 *     tags: [LedgerAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200:
 *         description: The trashed account
 *       400:
 *         description: The account is a system account, already has postings, or still holds children
 *       404:
 *         description: No such account in this store
 */
ledgerAccountRouter.delete('/:id', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(ledgerAccountController.delete));

/**
 * @swagger
 * /ledger-accounts/seed-defaults:
 *   post:
 *     summary: Create the default chart of accounts for this store
 *     description: Idempotent - an account whose code already exists is left untouched, so re-running never overwrites a chart that has been adjusted.
 *     tags: [LedgerAccount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *     responses:
 *       201:
 *         description: The accounts that were added, which is empty when the chart was already set up
 *       400:
 *         description: The token carries no store code
 *       401:
 *         description: The token carries no user id
 */
ledgerAccountRouter.post('/seed-defaults', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(ledgerAccountController.seedDefaults));

export default ledgerAccountRouter;
