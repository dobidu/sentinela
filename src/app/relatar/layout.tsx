import { ReportDraftProvider } from "./report-draft";
import { StepHeader } from "./step-header";

export default function ReportLayout({ children }: LayoutProps<"/relatar">) {
  return (
    <ReportDraftProvider>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <StepHeader />
        <main className="flex flex-1 flex-col gap-5 px-4 py-6">{children}</main>
      </div>
    </ReportDraftProvider>
  );
}
