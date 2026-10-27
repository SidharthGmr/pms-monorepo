import { KeyboardEvent } from 'react';

// Ctrl/Cmd+Enter saves from anywhere in a form, so a keyboard user never has to reach the
// footer. Attach it to the <form>: onKeyDown={submitOnCtrlEnter(onSubmit)}.
export const submitOnCtrlEnter =
  (submit: () => void) =>
  (event: KeyboardEvent<HTMLFormElement>): void => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      submit();
    }
  };
