import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { injectable } from 'inversify';

import IAccountService from './interfaces/IAccountService';
import IAttributeService from './interfaces/IAttributeService';
import IBrandNameService from './interfaces/IBrandNameService';
import ICategoryService from './interfaces/ICategoryService';
import IDashboardService from './interfaces/IDashboardService';
import IDateTimeService from './interfaces/IDateTimeService';
import IEmailService from './interfaces/IEmailService';
import IErrorHandlerService from './interfaces/IErrorHandlerService';
import IHttpService from './interfaces/IHttpService';
import INewsletterService from './interfaces/INewsletterService';
import IOrderItemService from './interfaces/IOrderItemService';
import IOrderService from './interfaces/IOrderService';
import IProductService from './interfaces/IProductService';
import IStaffSalaryService from './interfaces/IStaffSalaryService';
import IStaffService from './interfaces/IStaffService';
import IStoreService from './interfaces/IStoreService';
import IUnitOfService from './interfaces/IUnitOfService';
import IUserListService from './interfaces/IUserListService.ts';



@injectable()
export default class UnitOfService implements IUnitOfService {
  public HttpService: IHttpService;
  public AccountService: IAccountService;
  public DateTimeService: IDateTimeService;
  public NewsletterService: INewsletterService;
  public UserListService: IUserListService;
  public EmailService: IEmailService;
  public ErrorHandlerService: IErrorHandlerService;
  public ProductService: IProductService;
  public CategoryService: ICategoryService;
  public AttributeService: IAttributeService;
  public BrandNameService: IBrandNameService;
  public DashboardService: IDashboardService;
  public StaffSalaryService: IStaffSalaryService;
  public StaffService: IStaffService;
  public StoreService: IStoreService;
  public OrderService: IOrderService;
  public OrderItemService: IOrderItemService;

  constructor(
    httpService = container.get<IHttpService>(TYPES.IHttpService),
    accountService = container.get<IAccountService>(TYPES.IAccountService),
    dateTimeService = container.get<IDateTimeService>(TYPES.IDateTimeService),
    newsletterService = container.get<INewsletterService>(TYPES.INewsletterService),
    emailService = container.get<IEmailService>(TYPES.IEmailService),
    errorHandlerService = container.get<IErrorHandlerService>(TYPES.IErrorHandlerService),
    userListService = container.get<IUserListService>(TYPES.IUserListService),
    productService = container.get<IProductService>(TYPES.IProductService),
    categoryService = container.get<ICategoryService>(TYPES.ICategoryService),
    attributeService = container.get<IAttributeService>(TYPES.IAttributeService),
    brandNameService = container.get<IBrandNameService>(TYPES.IBrandNameService),
    dashboardService = container.get<IDashboardService>(TYPES.IDashboardService),
    staffSalaryService = container.get<IStaffSalaryService>(TYPES.IStaffSalaryService),
    staffService = container.get<IStaffService>(TYPES.IStaffService),
    storeService = container.get<IStoreService>(TYPES.IStoreService),
    orderService = container.get<IOrderService>(TYPES.IOrderService),
    orderItemService = container.get<IOrderItemService>(TYPES.IOrderItemService),
  ) {
    this.HttpService = httpService;
    this.AccountService = accountService;
    this.DateTimeService = dateTimeService;
    this.NewsletterService = newsletterService;
    this.EmailService = emailService;
    this.ErrorHandlerService = errorHandlerService;
    this.UserListService = userListService;
    this.ProductService = productService;
    this.CategoryService = categoryService;
    this.AttributeService = attributeService;
    this.BrandNameService = brandNameService;
    this.DashboardService = dashboardService;
    this.StaffSalaryService = staffSalaryService;
    this.StaffService = staffService;
    this.StoreService = storeService;
    this.OrderService = orderService;
    this.OrderItemService = orderItemService;
  }
}
