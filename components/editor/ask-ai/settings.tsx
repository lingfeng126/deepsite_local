import classNames from "classnames";
import { PiGearSixFill } from "react-icons/pi";
import { RiCheckboxCircleFill } from "react-icons/ri";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PROVIDERS, MODELS, getAllModels, CustomModel } from "@/lib/providers";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMemo, useState, useEffect } from "react";
import { useUpdateEffect } from "react-use";
import Image from "next/image";
import { CustomModelForm } from "./custom-model-form";

export function Settings({
  open,
  onClose,
  model,
  error,
  isFollowUp = false,
  onModelChange,
}: {
  open: boolean;
  model: string;
  error?: string;
  isFollowUp?: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (provider: string) => void;
  onModelChange: (model: string) => void;
}) {
  const [allModels, setAllModels] = useState(() => getAllModels());

  useEffect(() => {
    // Refresh models when the settings open to get latest custom models
    if (open) {
      setAllModels(getAllModels());
    }
  }, [open]);

  const handleCustomModelAdded = (newModel: CustomModel) => {
    setAllModels(getAllModels());
    onModelChange(newModel.value);
  };

  const builtInModels = MODELS;
  const customModels = allModels.filter(m => 'isCustom' in m && m.isCustom);

  return (
    <div className="">
      <Popover open={open} onOpenChange={onClose}>
        <PopoverTrigger asChild>
          <Button variant="black" size="sm">
            <PiGearSixFill className="size-4" />
            Settings
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="!rounded-2xl p-0 !w-96 overflow-hidden !bg-neutral-900"
          align="center"
        >
          <header className="flex items-center justify-center text-sm px-4 py-3 border-b gap-2 bg-neutral-950 border-neutral-800 font-semibold text-neutral-200">
            Customize Settings
          </header>
          <main className="px-4 pt-5 pb-6 space-y-5">
            {error !== "" && (
              <p className="text-red-500 text-sm font-medium mb-2 flex items-center justify-between bg-red-500/10 p-2 rounded-md">
                {error}
              </p>
            )}
            <label className="block">
              <p className="text-neutral-300 text-sm mb-2.5">
                Choose a model
              </p>
              <Select defaultValue={model} onValueChange={onModelChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Built-in models</SelectLabel>
                    {builtInModels.map(
                      ({
                        value,
                        label,
                        isNew = false,
                        isThinker = false,
                      }: {
                        value: string;
                        label: string;
                        isNew?: boolean;
                        isThinker?: boolean;
                      }) => (
                        <SelectItem
                          key={value}
                          value={value}
                          className=""
                          disabled={isThinker && isFollowUp}
                        >
                          {label}
                          {isNew && (
                            <span className="text-xs bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-full px-1.5 py-0.5">
                              New
                            </span>
                          )}
                        </SelectItem>
                      )
                    )}
                  </SelectGroup>
                  {customModels.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Custom models</SelectLabel>
                      {customModels.map((customModel) => (
                        <SelectItem
                          key={customModel.value}
                          value={customModel.value}
                          className=""
                        >
                          {customModel.label}
                          <span className="text-xs bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-full px-1.5 py-0.5 ml-1">
                            Custom
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </label>
            {isFollowUp && (
              <div className="bg-amber-500/10 border-amber-500/10 p-3 text-xs text-amber-500 border rounded-lg">
                Note: You can&apos;t use a Thinker model for follow-up requests.
                We automatically switch to the default model for you.
              </div>
            )}
            <CustomModelForm onModelAdded={handleCustomModelAdded} />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                  
                </div>
            </div>
          </main>
        </PopoverContent>
      </Popover>
    </div>
  );
}
