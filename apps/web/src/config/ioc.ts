import 'reflect-metadata';

import { Container } from 'inversify';
import { TYPES } from './types';

import IAccountService from '@/services/interfaces/IAccountService';
import IDateTimeService from '@/services/interfaces/IDateTimeService';
import IErrorHandlerService from '@/services/interfaces/IErrorHandlerService';
import IHttpService from '@/services/interfaces/IHttpService';
import IUnitOfService from '@/services/interfaces/IUnitOfService';

import AccountService from '@/services/AccountService';
import AttributeService from '@/services/AttributeService';
import BrandNameService from '@/services/BrandNameService';
import CategoryService from '@/services/CategoryService';
import DashboardService from '@/services/DashboardService';
import DateTimeService from '@/services/DateTimeService';
import EmailService from '@/services/EmailService';
import ErrorHandlerService from '@/services/ErrorHandlerService';
import HttpService from '@/services/HttpService';
import IAttributeService from '@/services/interfaces/IAttributeService';
import IBrandNameService from '@/services/interfaces/IBrandNameService';
import ICategoryService from '@/services/interfaces/ICategoryService';
import IDashboardService from '@/services/interfaces/IDashboardService';
import IEmailService from '@/services/interfaces/IEmailService';
import INewsletterService from '@/services/interfaces/INewsletterService';
import IOrderItemService from '@/services/interfaces/IOrderItemService';
import IOrderService from '@/services/interfaces/IOrderService';
import IProductService from '@/services/interfaces/IProductService';
import { IPurchaseService } from '@/services/interfaces/IPurchaseService';
import IStaffSalaryService from '@/services/interfaces/IStaffSalaryService';
import IStaffService from '@/services/interfaces/IStaffService';
import IStoreService from '@/services/interfaces/IStoreService';
import IUserListService from '@/services/interfaces/IUserListService.ts';
import NewsletterService from '@/services/NewsletterService';
import OrderItemService from '@/services/OrderItemService';
import OrderService from '@/services/OrderService';
import ProductService from '@/services/ProductService';
import PurchaseService from '@/services/PurchaseService';
import StaffSalaryService from '@/services/StaffSalaryService';
import StaffService from '@/services/StaffService';
import StoreService from '@/services/StoreService';
import SupplierService from '@/services/SupplierService';
import ISupplierService from '@/services/interfaces/ISupplierService';
import UnitOfService from '@/services/UnitOfService';
import UserListService from '@/services/UserListService';

const container = new Container();

container.bind<IHttpService>(TYPES.IHttpService).to(HttpService);
container.bind<IUnitOfService>(TYPES.IUnitOfService).to(UnitOfService);
container.bind<IAccountService>(TYPES.IAccountService).to(AccountService);
container.bind<IDateTimeService>(TYPES.IDateTimeService).to(DateTimeService);
container.bind<INewsletterService>(TYPES.INewsletterService).to(NewsletterService);
container.bind<IEmailService>(TYPES.IEmailService).to(EmailService);
container.bind<IErrorHandlerService>(TYPES.IErrorHandlerService).to(ErrorHandlerService);
container.bind<IUserListService>(TYPES.IUserListService).to(UserListService);
container.bind<IProductService>(TYPES.IProductService).to(ProductService);
container.bind<ICategoryService>(TYPES.ICategoryService).to(CategoryService);
container.bind<IAttributeService>(TYPES.IAttributeService).to(AttributeService);
container.bind<IBrandNameService>(TYPES.IBrandNameService).to(BrandNameService);
container.bind<IDashboardService>(TYPES.IDashboardService).to(DashboardService);
container.bind<IStaffSalaryService>(TYPES.IStaffSalaryService).to(StaffSalaryService);
container.bind<IStaffService>(TYPES.IStaffService).to(StaffService);
container.bind<IStoreService>(TYPES.IStoreService).to(StoreService);
container.bind<IPurchaseService>(TYPES.IPurchaseService).to(PurchaseService);
container.bind<IOrderService>(TYPES.IOrderService).to(OrderService);
container.bind<IOrderItemService>(TYPES.IOrderItemService).to(OrderItemService);
container.bind<ISupplierService>(TYPES.ISupplierService).to(SupplierService);

export { container };

