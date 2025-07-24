import { useState, useEffect } from "react";
import { useAppStore } from "@/shared/store/app-store";
import { COLLECTIONS, CONFIG_KEYS } from "@/shared/constants";
import { OpenAI } from "openai";
import { toast } from "sonner";

export function useAI() {
  const { pb } = useAppStore();
  const [aiInfo, setAIInfo] = useState({ endpoint: "", apiKey: "", model: "" });
  const [openAIInstance, setOpenAIInstance] = useState<OpenAI | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false); // Added loading state
  const [modelsLoading, setModelsLoading] = useState(false);
  const fetchAIInfo = async () => {
    if (!pb) return;
    try {
      const config = await pb
        .collection(COLLECTIONS.CONFIG)
        .getFirstListItem(`key='${CONFIG_KEYS.AI_INFO}'`);
      if (config?.value) {
        const parsedValue = JSON.parse(config.value);
        setAIInfo({
          endpoint: parsedValue.endpoint || "",
          apiKey: parsedValue.apiKey || "",
          model: parsedValue.model || "",
        });
      }
    } catch (error) {
      console.error("Error fetching AI_INFO:", error);
    }
  };

  useEffect(() => {
    fetchAIInfo();
  }, [pb]);

  useEffect(() => {
    if (aiInfo.apiKey) {
      setLoading(true); // Set loading to true when initializing
      const configuration = new OpenAI({
        apiKey: aiInfo.apiKey,
        baseURL: aiInfo.endpoint,
        dangerouslyAllowBrowser: true,
      });
      setOpenAIInstance(configuration);
      setLoading(false); // Set loading to false after initialization
    }
  }, [aiInfo.model]);

  const saveAIInfo = async (
    endpoint: string,
    apiKey: string,
    model: string
  ) => {
    if (!pb) return;
    try {
      const value = JSON.stringify({ endpoint, apiKey, model });
      let existingConfig: any = null;
      try {
        existingConfig = await pb
          .collection(COLLECTIONS.CONFIG)
          .getFirstListItem(`key='${CONFIG_KEYS.AI_INFO}'`);
      } catch (error) {
        console.error("Error fetching existing AI_INFO config:", error);
      }

      if (existingConfig) {
        await pb.collection(COLLECTIONS.CONFIG).update(existingConfig.id, {
          value,
        });
      } else {
        await pb.collection(COLLECTIONS.CONFIG).create({
          key: CONFIG_KEYS.AI_INFO,
          value,
        });
      }

      setAIInfo({ endpoint, apiKey, model });
      toast("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving AI_INFO:", error);
      toast("Failed to save settings.");
    }
  };

  const getModels = async (
    apiKey: string = aiInfo.apiKey,
    endpoint: string = aiInfo.endpoint
  ) => {
    if (!apiKey || !endpoint) {
      console.warn("API Key or Endpoint is not set.");
      return;
    }
    if (modelsLoading) return; // Prevent fetching models multiple times
    setModelsLoading(true);
    const oaiInstance = new OpenAI({
      apiKey,
      baseURL: endpoint,
      dangerouslyAllowBrowser: true,
    });
    try {
      const response = await oaiInstance.models.list();
      const modelNames = response.data.map((model) => model.id);
      setModels(modelNames);
    } catch (error) {
      console.error("Error fetching models:", error);
    }
    setModelsLoading(false); // Reset models loading state
  };

  return {
    aiInfo,
    openAIInstance,
    saveAIInfo,
    fetchAIInfo,
    getModels,
    models,
    loading,
    modelsLoading,
  };
}
