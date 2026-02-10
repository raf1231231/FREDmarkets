"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import TemplateGrid from "@/components/create/TemplateGrid";
import CreateMarketForm from "@/components/create/CreateMarketForm";
import { MarketTemplate, CreateMarketFormState } from "@/types/template";
import { templateToFormState } from "@/data/marketTemplates";

export default function CreateMarketPage() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<MarketTemplate | null>(null);
  const [formState, setFormState] = useState<CreateMarketFormState | null>(
    null
  );

  function handleSelect(template: MarketTemplate) {
    setSelectedTemplate(template);
    setFormState(templateToFormState(template));
  }

  function handleBack() {
    setSelectedTemplate(null);
    setFormState(null);
  }

  function handleFieldChange<K extends keyof CreateMarketFormState>(
    field: K,
    value: CreateMarketFormState[K]
  ) {
    setFormState((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  function handleOutcomeLabelChange(index: number, value: string) {
    setFormState((prev) => {
      if (!prev) return prev;
      const labels = [...prev.outcomeLabels];
      labels[index] = value;
      return { ...prev, outcomeLabels: labels };
    });
  }

  return (
    <div>
      <PageHeader
        title="Create Market"
        subtitle={
          selectedTemplate
            ? `Configuring ${selectedTemplate.seriesName} market`
            : "Choose a template to get started"
        }
      />

      {!selectedTemplate || !formState ? (
        <TemplateGrid onSelect={handleSelect} />
      ) : (
        <CreateMarketForm
          templateName={selectedTemplate.seriesName}
          formState={formState}
          onFieldChange={handleFieldChange}
          onBack={handleBack}
          onOutcomeLabelChange={handleOutcomeLabelChange}
        />
      )}
    </div>
  );
}
