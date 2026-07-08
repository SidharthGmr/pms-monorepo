import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { NewsletterModel } from '@/models/newsletter.model';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';



const useCreateNewsletter = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const mutationFn = async (model: NewsletterModel) => {
    return unitOfService.NewsletterService.create(model);
  };

  return useMutation({
    mutationFn,
    onSettled: (response) => {
      if (response && response.status === 201) {
      }
    },
    onError: (error) => {
      return error;
    },
  });
};

const useGetAllNewsletters = (enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['NewsletterService.getAll'],
    queryFn: async () => {
      return await unitOfService.NewsletterService.getAll();
    },
    enabled: enabled,
  });
};


// Get newsletter by ID
const useGetNewsletterById = (newsletterId: number | string, enabled: boolean = true) => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useQuery({
    queryKey: ['NewsletterService.getById', newsletterId],
    queryFn: async () => {
      return await unitOfService.NewsletterService.getById(newsletterId);
    },
    enabled: enabled && !!newsletterId,
  });
};

// Update newsletter by ID
type UpdateNewsletterArgs = { newsletterId: number | string; model: NewsletterModel };
const useUpdateNewsletter = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  return useMutation({
    mutationFn: async ({ newsletterId, model }: UpdateNewsletterArgs) => {
      return unitOfService.NewsletterService.update(newsletterId, model);
    },
    onError: (error) => error,
  });
};

// Delete newsletter by ID
const useDeleteNewsletter = () => {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);

  const queryClient = useQueryClient();
  const mutationFn = async (newsletterId: number) => {
    return unitOfService.NewsletterService.delete(newsletterId);
  };


  return useMutation({
    mutationFn,
    onSettled: (response) => {
      if (response && response.status === 204) {
        queryClient.invalidateQueries({
          queryKey: ['NewsletterService.getAll'],
        });
      }
    },
    onError: (error) => {
      return error;
    },
  });
};



export { useCreateNewsletter, useGetAllNewsletters, useGetNewsletterById, useUpdateNewsletter, useDeleteNewsletter };
