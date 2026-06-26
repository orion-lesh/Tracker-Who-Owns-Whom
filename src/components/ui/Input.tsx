import React from "react";
import { View, Text, TextInput, type TextInputProps } from "react-native";
import { cn } from "../../utils/cn";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
}

export const Input = React.forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      containerClassName,
      labelClassName,
      inputClassName,
      errorClassName,
      ...props
    },
    ref
  ) => {
    return (
      <View className={cn("flex flex-col space-y-1.5 w-full", containerClassName)}>
        {label && (
          <Text
            className={cn(
              "text-sm font-semibold text-slate-300 mb-1",
              labelClassName
            )}
          >
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          placeholderTextColor="#64748b"
          className={cn(
            "h-12 w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 text-base text-white placeholder-slate-500 focus:border-indigo-500",
            error && "border-rose-500 focus:border-rose-500",
            inputClassName
          )}
          {...props}
        />
        {error && (
          <Text
            className={cn(
              "text-xs font-medium text-rose-500 mt-1",
              errorClassName
            )}
          >
            {error}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = "Input";
