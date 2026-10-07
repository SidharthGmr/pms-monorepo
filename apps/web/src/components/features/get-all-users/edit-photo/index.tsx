'use client';

import { ProfileImageUploader } from '@/components/common/admin-media/profile-image-uploader';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import Response from '@/dtos/Response';
import { useUpdateUser } from '@/hooks/service-hooks/useUserList.service.hook';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { UserDto } from '@pms/types';
import { AxiosResponse } from 'axios';
import { useState } from 'react';

interface EditUserPhotoProps {
  isOpen: boolean;
  userId: string;
  currentImageUrl?: string | null;
  userName?: string | null;
  onClose: (refresh: boolean) => void;
}

// Only the photo goes over the wire; `PUT /users/:userId` merges it into the user's profile row
// and leaves every other field as it is, so this never has to resend the whole form.
export default function EditUserPhoto({ isOpen, userId, currentImageUrl, userName, onClose }: EditUserPhotoProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const updateUser = useUpdateUser();

  const initial = currentImageUrl || '';
  const [imageUrl, setImageUrl] = useState(initial);

  const isDirty = imageUrl !== initial;
  const isSaving = updateUser.isPending;

  const save = async () => {
    const formData = new FormData();
    formData.append('profileImageUrl', imageUrl);

    const response: AxiosResponse<Response<UserDto>> = await updateUser.mutateAsync({ id: userId, model: formData });

    if (response && (response.status === 200 || response.status === 201)) {
      toast({ variant: 'success', title: imageUrl ? 'Profile photo updated' : 'Profile photo removed' });
      onClose(true);
      return;
    }

    const error = unitOfService.ErrorHandlerService.getErrorMessage(response);
    toast({ variant: 'destructive', title: 'Error', description: <span>{error}</span> });
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !isSaving && onClose(false)}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Profile photo</DialogTitle>
          <DialogDescription>{userName ? `Upload a new photo for ${userName}.` : 'Upload a new photo for this account.'}</DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <ProfileImageUploader value={imageUrl} onChange={setImageUrl} />
        </div>

        <p className="text-center text-[11px] text-muted-foreground">Square images work best. Drop a file on the circle, click it to browse, or paste a link.</p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{isDirty ? 'Unsaved change' : 'No changes yet'}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onClose(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={save} loading={isSaving} disabled={!isDirty || isSaving}>
              {isSaving ? 'Saving…' : 'Save photo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
