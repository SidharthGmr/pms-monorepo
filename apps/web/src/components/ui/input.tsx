// import * as React from "react"

// import { cn } from "@/components/ui/utils"

// const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
//   ({ className, type, ...props }, ref) => {
//     return (
//       <input
//         type={type}
//         className={cn(
//           "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
//           className
//         )}
//         ref={ref}
//         {...props}
//       />
//     )
//   }
// )
// Input.displayName = "Input"

// export { Input }



"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react"; 
import InputMask from 'react-input-mask';

interface InputProps extends React.ComponentPropsWithoutRef<"input"> {
  type?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon: Icon, onChange, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [phoneValue, setPhoneValue] = React.useState(props.value || ""); // Ensure controlled input only when needed

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    const isPassword = type === "password";
    const isPhone = type === "phone";

    return (
      <div className="relative flex items-center rounded-md border focus-within:border focus-within:border-primary bg-background gap-1">
        {Icon && <Icon className="h-4 w-10 text-center text-muted-foreground" />}

        {isPhone ? (
          <InputMask
            mask="(999) 999-9999"
            value={phoneValue}
            onChange={(e) => {
              setPhoneValue(e.target.value);
              if (onChange) onChange(e); // Ensure parent onChange still works
            }}
            className={cn(
              "flex h-10 w-full rounded-md border-0 border-input bg-background px-3 py-1.5 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-0 shadow-none",
              className
            )}
            ref={ref as React.LegacyRef<InputMask>}
            {...Object.fromEntries(Object.entries(props).filter(([key]) => key !== 'children'))}
          />
        ) : (
          <input
            type={isPassword && showPassword ? "text" : type}
            className={cn(
              "flex h-10 w-full rounded-md border-0 border-input bg-background px-3 py-1.5 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-0 shadow-none autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255,255)]",
              className
            )}
            ref={ref}
            onChange={onChange} // Ensure parent-controlled behavior for other inputs
            {...props}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 text-muted-foreground focus:outline-none"
          >
            {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
