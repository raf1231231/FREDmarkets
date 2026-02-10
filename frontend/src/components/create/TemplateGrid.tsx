import { MarketTemplate } from "@/types/template";
import {
  CATEGORY_ORDER,
  CATEGORY_META,
  MARKET_TEMPLATES,
} from "@/data/marketTemplates";
import TemplateCard from "./TemplateCard";

interface TemplateGridProps {
  onSelect: (template: MarketTemplate) => void;
}

export default function TemplateGrid({ onSelect }: TemplateGridProps) {
  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.map((category) => {
        const templates = MARKET_TEMPLATES.filter(
          (t) => t.category === category
        );
        if (templates.length === 0) return null;

        return (
          <section key={category}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-fred-blue rounded-full" />
              <h2 className="text-lg font-semibold text-fred-navy">
                {CATEGORY_META[category].label}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => onSelect(template)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
