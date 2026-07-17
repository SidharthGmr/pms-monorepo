import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { container } from "../config/ioc.config";
import IUnitOfWork from "./interfaces/iunitofwork.repository";
import { IUserRepository } from "./interfaces/iuser.repository";
import { TYPES } from "../config/ioc.types";
import { IAccountRepository } from "./interfaces/iaccount.repository";
import { ICategoryRepository } from "./interfaces/icategory.repository";
import { IProductRepository } from "./interfaces/iproduct.repository";
import { IProductPriceRepository } from "./interfaces/iproduct-price.repository";
import { IAttributeRepository } from "./interfaces/iattribute.repository";
import { IStaffAttendanceRepository } from "./interfaces/istaff-attendance.repository";
import { IOrderRepository } from "./interfaces/iorder.repository";
import { IOrderItemRepository } from "./interfaces/iorder-item.repository";
import { IPaymentRepository } from "./interfaces/ipayment.repository";
import { IStaffSalaryRepository } from "./interfaces/istaff-salary.repository";
import { IDashboardRepository } from "./interfaces/idashboard.repository";
import { IBrandNameRepository } from "./interfaces/ibrand-name.repository";
import { IStaffRepository } from "./interfaces/istaff.repository";
import { IStoreRepository } from "./interfaces/istore.repository";
import { IPurchaseRepository } from "./interfaces/ipurchase.repository";
import { ISupplierRepository } from "./interfaces/isupplier.repository";

export default class UnitOfWork implements IUnitOfWork {
  public User: IUserRepository;
  public Account: IAccountRepository;
  public Category: ICategoryRepository;
  public Product: IProductRepository;
  public ProductPrice: IProductPriceRepository;
  public Attribute: IAttributeRepository;
  public StaffAttendance: IStaffAttendanceRepository;
  public Order: IOrderRepository;
  public OrderItem: IOrderItemRepository;
  public Payment: IPaymentRepository;
  public StaffSalary: IStaffSalaryRepository;
  public Dashboard: IDashboardRepository;
  public BrandName: IBrandNameRepository;
  public Staff: IStaffRepository;
  public Store: IStoreRepository;
  public Purchase: IPurchaseRepository;
  public Supplier: ISupplierRepository;

  constructor(
    user = container.get<IUserRepository>(TYPES.IUserRepository),
    account = container.get<IAccountRepository>(TYPES.IAccountRepository),
    category = container.get<ICategoryRepository>(TYPES.ICategoryRepository),
    product = container.get<IProductRepository>(TYPES.IProductRepository),
    productPrice = container.get<IProductPriceRepository>(TYPES.IProductPriceRepository),
    attribute = container.get<IAttributeRepository>(TYPES.IAttributeRepository),
    staffAttendance = container.get<IStaffAttendanceRepository>(TYPES.IStaffAttendanceRepository),
    order = container.get<IOrderRepository>(TYPES.IOrderRepository),
    orderItem = container.get<IOrderItemRepository>(TYPES.IOrderItemRepository),
    payment = container.get<IPaymentRepository>(TYPES.IPaymentRepository),
    staffSalary = container.get<IStaffSalaryRepository>(TYPES.IStaffSalaryRepository),
    dashboard = container.get<IDashboardRepository>(TYPES.IDashboardRepository),
    brandName = container.get<IBrandNameRepository>(TYPES.IBrandNameRepository),
    staff = container.get<IStaffRepository>(TYPES.IStaffRepository),
    store = container.get<IStoreRepository>(TYPES.IStoreRepository),
    purchase = container.get<IPurchaseRepository>(TYPES.IPurchaseRepository),
    supplier = container.get<ISupplierRepository>(TYPES.ISupplierRepository),
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
    this.Purchase = purchase;
    this.Supplier = supplier;
  }
  // async transaction<T>(callback: (prisma: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  //   return prisma.$transaction(async (transactionClient) => {
  //     return callback(transactionClient);
  //   });
  // }
  async transaction<T>(
    callback: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: { maxWait?: number; timeout?: number }
  ): Promise<T> {
    return prisma.$transaction(callback, options);
  }

}


