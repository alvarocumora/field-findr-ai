import { lazy, Suspense } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LICANTEN_PROMO_PRICE } from "@/lib/easyCredit";

const Simulator = lazy(() =>
  import("@/components/fintech/EasyCreditSimulator").then((module) => ({
    default: module.EasyCreditSimulator,
  })),
);

/** Keep published project/PDF links working, without a full calculator on the landing. */
export default function LandingCreditDialog() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedPrice = Number(params.get("creditPrice"));
  const price =
    Number.isFinite(requestedPrice) &&
    requestedPrice > 0 &&
    requestedPrice <= 1_000_000_000
      ? requestedPrice
      : LICANTEN_PROMO_PRICE;
  return (
    <Dialog
      open={location.hash === "#simula-tu-cuota"}
      onOpenChange={(open) => {
        if (!open)
          navigate(
            { pathname: location.pathname, search: location.search, hash: "" },
            { replace: true },
          );
      }}
    >
      <DialogContent className="theme-rural max-h-[90dvh] max-w-4xl overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-6 text-left sm:px-8">
          <DialogTitle>Explora tus opciones de pago</DialogTitle>
          <DialogDescription>
            Simulación referencial de Valle Escondido · Licantén. Ajusta los
            valores y consulta las condiciones con el equipo.
          </DialogDescription>
        </DialogHeader>
        <Suspense
          fallback={
            <p role="status" className="p-8 text-sm text-muted-foreground">
              Cargando simulador…
            </p>
          }
        >
          <Simulator
            key={price}
            defaultPrice={price}
            lotId={params.get("creditLot")}
          />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
