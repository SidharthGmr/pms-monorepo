import DropdownBasicDto from '@/dtos/dropdown-basic.dto';
import { StatusValues } from '@/enums/status-values.enum';


const StatusData: DropdownBasicDto[] = [
  {
    value: StatusValues.Published,
    label: 'Published',
  },
  {
    value: StatusValues.Draft,
    label: 'Draft',
  },
];

export default StatusData;


export const TranscriptFileStatusData: DropdownBasicDto[] = [{
  value: 'Approved',
  label: 'Approved',
},
{
  value: 'Rejected',
  label: 'Rejected',
},
{
  value: 'InReview',
  label: 'InReview',
},]

export const AffiliateStatusData: DropdownBasicDto[] = [
  {
    value: 'pending',
    label: 'Pending',
  },
  {
    value: 'accepted',
    label: 'Accepted',
  },
  {
    value: 'rejected',
    label: 'Reject',
  },]

