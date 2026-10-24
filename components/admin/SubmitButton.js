'use client';
import { useFormStatus } from 'react-dom';
export default function SubmitButton({
  children,
  className = 'btn btn-primary',
  confirmMessage,
  pendingLabel = 'Saving…',
  ...props
}) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      className={className}
      type="submit"
      disabled={pending || props.disabled}
      aria-busy={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) event.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
