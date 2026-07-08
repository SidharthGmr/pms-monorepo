import IAccountService from './IAccountService';
import IAttributeService from './IAttributeService';
import IBrandNameService from './IBrandNameService';
import ICategoryService from './ICategoryService';
import IDashboardService from './IDashboardService';
import IDateTimeService from './IDateTimeService';
import IEmailService from './IEmailService';
import IErrorHandlerService from './IErrorHandlerService';
import IHttpService from './IHttpService';
import INewsletterService from './INewsletterService';
import IOrderItemService from './IOrderItemService';
import IOrderService from './IOrderService';
import IProductService from './IProductService';
import IStaffSalaryService from './IStaffSalaryService';
import IStaffService from './IStaffService';
import IStoreService from './IStoreService';
import IUserListService from './IUserListService.ts';

export default interface IUnitOfService {
  HttpService: IHttpService;
  AccountService: IAccountService;
  DateTimeService: IDateTimeService;
  NewsletterService: INewsletterService;
  EmailService: IEmailService;
  ErrorHandlerService: IErrorHandlerService;
  UserListService: IUserListService;
  ProductService: IProductService;
  CategoryService: ICategoryService;
  AttributeService: IAttributeService;
  BrandNameService: IBrandNameService;
  DashboardService: IDashboardService;
  StaffSalaryService: IStaffSalaryService;
  StaffService: IStaffService;
  StoreService: IStoreService;
  OrderService: IOrderService;
  OrderItemService: IOrderItemService;
}
