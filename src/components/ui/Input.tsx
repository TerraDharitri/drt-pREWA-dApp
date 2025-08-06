import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="web3-label">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "web3-input",
              error && "border-error-100 focus:!border-error-100",
              props.type === "password" && "pr-12"
            )}
            {...props}
          />
          {props.type === "password" && (
            <button
              className="text-0 group absolute bottom-0 right-0 top-0 flex w-12 items-center justify-center"
              type="button"
              onClick={() => {
                const input = document.getElementById(
                  inputId
                ) as HTMLInputElement;
                if (input) {
                  input.type = input.type === "password" ? "text" : "password";
                }
              }}
            >
              <svg
                className="fill-greyscale-300 dark:fill-dark-text-muted group-hover:fill-primary-100 h-5 w-5 transition-colors"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clipRule="evenodd"
                />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            </button>
          )}
        </div>
        {error && (
          <div className="text-error-100 dark:text-error-50 mt-1.5 text-sm">
            {error}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";