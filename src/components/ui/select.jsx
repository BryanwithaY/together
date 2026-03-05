"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"

import { cn } from "@/lib/utils"

// Detect mobile (touch) devices
function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(max-width: 640px)').matches);
    check();
    window.matchMedia('(max-width: 640px)').addEventListener('change', check);
    return () => window.matchMedia('(max-width: 640px)').removeEventListener('change', check);
  }, []);
  return isMobile;
}

// Context to share items + value with the mobile drawer
const SelectInternalContext = React.createContext({});

const Select = ({ children, value, defaultValue, onValueChange, open: controlledOpen, onOpenChange, ...props }) => {
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [currentValue, setCurrentValue] = React.useState(value ?? defaultValue ?? '');

  React.useEffect(() => {
    if (value !== undefined) setCurrentValue(value);
  }, [value]);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const handleValueChange = (v) => {
    setCurrentValue(v);
    onValueChange?.(v);
    if (isMobile) setOpen(false);
  };

  return (
    <SelectInternalContext.Provider value={{ items, setItems, isMobile, isOpen, setOpen, currentValue, handleValueChange }}>
      <SelectPrimitive.Root
        value={currentValue}
        onValueChange={handleValueChange}
        open={isMobile ? false : isOpen}
        onOpenChange={(o) => { if (!isMobile) setOpen(o); }}
        {...props}
      >
        {/* Trigger is still rendered for mobile so it looks normal */}
        {children}
      </SelectPrimitive.Root>

      {/* Mobile drawer */}
      {isMobile && (
        <Drawer open={isOpen} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[70vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-sm font-semibold text-muted-foreground sr-only">Select an option</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-2 pb-6">
              {items.map((item) => (
                <button
                  key={item.value}
                  disabled={item.disabled}
                  onClick={() => handleValueChange(item.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3.5 text-sm rounded-xl transition-colors",
                    item.value === currentValue
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-foreground hover:bg-accent/60",
                    item.disabled && "opacity-40 pointer-events-none"
                  )}
                >
                  <span>{item.label}</span>
                  {item.value === currentValue && <Check className="w-4 h-4 opacity-70" />}
                </button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </SelectInternalContext.Provider>
  );
};

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isMobile, setOpen } = React.useContext(SelectInternalContext);

  if (isMobile) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
      </button>
    );
  }

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
        className
      )}
      {...props}>
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger"

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  const { isMobile } = React.useContext(SelectInternalContext);
  if (isMobile) return null; // Drawer handles this on mobile
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props} />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

// SelectItem registers itself into context so the mobile drawer can render items
const SelectItem = React.forwardRef(({ className, children, value, disabled, ...props }, ref) => {
  const { setItems, isMobile } = React.useContext(SelectInternalContext);

  React.useEffect(() => {
    if (!isMobile) return;
    setItems(prev => {
      if (prev.find(i => i.value === value)) return prev;
      return [...prev, { value, label: children, disabled: disabled ?? false }];
    });
    return () => {
      setItems(prev => prev.filter(i => i.value !== value));
    };
  }, [value, children, disabled, isMobile]);

  if (isMobile) return null; // rendered in drawer

  return (
    <SelectPrimitive.Item
      ref={ref}
      value={value}
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}>
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
})
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}