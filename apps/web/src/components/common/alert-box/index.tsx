import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface AlterBoxProps {
  isOpen: boolean;
  onSubmit: () => void;
  onClose: () => void;
  heading?: string;
  buttonText?: string;
  bodyText?: string;
  loading?: boolean;
}

export default function AlterBox(props: AlterBoxProps) {
  return (
    <>
      <AlertDialog open={props.isOpen} onOpenChange={() => props.onClose()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{props.heading ? props.heading : 'Information'}</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            {props.bodyText ? <p>{props.bodyText}</p> : <p>You have been logged out. Please log in again.</p>}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <Button
              type="button"
              // loading={props.loading}
              disabled={props.loading}
              onClick={() => {
                props.onSubmit();
              }}
            >
              {props.buttonText ? props.buttonText : 'Login'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
