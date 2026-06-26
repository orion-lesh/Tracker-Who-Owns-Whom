import React from "react";
import { View, Text, type ViewProps, type TextProps } from "react-native";
import { cn } from "../../utils/cn";

export const Card = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/50",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<Text, TextProps & { className?: string }>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn(
      "text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-slate-50",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<Text, TextProps & { className?: string }>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn("text-sm text-slate-500 dark:text-slate-400 leading-normal", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn("pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn("flex-row items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
