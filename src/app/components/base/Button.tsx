import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  color?: string;
}

export function Button(props: ButtonProps) {
  const { children, color = "blue", ...rest } = props;

  const getColorClass = (color: string) => {
    switch (color) {
      case "orange":
        return "bg-orange-300";
      case "green":
        return "bg-green-300";
      case "gray":
        return "bg-gray-300";
      default:
        return "bg-blue-500";
    }
  };

  return (
    <>
      <button
        {...rest}
        className={`${getColorClass(
          color
        )} border border-gray-500 px-4 py-2 m-3 rounded-md`}
      >
        {children}
      </button>
    </>
  );
}
