"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Image as ImageIcon, FlaskConical, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, ApiClientError } from "@/lib/api/client";
import type { AttachmentSummary, AttachmentType } from "@/modules/medical-records/domain/entities";

const FILE_TYPE_ICON: Record<AttachmentType, typeof FileText> = {
  PDF: FileText,
  IMAGEN: ImageIcon,
  LABORATORIO: FlaskConical,
};

const FILE_TYPE_LABEL: Record<AttachmentType, string> = {
  PDF: "PDF",
  IMAGEN: "Imagen",
  LABORATORIO: "Laboratorio",
};

export function AttachmentList({ entryId, attachments }: { entryId: string; attachments: AttachmentSummary[] }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState<AttachmentType>("PDF");
  const [label, setLabel] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/clinical/records/${entryId}/attachments`, {
        method: "POST",
        body: { fileUrl, fileType, label },
      }),
    onSuccess: () => {
      toast.success("Adjunto agregado.");
      queryClient.invalidateQueries({ queryKey: ["medical-entry", entryId] });
      setFileUrl("");
      setLabel("");
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "No se pudo agregar el adjunto.");
    },
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adjuntos</p>

      {attachments.length === 0 && !showForm && <p className="text-sm text-muted-foreground">Sin adjuntos.</p>}

      <div className="space-y-1">
        {attachments.map((a) => {
          const Icon = FILE_TYPE_ICON[a.fileType];
          return (
            <a
              key={a.attachmentId}
              href={a.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-muted"
            >
              <Icon className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate">{a.label || FILE_TYPE_LABEL[a.fileType]}</span>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            </a>
          );
        })}
      </div>

      {showForm ? (
        <div className="space-y-2 rounded-md border border-border p-2">
          <Input
            data-testid="attachment-file-url"
            placeholder="https://..."
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <Select value={fileType} onValueChange={(v) => setFileType(v as AttachmentType)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="IMAGEN">Imagen</SelectItem>
                <SelectItem value="LABORATORIO">Laboratorio</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Etiqueta (opcional)" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!fileUrl || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              Guardar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(true)}>
          <Plus className="size-3.5" /> Agregar adjunto
        </Button>
      )}
    </div>
  );
}
