import { Link } from "react-router";
import { RotateCw } from "lucide-react";
import { OperatingSystemStagePage } from "./OperatingSystemStagePage";

export default function ServerSecretPostureScannerPage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[1500px] px-4 pt-4 sm:px-6 lg:px-8">
        <Link
          to="/key-rotation"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-muted"
        >
          <RotateCw className="h-4 w-4" aria-hidden />
          Rotate server keys on the Key rotation page
        </Link>
      </div>
      <OperatingSystemStagePage version="V73" />
    </>
  );
}
