import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText, Download, CheckCircle } from 'lucide-react';
import SignatureCanvas from './SignatureCanvas';
import { toast } from 'sonner';

interface ContractSigningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractData: {
    projectName: string;
    lotNumber: string;
    buyerName: string;
    amount: string;
  };
  onSign?: (signatureDataUrl: string) => void;
}

const ContractSigningDialog = ({ open, onOpenChange, contractData, onSign }: ContractSigningDialogProps) => {
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const handleSign = () => {
    if (!signatureDataUrl || !acceptedTerms) return;
    setIsSigned(true);
    onSign?.(signatureDataUrl);
    toast.success('Contrato firmado exitosamente', {
      description: 'La firma ha sido registrada y se adjuntará al documento.',
    });
  };

  const handleClose = () => {
    setSignatureDataUrl(null);
    setAcceptedTerms(false);
    setIsSigned(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Firma de Contrato
          </DialogTitle>
          <DialogDescription>
            Revise los datos y firme digitalmente el documento.
          </DialogDescription>
        </DialogHeader>

        {isSigned ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold">¡Contrato firmado!</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Su firma ha sido registrada y se adjuntará al documento PDF de la Promesa de Compraventa.
            </p>
            <Button onClick={handleClose} className="mt-4">Cerrar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Contract summary */}
            <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/30">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Proyecto</span>
                <span className="font-medium">{contractData.projectName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lote</span>
                <span className="font-medium">{contractData.lotNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comprador</span>
                <span className="font-medium">{contractData.buyerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monto</span>
                <Badge variant="secondary">{contractData.amount}</Badge>
              </div>
            </div>

            {/* Signature canvas */}
            <SignatureCanvas
              onSave={setSignatureDataUrl}
              width={440}
              height={160}
              label="Su firma"
            />

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(c) => setAcceptedTerms(!!c)}
              />
              <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                Declaro que he leído y acepto los términos de la Promesa de Compraventa. Entiendo que esta firma digital tiene validez como manifestación de voluntad conforme al artículo 1554 del Código Civil chileno.
              </Label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                onClick={handleSign}
                disabled={!signatureDataUrl || !acceptedTerms}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Firmar contrato
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContractSigningDialog;
