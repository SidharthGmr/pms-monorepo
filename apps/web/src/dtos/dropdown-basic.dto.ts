export default interface DropdownBasicDto {
  label: string;
  value: (number | string) | (number | string)[];
  icon?: React.ComponentType<{ className?: string }>;
  childItems?: DropdownBasicDto[];
}
