import { cn } from "@repo/ui/lib/utils";
import type * as React from "react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"border-input placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-muted flex field-sizing-content min-h-16 w-full rounded-md border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus:outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
