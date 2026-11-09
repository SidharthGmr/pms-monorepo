import { Router } from 'express';
import { container } from '../config/ioc.config';
import { TYPES } from '../config/ioc.types';
import { JournalEntryController } from '../controllers/journal-entry.controller';
import asyncHandler from '../middleware/asyncHandler.middleware';
import { authenticateToken } from '../middleware/authentication.middleware';
import authorization from '../middleware/authorization.middleware';
import { validate } from '../middleware/validate';
import { accountingBackfillValidator, journalEntryValidator, reverseJournalEntryValidator } from '@pms/types';
import { Role } from '@prisma/client';

const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];

const journalEntryRouter = Router();
const journalEntryController = container.get<JournalEntryController>(TYPES.JournalEntryController);

/**
 * @swagger
 * tags:
 *   - name: JournalEntry
 *     description: The accounting journal - posted vouchers and their debit/credit lines
 */

/**
 * @swagger
 * /journal-entries:
 *   post:
 *     summary: Post a manual journal entry
 *     description: storeCode is taken from the authenticated user's token. Debits must equal credits, and every account must be an active leaf of this store's chart.
 *     tags: [JournalEntry]
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
 *             required: [lines]
 *             properties:
 *               voucherType: { type: string, enum: [JOURNAL, OPENING] }
 *               entryDate: { type: string, format: date-time }
 *               narration: { type: string }
 *               referenceNumber: { type: string }
 *               lines:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [ledgerAccountId]
 *                   properties:
 *                     ledgerAccountId: { type: integer }
 *                     debit: { type: number, example: 1000 }
 *                     credit: { type: number, example: 0 }
 *                     narration: { type: string }
 *                     partyType: { type: string, enum: [CUSTOMER, SUPPLIER, STAFF, OTHER] }
 *                     partyId: { type: string }
 *     responses:
 *       201:
 *         description: The posted entry with its lines
 *       400:
 *         description: The lines do not balance, an account is inactive or a group heading, or the financial year is closed
 *       401:
 *         description: The token carries no user id
 *       404:
 *         description: A referenced ledger account does not exist in this store
 */
journalEntryRouter.post('/', authenticateToken, authorization(ADMIN_ROLES), validate(journalEntryValidator), asyncHandler(journalEntryController.create));

/**
 * @swagger
 * /journal-entries:
 *   get:
 *     summary: List journal entries
 *     description: This is the read the Day Book is built on - filtering by date range, voucher type, account or party.
 *     tags: [JournalEntry]
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
 *         name: voucherType
 *         schema: { type: string, enum: [OPENING, JOURNAL, SALES, SALES_RETURN, PURCHASE, PURCHASE_RETURN, RECEIPT, PAYMENT, CONTRA, EXPENSE] }
 *       - in: query
 *         name: journalStatus
 *         schema: { type: string, enum: [POSTED, REVERSED] }
 *       - in: query
 *         name: ledgerAccountId
 *         schema: { type: integer }
 *       - in: query
 *         name: partyType
 *         schema: { type: string, enum: [CUSTOMER, SUPPLIER, STAFF, OTHER] }
 *       - in: query
 *         name: partyId
 *         schema: { type: string }
 *       - in: query
 *         name: financialYearId
 *         schema: { type: integer }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: showAllRecords
 *         schema: { type: boolean }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [voucherNumber, voucherType, entryDate, totalDebit, status, createdAt, id] }
 *       - in: query
 *         name: sortDirection
 *         schema: { type: string, enum: [asc, desc] }
 *     responses:
 *       200:
 *         description: A page of journal entries
 */
journalEntryRouter.get('/', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(journalEntryController.getAll));

/**
 * @swagger
 * /journal-entries/{id}:
 *   get:
 *     summary: Get one journal entry
 *     tags: [JournalEntry]
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
 *         description: The entry with its lines
 *       400:
 *         description: The id is not a number, or the token carries no store code
 *       404:
 *         description: No such entry in this store
 */
/**
 * @swagger
 * /journal-entries/day-book-summary:
 *   get:
 *     summary: Totals for the Day Book, for the same filters the listing takes
 *     description: Journal movement (totalDebit/totalCredit) and cash flow (cashIn/cashOut) are reported separately. A balanced set of vouchers always has equal debit and credit totals, so those say how much was recorded, never how much money moved - only the cash figures, taken from cash and bank lines, are real movement.
 *     tags: [JournalEntry]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: clientId
 *         schema: { type: string }
 *         required: true
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: voucherType
 *         schema: { type: string, enum: [OPENING, JOURNAL, SALES, SALES_RETURN, PURCHASE, PURCHASE_RETURN, RECEIPT, PAYMENT, CONTRA, EXPENSE] }
 *       - in: query
 *         name: journalStatus
 *         schema: { type: string, enum: [POSTED, REVERSED] }
 *       - in: query
 *         name: ledgerAccountId
 *         schema: { type: integer }
 *       - in: query
 *         name: partyType
 *         schema: { type: string, enum: [CUSTOMER, SUPPLIER, STAFF, OTHER] }
 *       - in: query
 *         name: partyId
 *         schema: { type: string }
 *       - in: query
 *         name: financialYearId
 *         schema: { type: integer }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Totals for the range, broken down by day and by voucher type
 *       400:
 *         description: The token carries no store code
 */
journalEntryRouter.get('/day-book-summary', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(journalEntryController.daySummary));

journalEntryRouter.get('/:id', authenticateToken, authorization(ADMIN_ROLES), asyncHandler(journalEntryController.getById));

/**
 * @swagger
 * /journal-entries/{id}/reverse:
 *   post:
 *     summary: Reverse a posted entry
 *     description: Posts a mirror entry and marks the original REVERSED. A posted entry is never edited or deleted, so this is the only correction.
 *     tags: [JournalEntry]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               entryDate: { type: string, format: date-time }
 *               narration: { type: string }
 *     responses:
 *       201:
 *         description: The reversing entry
 *       400:
 *         description: The entry is already reversed, is itself a reversal, or falls in a closed financial year
 *       401:
 *         description: The token carries no user id
 *       404:
 *         description: No such entry in this store
 */
journalEntryRouter.post('/:id/reverse', authenticateToken, authorization(ADMIN_ROLES), validate(reverseJournalEntryValidator), asyncHandler(journalEntryController.reverse));

/**
 * @swagger
 * /journal-entries/backfill:
 *   post:
 *     summary: Post a batch of documents that pre-date the posting rules
 *     description: Walks forward in id order; pass the previous response's lastId back as afterId until hasMore is false. Each document is posted in its own transaction, so one bad row cannot undo the batch, and a document already posted is skipped.
 *     tags: [JournalEntry]
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
 *             required: [sourceType]
 *             properties:
 *               sourceType: { type: string, enum: [order, payment, purchase, orderReturn] }
 *               afterId: { type: integer, example: 0 }
 *               limit: { type: integer, example: 50 }
 *     responses:
 *       200:
 *         description: How many documents were posted, skipped and failed, with the id to resume from
 *       400:
 *         description: Validation failed, or the token carries no store code
 *       401:
 *         description: The token carries no user id
 */
journalEntryRouter.post('/backfill', authenticateToken, authorization(ADMIN_ROLES), validate(accountingBackfillValidator), asyncHandler(journalEntryController.backfill));

export default journalEntryRouter;
