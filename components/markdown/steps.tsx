import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownStepsProps {
  children: string;
  isPdfMode?: boolean;
}

export function MarkdownSteps({
  children,
  isPdfMode = false,
}: MarkdownStepsProps) {
  const steps = children
    .split(/\n/)
    .filter((line) => line.trim())
    .map((line) => line.replace(/^\d+\.\s*/, ""));

  const circleBg = isPdfMode ? "bg-blue-600" : "bg-primary";
  const circleText = isPdfMode ? "text-white" : "text-primary-foreground";
  const textColor = isPdfMode ? "text-gray-600" : "text-muted-foreground";

  return (
    <div className="my-4 space-y-4">
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full ${circleBg} ${circleText} flex items-center justify-center text-sm font-semibold`}
          >
            {index + 1}
          </div>
          <div className={`flex-1 pt-1 text-sm ${textColor}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{step}</ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
}
