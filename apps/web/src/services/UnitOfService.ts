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
import IProductVariantService from './interfaces/IProductVariantService';
import ICartService from './interfaces/ICartService';
import ICheckoutService from './interfaces/ICheckoutService';
import IStaffSalaryService from './interfaces/IStaffSalaryService';
import IStaffService from './interfaces/IStaffService';
import IStoreService from './interfaces/IStoreService';
import ISupplierService from './interfaces/ISupplierService';
import IReviewService from './interfaces/IReviewService';
import IReviewReplyService from './interfaces/IReviewReplyService';
import IWishlistService from './interfaces/IWishlistService';
import IMasterAttributeService from './interfaces/IMasterAttributeService';
import IMasterEntryService from './interfaces/IMasterEntryService';
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
  public ProductVariantService: IProductVariantService;
  public CartService: ICartService;
  public CheckoutService: ICheckoutService;
  public CategoryService: ICategoryService;
  public AttributeService: IAttributeService;
  public BrandNameService: IBrandNameService;
  public DashboardService: IDashboardService;
  public StaffSalaryService: IStaffSalaryService;
  public StaffService: IStaffService;
  public StoreService: IStoreService;
  public OrderService: IOrderService;
  public OrderItemService: IOrderItemService;
  public SupplierService: ISupplierService;
  public ReviewService: IReviewService;
  public ReviewReplyService: IReviewReplyService;
  public WishlistService: IWishlistService;
  public MasterAttributeService: IMasterAttributeService;
  public MasterEntryService: IMasterEntryService;

  constructor(
    httpService = container.get<IHttpService>(TYPES.IHttpService),
    accountService = container.get<IAccountService>(TYPES.IAccountService),
    dateTimeService = container.get<IDateTimeService>(TYPES.IDateTimeService),
    newsletterService = container.get<INewsletterService>(TYPES.INewsletterService),
    emailService = container.get<IEmailService>(TYPES.IEmailService),
    errorHandlerService = container.get<IErrorHandlerService>(TYPES.IErrorHandlerService),
    userListService = container.get<IUserListService>(TYPES.IUserListService),
    productService = container.get<IProductService>(TYPES.IProductService),
    productVariantService = container.get<IProductVariantService>(TYPES.IProductVariantService),
    cartService = container.get<ICartService>(TYPES.ICartService),
    checkoutService = container.get<ICheckoutService>(TYPES.ICheckoutService),
    categoryService = container.get<ICategoryService>(TYPES.ICategoryService),
    attributeService = container.get<IAttributeService>(TYPES.IAttributeService),
    brandNameService = container.get<IBrandNameService>(TYPES.IBrandNameService),
    dashboardService = container.get<IDashboardService>(TYPES.IDashboardService),
    staffSalaryService = container.get<IStaffSalaryService>(TYPES.IStaffSalaryService),
    staffService = container.get<IStaffService>(TYPES.IStaffService),
    storeService = container.get<IStoreService>(TYPES.IStoreService),
    orderService = container.get<IOrderService>(TYPES.IOrderService),
    orderItemService = container.get<IOrderItemService>(TYPES.IOrderItemService),
    supplierService = container.get<ISupplierService>(TYPES.ISupplierService),
    reviewService = container.get<IReviewService>(TYPES.IReviewService),
    reviewReplyService = container.get<IReviewReplyService>(TYPES.IReviewReplyService),
    wishlistService = container.get<IWishlistService>(TYPES.IWishlistService),
    masterAttributeService = container.get<IMasterAttributeService>(TYPES.IMasterAttributeService),
    masterEntryService = container.get<IMasterEntryService>(TYPES.IMasterEntryService),
  ) {
    this.HttpService = httpService;
    this.AccountService = accountService;
    this.DateTimeService = dateTimeService;
    this.NewsletterService = newsletterService;
    this.EmailService = emailService;
    this.ErrorHandlerService = errorHandlerService;
    this.UserListService = userListService;
    this.ProductService = productService;
    this.ProductVariantService = productVariantService;
    this.CartService = cartService;
    this.CheckoutService = checkoutService;
    this.CategoryService = categoryService;
    this.AttributeService = attributeService;
    this.BrandNameService = brandNameService;
    this.DashboardService = dashboardService;
    this.StaffSalaryService = staffSalaryService;
    this.StaffService = staffService;
    this.StoreService = storeService;
    this.OrderService = orderService;
    this.OrderItemService = orderItemService;
    this.SupplierService = supplierService;
    this.ReviewService = reviewService;
    this.ReviewReplyService = reviewReplyService;
    this.WishlistService = wishlistService;
    this.MasterAttributeService = masterAttributeService;
    this.MasterEntryService = masterEntryService;
  }
}
