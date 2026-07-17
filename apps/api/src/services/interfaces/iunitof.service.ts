import { IAccountService } from "./Iaccount.service";
import { IUserService } from "./Iuser.service";
import { ICategoryService } from "./Icategory.service";
import { IProductService } from "./Iproduct.service";
import { IProductPriceService } from "./Iproduct-price.service";
import { IAttributeService } from "./Iattribute.service";
import { IStaffAttendanceService } from "./Istaff-attendance.service";
import { IOrderService } from "./Iorder.service";
import { IOrderItemService } from "./Iorder-item.service";
import { IPaymentService } from "./Ipayment.service";
import { IStaffSalaryService } from "./Istaff-salary.service";
import { IDashboardService } from "./Idashboard.service";
import { IBrandNameService } from "./Ibrand-name.service";
import { IStaffService } from "./Istaff.service";
import { IStoreService } from "./Istore.service";
import { IPurchaseService } from "./ipurchase.service";
import { ISupplierService } from "./Isupplier.service";

export default interface IUnitOfService {
  User: IUserService;
  Account: IAccountService;
  Category: ICategoryService;
  Product: IProductService;
  ProductPrice: IProductPriceService;
  Attribute: IAttributeService;
  StaffAttendance: IStaffAttendanceService;
  Order: IOrderService;
  OrderItem: IOrderItemService;
  Payment: IPaymentService;
  StaffSalary: IStaffSalaryService;
  Dashboard: IDashboardService;
  BrandName: IBrandNameService;
  Staff: IStaffService;
  Store: IStoreService;
  Purchase: IPurchaseService;
  Supplier: ISupplierService;
}
