"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CustomModel, saveCustomModel, deleteCustomModel, getCustomModels } from "@/lib/providers";

interface CustomModelFormProps {
  onModelAdded: (model: CustomModel) => void;
}

export function CustomModelForm({ onModelAdded }: CustomModelFormProps) {
  const [open, setOpen] = useState(false);
  const [customModels, setCustomModels] = useState<CustomModel[]>(() => getCustomModels());
  const [formData, setFormData] = useState({
    value: "",
    label: "",
    baseUrl: "",
    token: "",
    maxTokens: 4096,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.value || !formData.label || !formData.baseUrl) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const newModel = saveCustomModel({
        value: formData.value,
        label: formData.label,
        baseUrl: formData.baseUrl,
        token: formData.token,
        maxTokens: formData.maxTokens || 4096,
      });

      setCustomModels(getCustomModels());
      onModelAdded(newModel);
      setFormData({
        value: "",
        label: "",
        baseUrl: "",
        token: "",
        maxTokens: 4096,
      });
      setOpen(false);
      toast.success("Custom model added successfully!");
    } catch (error) {
      toast.error("Failed to add custom model");
    }
  };

  const handleDelete = (id: string) => {
    try {
      deleteCustomModel(id);
      setCustomModels(getCustomModels());
      toast.success("Custom model deleted");
    } catch (error) {
      toast.error("Failed to delete custom model");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-neutral-300 text-sm">Custom Models</p>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7">
              <Plus className="size-3 mr-1" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Custom Model</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-200 block mb-1">
                  Model Name *
                </label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., My Custom GPT"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-200 block mb-1">
                  Model Value *
                </label>
                <Input
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="e.g., gpt-4o-mini"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-200 block mb-1">
                  Base URL *
                </label>
                <Input
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="e.g., https://api.openai.com/v1"
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-200 block mb-1">
                  API Token
                </label>
                <Input
                  type="password"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                  placeholder="Your API key (optional)"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-200 block mb-1">
                  Max Tokens
                </label>
                <Input
                  type="number"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  min="1"
                  max="2000000"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  Add Model
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {customModels.length > 0 && (
        <div className="space-y-2">
          {customModels.map((model) => (
            <div
              key={model.id}
              className="flex items-center justify-between p-2 bg-neutral-800 rounded-md text-sm"
            >
              <div>
                <p className="font-medium text-neutral-200">{model.label}</p>
                <p className="text-xs text-neutral-400">{model.value}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(model.id)}
                className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
