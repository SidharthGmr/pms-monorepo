import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useQuery } from '@tanstack/react-query';

const useGetDashboardSummary = (enabled: boolean = true) => {
    const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

    return useQuery({
        queryKey: ['DashboardService.getSummary'],
        queryFn: async () => {
            return await unitOfService.DashboardService.getSummary();
        },
        enabled,
    });
};

export { useGetDashboardSummary };
