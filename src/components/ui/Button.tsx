import React from "react";
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { cn } from "../../utils/cn";

export interface ButtonProps {
  onPress?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg";
  className?: string;
  textClassName?: string;
  title: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  variant = "default",
  size = "default",
  className,
  textClassName,
  title,
  loading = false,
  disabled = false,
  icon,
  ...props
}) => {
  const baseButtonStyles =
    "flex-row items-center justify-center rounded-xl px-4 transition-all duration-150 active:scale-[0.98]";

  const buttonVariants = {
    default: "bg-indigo-600 active:bg-indigo-700 dark:bg-indigo-500 dark:active:bg-indigo-600 shadow-sm",
    destructive: "bg-rose-600 active:bg-rose-700 dark:bg-rose-500 dark:active:bg-rose-600 shadow-sm",
    outline: "border border-slate-200 bg-transparent active:bg-slate-50 dark:border-slate-800 dark:active:bg-slate-900",
    secondary: "bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700",
    ghost: "bg-transparent active:bg-slate-50 dark:active:bg-slate-900",
    link: "bg-transparent p-0 active:opacity-70",
  };

  const textVariants = {
    default: "text-white font-semibold",
    destructive: "text-white font-semibold",
    outline: "text-slate-900 dark:text-slate-100 font-medium",
    secondary: "text-slate-900 dark:text-slate-100 font-medium",
    ghost: "text-slate-900 dark:text-slate-100 font-medium",
    link: "text-indigo-600 dark:text-indigo-400 underline font-medium",
  };

  const buttonSizes = {
    default: "h-12",
    sm: "h-9 px-3 rounded-lg",
    lg: "h-14 px-8 rounded-2xl",
  };

  const textSizes = {
    default: "text-base",
    sm: "text-sm",
    lg: "text-lg",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        baseButtonStyles,
        buttonVariants[variant],
        buttonSizes[size],
        (disabled || loading) && "opacity-50",
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "default" || variant === "destructive"
              ? "#ffffff"
              : "#4f46e5"
          }
          size="small"
        />
      ) : (
        <View className="flex-row items-center justify-center space-x-2">
          {icon && <View className="mr-1">{icon}</View>}
          <Text
            className={cn(
              textVariants[variant],
              textSizes[size],
              textClassName
            )}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
};
