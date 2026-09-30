interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-10 w-10 text-sm",
};

export function Avatar({ initials, size = "md" }: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-700 font-semibold text-white ${sizeClasses[size]}`}
    >
      {initials}
    </div>
  );
}
