import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
import { badgeVariants } from './badge-variants';

/**
 * Badge Component
 *
 * A small, pill-shaped component used to display short text or status indicators.
 * Supports multiple visual variants and can be rendered as different HTML elements
 * using the asChild prop.
 *
 * @param className - Additional CSS classes
 * @param variant - Visual style variant (default, secondary, destructive, outline)
 * @param asChild - Whether to render as a child component using Radix Slot
 * @param props - Additional HTML span element props
 */
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  // Use Slot component if asChild is true, otherwise use span
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
