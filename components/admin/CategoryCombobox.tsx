'use client';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Category } from '@/types';
import { useState } from 'react';

interface CategoryComboboxProps {
    categories: Category[];
    selectedCategory: string;
    onSelect: (value: string) => void;
}

export function CategoryCombobox({
                                     categories,
                                     selectedCategory,
                                     onSelect,
                                 }: CategoryComboboxProps) {
    const [open, setOpen] = useState(false);

    const selectedLabel =
        selectedCategory === 'all'
            ? 'Toate categoriile'
            : categories.find((cat) => String(cat.id) === selectedCategory)?.name || 'Categorie';

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedLabel}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>

            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Caută categorie..." />
                    <CommandEmpty>Nu am găsit nicio categorie</CommandEmpty>
                    <CommandGroup>
                        <CommandItem
                            key="all"
                            onSelect={() => {
                                onSelect('all');
                                setOpen(false);
                            }}
                        >
                            <Check
                                className={cn(
                                    'mr-2 h-4 w-4',
                                    selectedCategory === 'all' ? 'opacity-100' : 'opacity-0'
                                )}
                            />
                            Toate categoriile
                        </CommandItem>
                        {categories.map((category) => (
                            <CommandItem
                                key={category.id}
                                onSelect={() => {
                                    onSelect(String(category.id));
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        'mr-2 h-4 w-4',
                                        selectedCategory === String(category.id) ? 'opacity-100' : 'opacity-0'
                                    )}
                                />
                                {category.name}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
