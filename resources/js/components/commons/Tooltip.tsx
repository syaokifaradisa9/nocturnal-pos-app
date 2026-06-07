import React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    delayDuration?: number;
    side?: 'top' | 'right' | 'bottom' | 'left';
    align?: 'start' | 'center' | 'end';
}

export default function Tooltip({
    content,
    children,
    delayDuration = 200,
    side = 'top',
    align = 'center',
}: TooltipProps) {
    return (
        <RadixTooltip.Provider>
            <RadixTooltip.Root delayDuration={delayDuration}>
                <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
                <RadixTooltip.Portal>
                    <RadixTooltip.Content
                        side={side}
                        align={align}
                        sideOffset={4}
                        className="z-50 animate-in overflow-hidden rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-md fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 dark:bg-slate-800"
                    >
                        {content}
                        <RadixTooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                    </RadixTooltip.Content>
                </RadixTooltip.Portal>
            </RadixTooltip.Root>
        </RadixTooltip.Provider>
    );
}
