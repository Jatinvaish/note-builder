import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Button } from "@/components/ui/button"

export const SuggestionList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]

        if (item) {
            props.command({ id: item })
        }
    }

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            if (event.key === 'Tab') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div className="items bg-popover text-popover-foreground rounded-md border shadow-md p-1 min-w-[12rem] overflow-hidden">
            {props.items.length ? (
                props.items.map((item: string, index: number) => {
                    // Map ID to readable label if possible, or just use ID
                    const label = item.charAt(0).toUpperCase() + item.slice(1).replace('_', ' ');

                    return (
                        <Button
                            key={index}
                            variant="ghost"
                            className={`w-full justify-start h-8 px-2 text-sm ${index === selectedIndex ? 'bg-accent text-accent-foreground' : ''}`}
                            onClick={() => selectItem(index)}
                        >
                            {label}
                        </Button>
                    )
                })
            ) : (
                <div className="px-2 py-1 text-sm text-muted-foreground">No result</div>
            )}
        </div>
    )
})

SuggestionList.displayName = 'SuggestionList'
