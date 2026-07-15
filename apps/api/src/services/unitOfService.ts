import { container } from "../config/ioc.config";
import { TYPES } from "../config/ioc.types";
import { IAccountService } from "./interfaces/Iaccount.service";
import IUnitOfService from "./interfaces/iunitof.service";
import { IUserService } from "./interfaces/Iuser.service";
import { ICategoryService } from "./interfaces/Icategory.service";
import { IProductService } from "./interfaces/Iproduct.service";
import { IProductPriceService } from "./interfaces/Iproduct-price.service";
import { IAttributeService } from "./interfaces/Iattribute.service";
import { IStaffAttendanceService } from "./interfaces/Istaff-attendance.service";
import { IOrderService } from "./interfaces/Iorder.service";
import { IOrderItemService } from "./interfaces/Iorder-item.service";
import { IPaymentService } from "./interfaces/Ipayment.service";
import { IStaffSalaryService } from "./interfaces/Istaff-salary.service";
import { IDashboardService } from "./interfaces/Idashboard.service";
import { IBrandNameService } from "./interfaces/Ibrand-name.service";
import { IStaffService } from "./interfaces/Istaff.service";
import { IStoreService } from "./interfaces/Istore.service";

export default class UnitOfService implements IUnitOfService {
  public User: IUserService;
  public Account: IAccountService;
  public Category: ICategoryService;
  public Product: IProductService;
  public ProductPrice: IProductPriceService;
  public Attribute: IAttributeService;
  public StaffAttendance: IStaffAttendanceService;
  public Order: IOrderService;
  public OrderItem: IOrderItemService;
  public Payment: IPaymentService;
  public StaffSalary: IStaffSalaryService;
  public Dashboard: IDashboardService;
  public BrandName: IBrandNameService;
  public Staff: IStaffService;
  public Store: IStoreService;

  constructor(
    user = container.get<IUserService>(TYPES.IUserService),
    account = container.get<IAccountService>(TYPES.IAccountService),
    category = container.get<ICategoryService>(TYPES.ICategoryService),
    product = container.get<IProductService>(TYPES.IProductService),
    productPrice = container.get<IProductPriceService>(TYPES.IProductPriceService),
    attribute = container.get<IAttributeService>(TYPES.IAttributeService),
    staffAttendance = container.get<IStaffAttendanceService>(TYPES.IStaffAttendanceService),
    order = container.get<IOrderService>(TYPES.IOrderService),
    orderItem = container.get<IOrderItemService>(TYPES.IOrderItemService),
    payment = container.get<IPaymentService>(TYPES.IPaymentService),
    staffSalary = container.get<IStaffSalaryService>(TYPES.IStaffSalaryService),
    dashboard = container.get<IDashboardService>(TYPES.IDashboardService),
    brandName = container.get<IBrandNameService>(TYPES.IBrandNameService),
    staff = container.get<IStaffService>(TYPES.IStaffService),
    store = container.get<IStoreService>(TYPES.IStoreService),
  ) {
    this.User = user;
    this.Account = account;
    this.Category = category;
    this.Product = product;
    this.ProductPrice = productPrice;
    this.Attribute = attribute;
    this.StaffAttendance = staffAttendance;
    this.Order = order;
    this.OrderItem = orderItem;
    this.Payment = payment;
    this.StaffSalary = staffSalary;
    this.Dashboard = dashboard;
    this.BrandName = brandName;
    this.Staff = staff;
    this.Store = store;
  }
}
