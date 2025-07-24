import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/shared/components/ui/popover";
import { useAI } from "@/shared/hooks/useAI";
import { Combobox } from "@/shared/components/ui/combobox";
import { Input } from "@/shared/components/ui/input";
import { Button } from "./ui/button";

const AIChatSettings = ({ children }: { children?: React.ReactNode }) => {
  const { aiInfo, saveAIInfo, getModels, models, modelsLoading } = useAI();
  const [endpoint, setEndpoint] = useState(aiInfo.endpoint);
  const [apiKey, setApiKey] = useState(aiInfo.apiKey);
  const [model, setModel] = useState(aiInfo.model);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEndpoint(aiInfo.endpoint);
    setApiKey(aiInfo.apiKey);
    setModel(aiInfo.model);
  }, [aiInfo]);

  useEffect(() => {
    if (apiKey || endpoint) {
      getModels(apiKey, endpoint);
    }
  }, [apiKey, endpoint]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveAIInfo(endpoint, apiKey, model);
    setIsSaving(false);
  };

  return (
    <Popover>
      <PopoverTrigger>
        {children || <button className="btn">AI Settings</button>}
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="endpoint" className="block font-medium text-sm">
              Endpoint
            </label>
            <Input
              id="endpoint"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="Enter API endpoint"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="apiKey" className="block font-medium text-sm">
              API Key
            </label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="model" className="block font-medium text-sm">
              Model
            </label>
            <Combobox
              isLoading={modelsLoading}
              options={models.map((modelName) => ({
                value: modelName,
                label: modelName,
              }))}
              value={model}
              onChange={setModel}
              placeholder="Select a model"
            />
          </div>
          <div className="flex justify-end">
            <Button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AIChatSettings;
